import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const BUCKET = "pixelforge-assets";

const optimizeInput = z.object({
  path: z.string().min(1),
  filename: z.string().min(1).max(200),
  mimeType: z.enum(["image/jpeg", "image/jpg", "image/png"]),
  quality: z.number().int().min(30).max(100).default(75),
  maxWidth: z.number().int().min(16).max(8000).optional(),
  format: z.enum(["jpeg", "png"]).default("jpeg"),
  presetName: z.string().trim().max(60).optional(),
});

export const optimizeAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => optimizeInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (!data.path.startsWith(`${userId}/`)) throw new Error("Invalid upload path");

    const download = await supabase.storage.from(BUCKET).download(data.path);
    if (download.error || !download.data) throw new Error(download.error?.message ?? "Upload not found");

    const sourceBytes = new Uint8Array(await download.data.arrayBuffer());

    const { optimizeBytes } = await import("./image-engine.server");
    const result = optimizeBytes(sourceBytes, data.mimeType, {
      quality: data.quality,
      format: data.format,
      maxWidth: data.maxWidth,
    });

    const baseName = data.filename.replace(/\.[^.]+$/, "");
    const ext = data.format === "jpeg" ? "jpg" : "png";
    const optimizedPath = `${userId}/optimized/${crypto.randomUUID()}-${baseName}.${ext}`;

    const upload = await supabase.storage.from(BUCKET).upload(optimizedPath, result.bytes, {
      contentType: data.format === "jpeg" ? "image/jpeg" : "image/png",
      upsert: false,
    });
    if (upload.error) throw new Error(upload.error.message);

    const row = {
      user_id: userId,
      filename: data.filename,
      format: data.mimeType.replace("image/", ""),
      output_format: ext,
      original_bytes: sourceBytes.byteLength,
      optimized_bytes: result.bytes.byteLength,
      width: result.width,
      height: result.height,
      status: "completed",
      original_path: data.path,
      optimized_path: optimizedPath,
      preset_name: data.presetName ?? null,
    };

    const inserted = await supabase
      .from("assets")
      .insert(row as never)
      .select("id")
      .maybeSingle();
    if (inserted.error) throw new Error(inserted.error.message);

    const saved = Math.max(0, sourceBytes.byteLength - result.bytes.byteLength);

    await supabase.from("jobs").insert({
      user_id: userId,
      job_type: "optimize",
      preset_name: data.presetName ?? `${data.format.toUpperCase()} q${data.quality}`,
      image_count: 1,
      bytes_saved: saved,
      status: "completed",
      finished_at: new Date().toISOString(),
    } as never);


    return {
      id: inserted.data?.id ?? null,
      filename: data.filename,
      originalBytes: sourceBytes.byteLength,
      optimizedBytes: result.bytes.byteLength,
      width: result.width,
      height: result.height,
      sourceWidth: result.sourceWidth,
      sourceHeight: result.sourceHeight,
      savedRatio: sourceBytes.byteLength ? saved / sourceBytes.byteLength : 0,
      optimizedPath,
    };
  });

export const getAssetDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ path: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    if (!data.path.startsWith(`${context.userId}/`)) throw new Error("Invalid path");
    const signed = await context.supabase.storage.from(BUCKET).createSignedUrl(data.path, 60 * 10);
    if (signed.error || !signed.data) throw new Error(signed.error?.message ?? "Could not create link");
    return { url: signed.data.signedUrl };
  });
