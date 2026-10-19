import { admin as adminApi } from "./api";

export interface AdminStoreRow {
  id: string;
  name: string;
  slug: string;
  email: string;
  plan: string;
  created_at: number;
}

export interface AdminStoreDetail {
  id: string;
  name: string;
  slug: string;
  email: string;
  whatsapp: string;
  instagram: string;
  tiktok: string;
  address: string;
  tagline: string;
  bio: string;
  cover_url: string;
  plan: string;
  paid_until: number | null; // 🟢 Added
  created_at: number;
  productCount: number;
  visitCount: number;
  payments?: any[]; // 🟢 Added
  totalPaid?: number; // 🟢 Added
}

export interface AdminBillingRow {
  id: string;
  store_id: string;
  store_name: string | null;
  amount: number;
  plan: string;
  note: string | null;
  paid_at: number;
}

export { adminApi };
