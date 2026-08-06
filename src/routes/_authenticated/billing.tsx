import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { getWorkspace, updateProfile } from "@/lib/workspace.functions";
import { PLANS, formatPrice, type Currency } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({
    meta: [
      { title: "Billing — PixelForge AI" },
      {
        name: "description",
        content:
          "Manage your PixelForge AI subscription: weekly, monthly and annual plans priced in ZAR and USD.",
      },
      { property: "og:title", content: "Billing — PixelForge AI" },
      {
        property: "og:description",
        content: "Weekly, monthly and annual plans priced in ZAR and USD.",
      },
    ],
  }),
  component: BillingPage,
});

function BillingPage() {
  const fetchWorkspace = useServerFn(getWorkspace);
  const patchProfile = useServerFn(updateProfile);
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["workspace"], queryFn: () => fetchWorkspace() });

  const currency = (data?.profile?.currency ?? "ZAR") as Currency;

  const mutation = useMutation({
    mutationFn: (next: Currency) => patchProfile({ data: { currency: next } }),
    onSuccess: () => {
      toast.success("Billing currency updated");
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not update currency"),
  });

  return (
    <AppShell
      title="Billing"
      subtitle="Subscription, currency and included capacity"
      plan={data?.profile?.plan}
      email={data?.profile?.display_name}
      actions={
        <div className="flex rounded-md border border-border p-0.5">
          {(["ZAR", "USD"] as Currency[]).map((option) => (
            <button
              key={option}
              onClick={() => mutation.mutate(option)}
              className={cn(
                "metric rounded px-3 py-1 text-xs transition-colors",
                currency === option
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const active = data?.profile?.plan === plan.id;
          return (
            <section
              key={plan.id}
              className={cn(
                "panel flex flex-col p-5",
                plan.featured && "ring-1 ring-primary/40",
                active && "border-signal/50",
              )}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-semibold">{plan.name}</h2>
                {active ? (
                  <Badge variant="outline" className="border-signal/40 text-signal">
                    Current
                  </Badge>
                ) : plan.featured ? (
                  <Badge>Best value</Badge>
                ) : null}
              </div>
              <p className="mt-3">
                <span className="metric text-2xl font-bold">
                  {formatPrice(plan, currency)}
                </span>
                <span className="text-sm text-muted-foreground"> {plan.cadence}</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{plan.credits} · {plan.storage}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-signal" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-5"
                variant={plan.featured ? "default" : "secondary"}
                disabled={active}
                onClick={() =>
                  toast.info("Checkout via PayPal and YOCO is wired up in the payments step.")
                }
              >
                {active ? "Active plan" : `Choose ${plan.name}`}
              </Button>
            </section>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Prices shown in {currency}. South African customers are billed via YOCO; international
        customers via PayPal.
      </p>
    </AppShell>
  );
}
