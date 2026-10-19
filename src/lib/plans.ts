export type PlanId = "free" | "starter" | "pro";

export interface PlanLimit {
  visible: number;
  photos: number;
}

// 🟢 CORE LIMITS
export const PLAN_LIMITS: Record<PlanId, PlanLimit> = {
  free:    { visible: 5,      photos: 1  },
  starter: { visible: 15,     photos: 3  },
  pro:     { visible: 100000, photos: 10 },
};

// 🟢 MONTHLY PRICES
export const PLAN_PRICES_MONTHLY: Record<PlanId, number> = {
  free: 0,
  starter: 2000,
  pro: 5000,
};

// 🟢 QUARTERLY PRICES (3 Months)
export const PLAN_PRICES_QUARTERLY: Record<PlanId, number> = {
  free: 0,
  starter: 5500,
  pro: 13500,
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
