import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDownRight, Gauge, HardDrive, Images, Layers, Zap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getWorkspace } from "@/lib/workspace.functions";
import { formatBytes, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Overview — PixelForge AI" },
      {
        name: "description",
        content:
          "Your PixelForge AI workspace overview: images optimised, bandwidth saved, credit usage and processing history.",
      },
      { property: "og:title", content: "Overview — PixelForge AI" },
      {
        property: "og:description",
        content: "Track optimisation output, credits and storage across your image pipeline.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const fetchWorkspace = useServerFn(getWorkspace);
  const { data, isLoading } = useQuery({
    queryKey: ["workspace"],
    queryFn: () => fetchWorkspace(),
  });

  const profile = data?.profile;
  const stats = data?.stats;

  return (
    <AppShell
      title="Overview"
      subtitle="Pipeline output, credits and storage"
      plan={profile?.plan}
      email={profile?.display_name}
      actions={
        <Badge variant="outline" className="border-signal/40 text-signal">
          Engine online
        </Badge>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={Images}
          label="Images optimised"
          value={formatNumber(stats?.imagesOptimized ?? 0)}
          hint="lifetime in this workspace"
          loading={isLoading}
        />
        <Metric
          icon={ArrowDownRight}
          label="Bytes saved"
          value={formatBytes(stats?.bytesSaved ?? 0)}
          hint={`${Math.round((stats?.savedRatio ?? 0) * 100)}% average reduction`}
          loading={isLoading}
          accent
        />
        <Metric
          icon={Zap}
          label="Credits used"
          value={`${formatNumber(profile?.credits_used ?? 0)} / ${formatNumber(profile?.credits_included ?? 0)}`}
          hint="resets on renewal"
          loading={isLoading}
        />
        <Metric
          icon={HardDrive}
          label="Storage used"
          value={formatBytes(profile?.storage_used_bytes ?? 0)}
          hint={`of ${formatBytes(profile?.storage_included_bytes ?? 0)}`}
          loading={isLoading}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="panel p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent uploads</h2>
            <span className="label-mono">Last 50</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            {data?.assets.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="label-mono pb-2">File</th>
                    <th className="label-mono pb-2">Format</th>
                    <th className="label-mono pb-2">Before</th>
                    <th className="label-mono pb-2">After</th>
                    <th className="label-mono pb-2">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {data.assets.slice(0, 8).map((asset) => (
                    <tr key={asset.id} className="border-b border-border/60">
                      <td className="max-w-[220px] truncate py-2.5">{asset.filename}</td>
                      <td className="metric py-2.5 text-xs uppercase text-muted-foreground">
                        {asset.format}
                      </td>
                      <td className="metric py-2.5 text-muted-foreground">
                        {formatBytes(asset.original_bytes)}
                      </td>
                      <td className="metric py-2.5 text-signal">
                        {formatBytes(asset.optimized_bytes ?? asset.original_bytes)}
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground">
                        {formatDate(asset.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState
                title="No assets in this workspace yet"
                body="Once you push a batch through the optimiser, every source and optimised variant is tracked here with its size delta."
              />
            )}
          </div>
        </section>

        <section className="panel space-y-5 p-5">
          <div>
            <div className="flex items-center gap-2">
              <Gauge className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Quota</h2>
            </div>
            <div className="mt-4 space-y-4">
              <Quota
                label="Processing credits"
                used={profile?.credits_used ?? 0}
                total={profile?.credits_included ?? 0}
                render={formatNumber}
              />
              <Quota
                label="Cloud storage"
                used={Number(profile?.storage_used_bytes ?? 0)}
                total={Number(profile?.storage_included_bytes ?? 0)}
                render={formatBytes}
              />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">Bulk processing history</h2>
            </div>
            {data?.jobs.length ? (
              <ul className="mt-3 space-y-2.5">
                {data.jobs.slice(0, 6).map((job) => (
                  <li key={job.id} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate">
                      {job.job_type}
                      {job.preset_name ? (
                        <span className="text-muted-foreground"> · {job.preset_name}</span>
                      ) : null}
                    </span>
                    <span className="metric shrink-0 text-xs text-muted-foreground">
                      {formatNumber(job.image_count)} img · {formatBytes(job.bytes_saved)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No batches queued yet. Bulk jobs, queue position and per-run savings appear here.
              </p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  hint,
  loading,
  accent,
}: {
  icon: typeof Images;
  label: string;
  value: string;
  hint: string;
  loading?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <p className="label-mono">{label}</p>
        <Icon className={accent ? "size-4 text-signal" : "size-4 text-muted-foreground"} />
      </div>
      <p className={`metric mt-3 text-2xl font-bold ${accent ? "text-signal" : ""}`}>
        {loading ? "—" : value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Quota({
  label,
  used,
  total,
  render,
}: {
  label: string;
  used: number;
  total: number;
  render: (n: number) => string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm">{label}</p>
        <p className="metric text-xs text-muted-foreground">
          {render(used)} / {render(total)}
        </p>
      </div>
      <Progress value={formatPercent(used, total)} className="mt-2 h-1.5" />
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-dashed border-border-strong px-5 py-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
