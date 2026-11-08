export type PlanId = "free" | "starter" | "pro";

export interface PlanLimit {
  visible: number;
  products: number; // 🟢 Added this to match your backend checks
  photos: number;
  variants: boolean;
}

// 🟢 CORE LIMITS
export const PLAN_LIMITS: Record<PlanId, PlanLimit> = {
  free:    { visible: 5,  products: 5,  photos: 1,  variants: false },
  starter: { visible: 15, products: 15, photos: 3,  variants: false },
  pro:     { visible: 100, products: 100, photos: 10, variants: true  }, // 🟢 Changed from 100000 to 100
};

// 🟢 MONTHLY PRICES
export const PLAN_PRICES_MONTHLY: Record<PlanId, number> = {
  free: 0,
  starter: 3000,
  pro: 6500,
};

// 🟢 QUARTERLY PRICES (3 Months)
export const PLAN_PRICES_QUARTERLY: Record<PlanId, number> = {
  free: 0,
  starter: 8280,
  pro: 17940,
};

export const PLAN_DAYS = 30;
export const PLAN_DAYS_QUARTERLY = 90;
export const GRACE_DAYS = 7;

export function getLimit(plan: string): PlanLimit {
  return PLAN_LIMITS[(plan as PlanId) ?? "free"] ?? PLAN_LIMITS.free;
}

export type PlanStatus =
  | "free"
  | "active"
  | "expiring"
  | "expired"
  | "downgraded";

export interface PlanState {
  status: PlanStatus;
  plan: string;
  daysLeft: number | null;
  label: string;
}

export function getPlanStatus(
  plan: string,
  paidUntil: number | null | undefined
): PlanState {
  if (plan === "free") {
    return { status: "free", plan, daysLeft: null, label: "Free" };
  }

  const now = Date.now();
  const diff = (paidUntil || 0) - now;
  const daysLeft = Math.ceil(diff / 86400000);

  if (diff < 0) {
    const graceLeft = daysLeft + GRACE_DAYS;
    if (graceLeft <= 0) {
      return { status: "downgraded", plan, daysLeft: 0, label: "Downgraded" };
    }
    return {
      status: "expired",
      plan,
      daysLeft: Math.max(0, graceLeft),
      label: "Expired",
    };
  }

  if (daysLeft <= 7) {
    return { status: "expiring", plan, daysLeft, label: "Expiring soon" };
  }

  return { status: "active", plan, daysLeft, label: "Active" };
}
