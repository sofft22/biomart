export type PlanId = "free" | "starter" | "pro";

export interface PlanLimit {
  visible: number;
  photos: number;
  variants: boolean; // 🟢 ADDED
}

export const PLAN_LIMITS: Record<PlanId, PlanLimit> = {
  free:    { visible: 5,      photos: 1,  variants: false }, // 🟢 ADDED
  starter: { visible: 15,     photos: 3,  variants: false }, // 🟢 ADDED
  pro:     { visible: 100000, photos: 10, variants: true  }, // 🟢 ADDED
};

// ... (rest of the file stays the same)
