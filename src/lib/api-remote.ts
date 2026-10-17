import type { MeResponse, StorefrontResponse, Store, Product } from "../types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (data as any)?.error || `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

/* ── Auth ── */
export const auth = {
  me: () => apiFetch<MeResponse>("/api/me"),
  login: (email: string, password: string) =>
    apiFetch<void>("/api/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => apiFetch<void>("/api/logout", { method: "POST" }),
  signup: (body: { storeName: string; whatsapp: string; email: string; password: string }) =>
    apiFetch<void>("/api/signup", { method: "POST", body: JSON.stringify(body) }),
};

/* ── Store ── */
export const store = {
  public: (slug: string) =>
    apiFetch<StorefrontResponse>(`/api/store/${encodeURIComponent(slug)}`),
  update: (body: Partial<Store> & { cover_url?: string | null }) =>
    apiFetch<void>("/api/store", { method: "PUT", body: JSON.stringify(body) }),
};

/* ── Products ── */
export const products = {
  list: () => apiFetch<Product[]>("/api/products"),
  create: (body: Partial<Product>) =>
    apiFetch<Product>("/api/products", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Product>) =>
    apiFetch<void>(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: string) =>
    apiFetch<void>(`/api/products/${id}`, { method: "DELETE" }),
};

/* ── Upload ── */
export async function uploadImage(file: File | Blob): Promise<string> {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError((data as any)?.error || "Upload failed", res.status);
  return (data as any).url as string;
}

/* ── Track ── */
export const track = {
  storeVisit: (slug: string) =>
    apiFetch<{ ok: true }>(`/api/track/store/${encodeURIComponent(slug)}`, {
      method: "POST",
    }),
  productView: (id: string) =>
    apiFetch<{ ok: true }>(`/api/track/product/${encodeURIComponent(id)}`, {
      method: "POST",
    }),
};

/* ── Stats ── */
export type StatsResponse = {
  visits: { today: number; week: number; month: number };
  totalProductViews: number;
  chart: {
    today: { date: string; count: number }[];
    week: { date: string; count: number }[];
    month: { date: string; count: number }[];
  };
  topProducts: { id: string; name: string; price: number; image_url: string | null; views: number }[];
};

export const stats = {
  get: () => apiFetch<StatsResponse>("/api/stats"),
};

/* ── Admin ── */
export const admin = {
  overview: () => apiFetch<any>("/api/admin/overview"),
  visitsByDay: () => apiFetch<any>("/api/admin/visits-by-day"),
  topStores: () => apiFetch<any>("/api/admin/top-stores"),
  stores: () => apiFetch<any>("/api/admin/stores"),
  storeDetail: (id: string) => apiFetch<any>(`/api/admin/stores/${id}`),
  billing: () => apiFetch<any>("/api/admin/billing"),
  settings: () => apiFetch<any>("/api/admin/settings"),
  expiringStores: () => apiFetch<any>("/api/admin/expiring-stores"), // Added this cleanly here
  
  recordPayment: (storeId: string, plan: string, amount: number, note: string) =>
    apiFetch<any>("/api/admin/stores", {
      method: "POST",
      body: JSON.stringify({ action: "record-payment", storeId, plan, amount, note }),
    }),
  changePlan: (storeId: string, plan: string) =>
    apiFetch<any>("/api/admin/stores", {
      method: "POST",
      body: JSON.stringify({ action: "change-plan", storeId, plan }),
    }),
  resetPassword: (storeId: string, newPassword: string) =>
    apiFetch<any>("/api/admin/stores", {
      method: "POST",
      body: JSON.stringify({ action: "reset-password", storeId, newPassword }),
    }),
  deleteStore: (storeId: string) =>
    apiFetch<any>("/api/admin/stores", {
      method: "POST",
      body: JSON.stringify({ action: "delete-store", storeId }),
    }),
};
