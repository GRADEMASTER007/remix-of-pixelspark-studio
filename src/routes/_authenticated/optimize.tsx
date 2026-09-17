import { useCallback, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { UploadCloud, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { getWorkspace } from "@/lib/workspace.functions";
import { optimizeAsset, BUCKET } from "@/lib/optimize.functions";
import { formatBytes, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/optimize")({
  head: () => ({
    meta: [
      { title: "Optimise — PixelForge AI" },
      {
        name: "description",
        content:
          "Drop images into PixelForge AI and compress, resize and convert them in the cloud with a live before/after size readout.",
      },
      { property: "og:title", content: "Optimise — PixelForge AI" },
      {
        property: "og:description",
        content: "Drag and drop images for cloud compression, resizing and conversion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OptimizePage,
});

type Item = {
  id: string;
  name: string;
  originalBytes: number;
  optimizedBytes?: number;
  width?: number;
  height?: number;
  sourceWidth?: number;
  sourceHeight?: number;
  status: "queued" | "uploading" | "processing" | "done" | "error";
  error?: string;
};

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png"];
const MAX_BYTES = 25 * 1024 * 1024;

function OptimizePage() {
  const queryClient = useQueryClient();
  const fetchWorkspace = useServerFn(getWorkspace);
  const runOptimize = useServerFn(optimizeAsset);
  const { data } = useQuery({ queryKey: ["workspace"], queryFn: () => fetchWorkspace() });

  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState<"jpeg" | "png">("jpeg");
  const [maxWidth, setMaxWidth] = useState("2000");
  const [dragging, setDragging] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const patch = (id: string, next: Partial<Item>) =>
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...next } : item)));

  const processFiles = useCallback(
    async (files: File[]) => {
      const userId = data?.profile?.id;
      if (!userId) {
        toast.error("Still loading your workspace — try again in a second.");
        return;
      }

      const valid = files.filter((file) => {
        if (!ACCEPTED.includes(file.type)) {
          toast.error(`${file.name}: only JPEG and PNG are supported right now.`);
          return false;
        }
        if (file.size > MAX_BYTES) {
          toast.error(`${file.name} is larger than 25 MB.`);
          return false;
        }
        return true;
      });
      if (valid.length === 0) return;

      const queued: Item[] = valid.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        originalBytes: file.size,
        status: "queued",
      }));
      setItems((prev) => [...queued, ...prev]);

      for (let i = 0; i < valid.length; i++) {
        const file = valid[i]!;
        const item = queued[i]!;
        try {
          patch(item.id, { status: "uploading" });
          const safeName = file.name.replace(/[^\w.\-]+/g, "_");
          const path = `${userId}/originals/${crypto.randomUUID()}-${safeName}`;
          const upload = await supabase.storage
            .from(BUCKET)
            .upload(path, file, { contentType: file.type, upsert: false });
          if (upload.error) throw new Error(upload.error.message);

          patch(item.id, { status: "processing" });
          const width = Number(maxWidth);
          const result = await runOptimize({
            data: {
              path,
              filename: file.name,
              mimeType: file.type as "image/jpeg" | "image/png",
              quality,
              format,
              ...(Number.isFinite(width) && width >= 16 ? { maxWidth: Math.round(width) } : {}),
            },
          });

          patch(item.id, {
            status: "done",
            optimizedBytes: result.optimizedBytes,
            width: result.width,
            height: result.height,
            sourceWidth: result.sourceWidth,
            sourceHeight: result.sourceHeight,
          });
        } catch (error) {
          patch(item.id, {
            status: "error",
            error: error instanceof Error ? error.message : "Optimisation failed",
          });
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["workspace"] });
      toast.success("Batch finished — results are in your Assets library.");
    },
    [data?.profile?.id, format, maxWidth, quality, queryClient, runOptimize],
  );

  const totals = items.reduce(
    (acc, item) => {
      if (item.status !== "done" || item.optimizedBytes === undefined) return acc;
      acc.original += item.originalBytes;
      acc.optimized += item.optimizedBytes;
      return acc;
    },
    { original: 0, optimized: 0 },
  );

  return (
    <AppShell
      title="Optimise"
      subtitle="Drag, drop and compress in the cloud"
      plan={data?.profile?.plan}
      email={data?.profile?.display_name}
    >
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void processFiles(Array.from(e.dataTransfer.files));
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "panel grid-field flex cursor-pointer flex-col items-center justify-center gap-3 px-6 py-16 text-center transition",
            dragging && "glow-ring border-primary",
          )}
        >
          <UploadCloud className="h-9 w-9 text-primary" />
          <h2 className="font-display text-lg font-semibold">Drop images here</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            JPEG or PNG, up to 25 MB each. Files are uploaded to your private cloud storage,
            optimised server-side, then listed with the exact size delta.
          </p>
          <Button type="button" variant="secondary" size="sm">
            Browse files
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => {
              void processFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </div>

        <div className="panel space-y-5 p-5">
          <h2 className="font-display text-sm font-semibold">Compression settings</h2>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="label-mono">Quality</Label>
              <span className="metric text-sm">{quality}</span>
            </div>
            <Slider
              value={[quality]}
              min={30}
              max={100}
              step={1}
              onValueChange={(v) => setQuality(v[0] ?? 75)}
            />
          </div>

          <div className="space-y-2">
            <Label className="label-mono">Output format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as "jpeg" | "png")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jpeg">JPEG — smallest for photos</SelectItem>
                <SelectItem value="png">PNG — keeps transparency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="label-mono">Max width (px)</Label>
            <Input
              value={maxWidth}
              inputMode="numeric"
              onChange={(e) => setMaxWidth(e.target.value.replace(/\D/g, ""))}
              placeholder="2000"
            />
            <p className="text-xs text-muted-foreground">
              Larger images are scaled down proportionally. Leave blank to keep original size.
            </p>
          </div>

          {totals.original > 0 && (
            <div className="rounded-md border border-border/60 bg-background/40 p-3">
              <p className="label-mono">Session savings</p>
              <p className="metric mt-1 text-lg text-signal">
                {formatBytes(Math.max(0, totals.original - totals.optimized))}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatPercent(totals.original - totals.optimized, totals.original)}% smaller across{" "}
                {items.filter((i) => i.status === "done").length} files
              </p>
            </div>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div className="panel mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="label-mono px-4 py-3">File</th>
                <th className="label-mono px-4 py-3">Before</th>
                <th className="label-mono px-4 py-3">After</th>
                <th className="label-mono px-4 py-3">Saved</th>
                <th className="label-mono px-4 py-3">Dimensions</th>
                <th className="label-mono px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const after = item.optimizedBytes;
                const saved = after === undefined ? 0 : Math.max(0, item.originalBytes - after);
                return (
                  <tr key={item.id} className="border-b border-border/60">
                    <td className="max-w-[240px] truncate px-4 py-3">{item.name}</td>
                    <td className="metric px-4 py-3 text-muted-foreground">
                      {formatBytes(item.originalBytes)}
                    </td>
                    <td className="metric px-4 py-3">
                      {after === undefined ? "—" : formatBytes(after)}
                    </td>
                    <td className="metric px-4 py-3 text-signal">
                      {after === undefined
                        ? "—"
                        : `${formatBytes(saved)} · ${formatPercent(saved, item.originalBytes)}%`}
                    </td>
                    <td className="metric px-4 py-3 text-xs text-muted-foreground">
                      {item.width && item.height
                        ? `${item.sourceWidth}×${item.sourceHeight} → ${item.width}×${item.height}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {item.status === "done" ? (
                        <span className="flex items-center gap-1.5 text-signal">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Done
                        </span>
                      ) : item.status === "error" ? (
                        <span
                          className="flex items-center gap-1.5 text-destructive"
                          title={item.error}
                        >
                          <AlertTriangle className="h-3.5 w-3.5" /> Failed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          {item.status === "uploading" ? "Uploading" : "Optimising"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
