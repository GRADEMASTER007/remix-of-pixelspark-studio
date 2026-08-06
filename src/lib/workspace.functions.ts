import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    let { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

    if (!profile) {
      const inserted = await supabase
        .from("profiles")
        .insert({ id: userId })
        .select("*")
        .maybeSingle();
      profile = inserted.data;
    }

    const [assetsRes, jobsRes, presetsRes] = await Promise.all([
      supabase
        .from("assets")
        .select("id, filename, format, original_bytes, optimized_bytes, width, height, status, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("jobs")
        .select("id, job_type, preset_name, image_count, bytes_saved, status, created_at, finished_at")
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("presets")
        .select("id, name, kind, settings, is_favorite, created_at")
        .order("created_at", { ascending: false }),
    ]);

    const assets = assetsRes.data ?? [];
    const jobs = jobsRes.data ?? [];

    const originalTotal = assets.reduce((sum, a) => sum + Number(a.original_bytes ?? 0), 0);
    const optimizedTotal = assets.reduce(
      (sum, a) => sum + Number(a.optimized_bytes ?? a.original_bytes ?? 0),
      0,
    );

    return {
      profile,
      assets,
      jobs,
      presets: presetsRes.data ?? [],
      stats: {
        imagesOptimized: assets.length,
        originalTotal,
        optimizedTotal,
        bytesSaved: Math.max(0, originalTotal - optimizedTotal),
        savedRatio: originalTotal ? 1 - optimizedTotal / originalTotal : 0,
        bulkJobs: jobs.length,
      },
    };
  });

export const savePreset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().trim().min(1).max(60),
        kind: z.enum(["compression", "resize", "export", "social", "developer", "brand"]),
        notes: z.string().trim().max(240).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("presets").insert({
      user_id: context.userId,
      name: data.name,
      kind: data.kind,
      settings: { notes: data.notes ?? "" },
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePreset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("presets").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        display_name: z.string().trim().max(80).optional(),
        company: z.string().trim().max(80).optional(),
        currency: z.enum(["ZAR", "USD"]).optional(),
        plan: z.enum(["free", "weekly", "monthly", "annual"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        updated_at: new Date().toISOString(),
        ...(data.display_name !== undefined ? { display_name: data.display_name } : {}),
        ...(data.company !== undefined ? { company: data.company } : {}),
        ...(data.currency !== undefined ? { currency: data.currency } : {}),
        ...(data.plan !== undefined ? { plan: data.plan } : {}),
      })
      .eq("id", context.userId);


    if (error) throw new Error(error.message);
    return { ok: true };
  });
