/* ══════════════════════════════════════════════════
   TYPES — shared across the app
   ══════════════════════════════════════════════════ */

export type PlanId = "free" | "starter" | "pro" | "lifetime";
export type UserRole = "owner" | "admin";
export type SubscriptionStatus = "active" | "suspended" | "cancelled";

/* ─── User ─── */
export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at?: number;
}

/* ─── Store ─── */
export interface Store {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  whatsapp: string;
  tagline?: string | null;
  address?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  cover_url?: string | null;
  plan: PlanId;
  paid_until?: number | null;
  subscription_status: SubscriptionStatus;
  created_at?: number;
}

/* ─── Product ─── */
export interface Product {
  id: string;
  store_id: string;
  name: string;
  description?: string | null;
  price: number;
  compare_at_price?: number | null;
  category?: string | null;
  photos: string[];
  in_stock: boolean;
  featured: boolean;
  position?: number;
  created_at?: number;
}

/* ─── Category ─── */
export interface Category {
  id: string;
  label: string;
  position?: number;
}

/* ─── Payment (admin billing) ─── */
export interface Payment {
  id: string;
  store_id: string;
  amount: number;
  plan: PlanId;
  paid_at: number;
  note?: string | null;
}

/* ─── Plans ─── */
export interface PlanFeature {
  products: number;
  photos: number;
  sizes: boolean;
  support?: boolean;
}

export interface PlanDef {
  id: PlanId;
  name: string;
  price: number;
  per: string;
  badge?: "popular" | "founding";
  limits: PlanFeature;
}

export type PlansMap = Record<PlanId, PlanDef>;

/* ─── API responses ─── */
export interface MeResponse {
  user: User;
  store: Store;
  products: Product[];
  limits: {
    planName: string;
    products: number;
    photos: number;
    sizes: boolean;
  };
  plans: PlansMap;
}

export interface AdminOverviewResponse {
  totals: {
    stores: number;
    users: number;
    activeStores: number;
    mrr: number;
  };
  planCounts: Record<PlanId, number>;
  recentSignups: Array<{
    storeId: string;
    storeName: string;
    email: string;
    plan: PlanId;
    createdAt: number;
  }>;
  recentPayments: Payment[];
}