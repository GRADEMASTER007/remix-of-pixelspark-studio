import heroStudio from "@/assets/hero-studio.jpg";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Crop,
  FileArchive,
  Fingerprint,
  Gauge,
  Hexagon,
  Layers,
  Tags,
  Terminal,
} from "lucide-react";
import { useState } from "react";
import { PLANS, formatPrice, type Currency } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PixelForge AI — AI Image Optimizer & Digital Asset Studio" },
      {
        name: "description",
        content:
          "Compress, resize and convert images with AI. Bulk folder and ZIP pipelines, platform presets, metadata and SEO tooling, plus a full asset studio. ZAR and USD plans.",
      },
      { property: "og:title", content: "PixelForge AI — AI Image Optimizer & Asset Studio" },
      {
        property: "og:description",
        content:
          "AI image compression, resizing and format conversion with bulk pipelines, metadata tooling and asset management.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Gauge,
    title: "AI optimisation engine",
    body: "Per-image quality analysis picks the ideal encoder and settings across JPEG, PNG, WebP, AVIF, SVG and GIF — typically 60–85% smaller with no visible loss.",
  },
  {
    icon: Crop,
    title: "Platform-perfect resizing",
    body: "Presets for CMS themes, marketplaces, social channels and mobile app icon sets. Smart crop keeps the subject centred at every aspect ratio.",
  },
  {
    icon: FileArchive,
    title: "Bulk folders & ZIP",
    body: "Drop a folder or archive and the queue handles thousands of files, preserving your directory structure on export.",
  },
  {
    icon: Fingerprint,
    title: "Digital fingerprint manager",
    body: "Generate uniquely fingerprinted variants of your own assets per channel or client, with a tracked provenance record for each variant.",
  },
  {
    icon: Tags,
    title: "Metadata & SEO generator",
    body: "Edit or strip EXIF/IPTC in bulk and generate alt text, filenames and captions tuned for search and accessibility.",
  },
  {
    icon: Layers,
    title: "Digital asset studio",
    body: "One library for sources, variants and exports — searchable, versioned and shareable across your team.",
  },
];

function Landing() {
  const [currency, setCurrency] = useState<Currency>("ZAR");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2">
            <Hexagon className="size-5 text-primary" strokeWidth={2.5} />
            <span className="font-display text-sm font-bold tracking-tight">PixelForge AI</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">
              Platform
            </a>
            <a href="#pricing" className="hover:text-foreground">
              Pricing
            </a>
            <a href="#api" className="hover:text-foreground">
              API
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border">
        <div className="grid-bg absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-20 md:py-28 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div>
          <Badge variant="outline" className="border-primary/40 text-primary">
            Built for developers, designers &amp; agencies
          </Badge>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            AI image optimisation and a full{" "}
            <span className="text-signal">digital asset studio</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            Compress, resize and convert at scale without losing fidelity. Bulk folder pipelines,
            platform presets, metadata and SEO tooling, and a managed library for every variant you
            ship.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">
                Start optimising free
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <a href="#pricing">See plans</a>
            </Button>
          </div>
          </div>
          <img
            src={heroStudio}
            alt="PixelForge AI optimisation dashboard comparing original and optimised image sizes"
            width={1280}
            height={1024}
            className="w-full rounded-lg border border-border shadow-2xl"
          />
        </div>
        <div className="relative mx-auto max-w-6xl px-5 pb-16">

          <dl className="grid max-w-2xl grid-cols-2 gap-8 border-t border-border pt-8 sm:grid-cols-4">
            {[
              ["Avg. size cut", "72%"],
              ["Formats", "8+"],
              ["Presets", "40+"],
              ["Batch limit", "10k files"],
            ].map(([label, value]) => (
              <div key={label}>
                <dd className="metric text-2xl font-bold">{value}</dd>
                <dt className="label-mono mt-1">{label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          One pipeline, every asset job
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Replace the pile of one-off tools with a studio your whole team can run.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="panel p-5">
              <feature.icon className="size-5 text-primary" />
              <h3 className="mt-4 font-display text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="api" className="border-y border-border bg-surface-raised">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <Terminal className="size-5 text-primary" />
            <h2 className="mt-4 font-display text-2xl font-bold tracking-tight md:text-3xl">
              Developer API &amp; webhooks
            </h2>
            <p className="mt-3 text-muted-foreground">
              Drive the same engine from your build step, CMS or backend. Keys are scoped per
              project, usage is metered against your plan credits, and webhooks report every batch
              result.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {[
                "REST endpoints for optimise, resize and convert",
                "Signed webhooks per job completion",
                "Per-key usage metering and rate limits",
                "Admin panel for team keys and quotas",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-signal" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <pre className="panel overflow-x-auto p-5 text-xs leading-relaxed">
            <code className="metric text-muted-foreground">{`POST /v1/optimize
Authorization: Bearer pf_live_••••

{
  "source": "https://cdn.site.co.za/hero.png",
  "preset": "web-hero-webp",
  "target": { "format": "avif", "maxWidth": 1920 }
}

200 OK
{
  "bytes_in": 2841204,
  "bytes_out": 318774,
  "saved": "88.8%",
  "asset_id": "ast_9f2b71"
}`}</code>
          </pre>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-5 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              Simple plans, local currency
            </h2>
            <p className="mt-3 text-muted-foreground">
              Billed in ZAR through YOCO or in USD through PayPal. Cancel anytime.
            </p>
          </div>
          <div className="flex rounded-md border border-border p-0.5">
            {(["ZAR", "USD"] as Currency[]).map((option) => (
              <button
                key={option}
                onClick={() => setCurrency(option)}
                className={cn(
                  "metric rounded px-3 py-1.5 text-xs transition-colors",
                  currency === option
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className={cn("panel flex flex-col p-6", plan.featured && "ring-1 ring-primary/40")}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-semibold">{plan.name}</h3>
                {plan.featured && <Badge>Most popular</Badge>}
              </div>
              <p className="mt-4">
                <span className="metric text-3xl font-bold">{formatPrice(plan, currency)}</span>
                <span className="text-sm text-muted-foreground"> {plan.cadence}</span>
              </p>
              <p className="label-mono mt-3">
                {plan.credits} · {plan.storage}
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-signal" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className="mt-6"
                variant={plan.featured ? "default" : "secondary"}
              >
                <Link to="/auth">Choose {plan.name}</Link>
              </Button>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Hexagon className="size-4 text-primary" strokeWidth={2.5} />
            <span className="font-display font-semibold text-foreground">PixelForge AI</span>
          </div>
          <p>Asset optimisation studio · Cape Town, South Africa</p>
        </div>
      </footer>
    </div>
  );
}
