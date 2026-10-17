import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { auth } from "../lib/api";
import type { MeResponse, Product, Store, User, PlansMap } from "../types";

// ══════════════════════════════════════════════════
// MOCK — REMOVE WHEN D1 CONNECTED
// ══════════════════════════════════════════════════
const MOCK_USER: User = {
  id: "preview-user",
  email: "boluwatifedaniel2009@gmail.com",
  role: "admin",
};

const MOCK_STORE: Store = {
  id: "preview-store",
  user_id: "preview-user",
  name: "Soft Closet",
  slug: "soft",
  whatsapp: "08000000000",
  plan: "free",
  subscription_status: "active",
};

const MOCK_LIMITS: MeResponse["limits"] = {
  planName: "free",
  products: 5,
  photos: 1,
  sizes: false,
};

const MOCK_PRODUCTS: Product[] = [];
const MOCK_PLANS: PlansMap | null = null;
// ══════════════════════════════════════════════════

interface AuthState {
  loading: boolean;
  user: User | null;
  store: Store | null;
  products: Product[];
  limits: MeResponse["limits"] | null;
  plans: PlansMap | null;
  refresh: () => Promise<void>;
  setProducts: (p: Product[]) => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [limits, setLimits] = useState<MeResponse["limits"] | null>(null);
  const [plans, setPlans] = useState<PlansMap | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await auth.me();
      setUser(data.user);
      setStore(data.store);
      setProducts(data.products);
      setLimits(data.limits);
      setPlans(data.plans);
    } catch {
      // ══════════════════════════════════════════════
      // MOCK FALLBACK — REMOVE WHEN D1 CONNECTED
      // ══════════════════════════════════════════════
      setUser(MOCK_USER);
      setStore(MOCK_STORE);
      setProducts(MOCK_PRODUCTS);
      setLimits(MOCK_LIMITS);
      setPlans(MOCK_PLANS);
      // ══════════════════════════════════════════════
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <Ctx.Provider
      value={{
        loading,
        user,
        store,
        products,
        limits,
        plans,
        refresh,
        setProducts,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}