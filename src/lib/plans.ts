export type PlanId = "weekly" | "monthly" | "annual";

export type Plan = {
  id: PlanId;
  name: string;
  cadence: string;
  priceZar: number;
  priceUsd: number;
  credits: string;
  storage: string;
  featured?: boolean;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: "weekly",
    name: "Weekly",
    cadence: "per week",
    priceZar: 89,
    priceUsd: 5,
    credits: "1 500 processing credits",
    storage: "5 GB cloud storage",
    features: [
      "Unlimited projects",
      "AI compression + resize",
      "All web & social presets",
      "Metadata editor",
      "Auto-renews weekly",
    ],
  },
  {
    id: "monthly",
    name: "Monthly",
    cadence: "per month",
    priceZar: 299,
    priceUsd: 17,
    credits: "12 000 processing credits",
    storage: "100 GB cloud storage",
    featured: true,
    features: [
      "Everything in Weekly",
      "Priority queue + bulk folders",
      "ZIP & folder uploads",
      "Saved workflows and brand presets",
      "Asset variant manager",
      "API access add-on",
    ],
  },
  {
    id: "annual",
    name: "Annual",
    cadence: "per year",
    priceZar: 2990,
    priceUsd: 169,
    credits: "180 000 processing credits",
    storage: "1 TB cloud storage",
    features: [
      "Everything in Monthly",
      "Highest limits, best rate",
      "Priority support",
      "Exclusive AI upscaling & restore",
      "REST API + webhooks included",
    ],
  },
];

export const PLAN_LABELS: Record<string, string> = {
  free: "Free trial",
  weekly: "Weekly",
  monthly: "Monthly",
  annual: "Annual",
};

export type Currency = "ZAR" | "USD";

export function formatPrice(plan: Plan, currency: Currency): string {
  const amount = currency === "ZAR" ? plan.priceZar : plan.priceUsd;
  return new Intl.NumberFormat(currency === "ZAR" ? "en-ZA" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

