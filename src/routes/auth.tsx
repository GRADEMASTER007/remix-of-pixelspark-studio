import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Hexagon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — PixelForge AI" },
      {
        name: "description",
        content:
          "Sign in or create a PixelForge AI account to optimise, resize and manage your image library.",
      },
      { property: "og:title", content: "Sign in — PixelForge AI" },
      {
        property: "og:description",
        content: "Access your PixelForge AI image optimisation workspace.",
      },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setPending(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          return;
        }
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setPending(false);
    }
  }

  async function handleGoogle() {
    setPending(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setPending(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-surface-raised p-10 lg:flex">
        <div className="grid-bg absolute inset-0 opacity-60" aria-hidden />
        <Link to="/" className="relative flex items-center gap-2">
          <Hexagon className="size-5 text-primary" strokeWidth={2.5} />
          <span className="font-display text-sm font-bold">PixelForge AI</span>
        </Link>
        <div className="relative max-w-sm">
          <h2 className="font-display text-2xl font-bold leading-tight">
            Ship images that load fast and look untouched.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            AI compression, platform-perfect resizing, bulk folder and ZIP pipelines, metadata and
            SEO tooling — in one studio built for teams.
          </p>
          <dl className="mt-8 grid grid-cols-3 gap-4">
            {[
              ["Formats", "8+"],
              ["Avg. saving", "72%"],
              ["Presets", "40+"],
            ].map(([label, value]) => (
              <div key={label}>
                <dd className="metric text-xl font-bold text-signal">{value}</dd>
                <dt className="label-mono mt-1">{label}</dt>
              </div>
            ))}
          </dl>
        </div>
        <p className="relative text-xs text-muted-foreground">
          Billed in ZAR or USD · YOCO &amp; PayPal
        </p>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <Hexagon className="size-5 text-primary" strokeWidth={2.5} />
            <span className="font-display text-sm font-bold">PixelForge AI</span>
          </Link>

          <h1 className="font-display text-xl font-semibold">
            {mode === "signin" ? "Sign in to your studio" : "Create your studio account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Welcome back. Pick up where your last batch left off."
              : "Start on the free tier — no card required."}
          </p>

          {sent ? (
            <div className="panel mt-6 p-5 text-sm">
              <p className="font-medium">Check your inbox</p>
              <p className="mt-2 text-muted-foreground">
                We sent a confirmation link to {email}. Click it to activate your account, then sign
                in.
              </p>
              <Button
                variant="secondary"
                className="mt-4 w-full"
                onClick={() => {
                  setSent(false);
                  setMode("signin");
                }}
              >
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="secondary"
                className="mt-6 w-full"
                onClick={handleGoogle}
                disabled={pending}
              >
                Continue with Google
              </Button>

              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="label-mono">or email</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@studio.co.za"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {mode === "signin" ? "Sign in" : "Create account"}
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                {mode === "signin" ? "No account yet?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  className="text-foreground underline underline-offset-4"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                >
                  {mode === "signin" ? "Create one" : "Sign in"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
