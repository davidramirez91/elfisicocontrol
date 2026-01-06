import plans from "../data/plans.json";

export const PLANS = plans;

const planKeys = Object.keys(PLANS);
if (planKeys.length === 0) {
  throw new Error("plans.json is empty");
}

// Para Zod enum:
export const PLAN_KEYS = planKeys as [string, ...string[]];

export function getPlanInfo(plan: string) {
  const info = (PLANS as Record<string, { price: number; hours: number; label: string }>)[plan];
  return info ?? null;
}
