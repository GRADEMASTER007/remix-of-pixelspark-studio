import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app-shell";
import { getWorkspace } from "@/lib/workspace.functions";
import { formatBytes, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { getAssetDownloadUrl } from "@/lib/optimize.functions";

export const Route = createFileRoute("/_authenticated/assets")({
  head: () => ({
    meta: [
      { title: "Assets — PixelForge AI" },
      {
        name: "description",
        content:
          "Browse every source image and optimised variant stored in your PixelForge AI cloud workspace.",
      },
      { property: "og:title", content: "Assets — PixelForge AI" },
      {
        property: "og:description",
        content: "Every source image and optimised variant in your cloud workspace.",
      },
    ],
  }),
  component: AssetsPage,
});

function AssetsPage() {
  const fetchWorkspace = useServerFn(getWorkspace);
  const getDownloadUrl = useServerFn(getAssetDownloadUrl);

  const download = async (path: string | null) => {
    if (!path) return;
    try {
      const { url } = await getDownloadUrl({ data: { path } });
      window.open(url, "_blank", "noopener");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create download link");
    }
  };

  const { data } = useQuery({ queryKey: ["workspace"], queryFn: () => fetchWorkspace() });
  const assets = data?.assets ?? [];

  return (
    <AppShell
      title="Assets"
      subtitle="Sources, optimised variants and export history"
      plan={data?.profile?.plan}
      email={data?.profile?.display_name}
      actions={<Badge variant="secondary">{assets.length} stored</Badge>}
    >
      {assets.length === 0 ? (
        <div className="panel px-6 py-16 text-center">
          <h2 className="font-display text-base font-semibold">Your library is empty</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Assets appear here as soon as batches run through the optimiser — originals, optimised
            variants, dimensions and the exact size delta for each file.
          </p>
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="label-mono px-4 py-3">File</th>
                <th className="label-mono px-4 py-3">Format</th>
                <th className="label-mono px-4 py-3">Dimensions</th>
                <th className="label-mono px-4 py-3">Original</th>
                <th className="label-mono px-4 py-3">Optimised</th>
                <th className="label-mono px-4 py-3">Saved</th>
                <th className="label-mono px-4 py-3">Added</th>
                <th className="label-mono px-4 py-3 text-right">File</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => {
                const original = Number(asset.original_bytes ?? 0);
                const optimized = Number(asset.optimized_bytes ?? original);
                const saved = Math.max(0, original - optimized);
                return (
                  <tr key={asset.id} className="border-b border-border/60">
                    <td className="max-w-[260px] truncate px-4 py-3">{asset.filename}</td>
                    <td className="metric px-4 py-3 text-xs uppercase text-muted-foreground">
                      {asset.format}
                    </td>
                    <td className="metric px-4 py-3 text-xs text-muted-foreground">
                      {asset.width && asset.height ? `${asset.width}×${asset.height}` : "—"}
                    </td>
                    <td className="metric px-4 py-3 text-muted-foreground">
                      {formatBytes(original)}
                    </td>
                    <td className="metric px-4 py-3">{formatBytes(optimized)}</td>
                    <td className="metric px-4 py-3 text-signal">{formatBytes(saved)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(asset.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {asset.optimized_path ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void download(asset.optimized_path)}
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
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
