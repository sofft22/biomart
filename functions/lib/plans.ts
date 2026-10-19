export type PlanId = "free" | "starter" | "pro";

export interface PlanLimit {
  visible: number;
  photos: number;
  variants: boolean;
}

export const PLAN_LIMITS: Record<PlanId, PlanLimit> = {
  free:    { visible: 5,      photos: 1,  variants: false },
  starter: { visible: 15,     photos: 3,  variants: false },
  pro:     { visible: 100000, photos: 10, variants: true  },
};

export function getLimit(plan: string): PlanLimit {
  return PLAN_LIMITS[(plan as PlanId) ?? "free"] ?? PLAN_LIMITS.free;
}
