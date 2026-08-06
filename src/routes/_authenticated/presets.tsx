import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { deletePreset, getWorkspace, savePreset } from "@/lib/workspace.functions";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const KINDS = ["compression", "resize", "export", "social", "developer", "brand"] as const;
type Kind = (typeof KINDS)[number];

export const Route = createFileRoute("/_authenticated/presets")({
  head: () => ({
    meta: [
      { title: "Presets — PixelForge AI" },
      {
        name: "description",
        content:
          "Save and reuse compression, resize, export, social and brand presets across your image batches.",
      },
      { property: "og:title", content: "Presets — PixelForge AI" },
      {
        property: "og:description",
        content: "Reusable compression, resize, export and brand presets for bulk batches.",
      },
    ],
  }),
  component: PresetsPage,
});

function PresetsPage() {
  const fetchWorkspace = useServerFn(getWorkspace);
  const create = useServerFn(savePreset);
  const remove = useServerFn(deletePreset);
  const queryClient = useQueryClient();

  const { data } = useQuery({ queryKey: ["workspace"], queryFn: () => fetchWorkspace() });
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Kind>("compression");
  const [notes, setNotes] = useState("");

  const createMutation = useMutation({
    mutationFn: () => create({ data: { name, kind, notes } }),
    onSuccess: () => {
      setName("");
      setNotes("");
      toast.success("Preset saved");
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not save preset"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Preset removed");
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not remove preset"),
  });

  const presets = data?.presets ?? [];

  return (
    <AppShell
      title="Presets"
      subtitle="Reusable compression, resize, export and brand recipes"
      plan={data?.profile?.plan}
      email={data?.profile?.display_name}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <section className="panel p-5">
          <h2 className="text-sm font-semibold">Saved presets</h2>
          {presets.length === 0 ? (
            <p className="mt-4 rounded-md border border-dashed border-border-strong px-5 py-10 text-center text-sm text-muted-foreground">
              No presets yet. Save your first recipe on the right — it becomes selectable on every
              batch you run.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {presets.map((preset) => (
                <li key={preset.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-sm font-medium">
                      {preset.is_favorite && <Star className="size-3.5 text-signal" />}
                      {preset.name}
                    </p>
                    <p className="label-mono mt-1">
                      {preset.kind} · {formatDate(preset.created_at)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${preset.name}`}
                    onClick={() => deleteMutation.mutate(preset.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel h-fit p-5">
          <h2 className="text-sm font-semibold">New preset</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!name.trim()) {
                toast.error("Give the preset a name");
                return;
              }
              createMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="preset-name">Name</Label>
              <Input
                id="preset-name"
                value={name}
                maxLength={60}
                placeholder="Shopify product · WebP 82"
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preset-kind">Type</Label>
              <Select value={kind} onValueChange={(value) => setKind(value as Kind)}>
                <SelectTrigger id="preset-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KINDS.map((option) => (
                    <SelectItem key={option} value={option} className="capitalize">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="preset-notes">Notes</Label>
              <Input
                id="preset-notes"
                value={notes}
                maxLength={240}
                placeholder="Max 1600px, strip EXIF, keep colour profile"
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving…" : "Save preset"}
            </Button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
