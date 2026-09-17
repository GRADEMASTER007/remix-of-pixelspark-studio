import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  LayoutGrid,
  Images,
  SlidersHorizontal,
  CreditCard,
  LogOut,
  Hexagon,
  UploadCloud,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PLAN_LABELS } from "@/lib/plans";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutGrid },
  { to: "/optimize", label: "Optimise", icon: UploadCloud },
  { to: "/assets", label: "Assets", icon: Images },
  { to: "/presets", label: "Presets", icon: SlidersHorizontal },
  { to: "/billing", label: "Billing", icon: CreditCard },
] as const;

export function AppShell({
  children,
  title,
  subtitle,
  plan,
  email,
  actions,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string | undefined;
  plan?: string | null | undefined;
  email?: string | null | undefined;
  actions?: ReactNode | undefined;
}) {

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <Hexagon className="size-5 text-primary" strokeWidth={2.5} />
          <span className="font-display text-sm font-bold tracking-tight">PixelForge AI</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <item.icon className={cn("size-4", active && "text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="rounded-md bg-surface-raised px-3 py-3">
            <p className="label-mono">Plan</p>
            <p className="mt-1 text-sm font-medium">{PLAN_LABELS[plan ?? "free"] ?? "Free trial"}</p>
            <p className="mt-2 truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <button
            onClick={signOut}
            className="mt-2 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-background/85 px-5 py-4 backdrop-blur md:h-16 md:flex-row md:items-center md:justify-between md:py-0">
          <div>
            <h1 className="font-display text-lg font-semibold">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">{actions}</div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2 lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-xs",
                pathname === item.to
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 px-5 py-6">{children}</main>
      </div>
    </div>
  );
}
