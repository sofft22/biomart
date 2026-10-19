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

interface AuthState {
  loading: boolean;
  user: User | null;
  store: Store | null;
  products: Product[];
  limits: MeResponse["limits"] | null;
  plans: PlansMap | null;
  refresh: (force?: boolean) => Promise<void>;
  setProducts: (p: Product[]) => void;
}

const Ctx = createContext<AuthState | null>(null);

// 🟢 In-memory cache (Resets on page reload, preventing ghost logins)
let lastFetchedAt = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [limits, setLimits] = useState<MeResponse["limits"] | null>(null);
  const [plans, setPlans] = useState<PlansMap | null>(null);

  const refresh = useCallback(async (force = false) => {
    const now = Date.now();
    
    // If cached and not forcing, skip the API call
    if (!force && now - lastFetchedAt < CACHE_TTL && user !== null) {
      setLoading(false);
      return;
    }

    try {
      const data = await auth.me();
      setUser(data.user);
      setStore(data.store);
      setProducts(data.products || []);
      setLimits(data.limits);
      setPlans(data.plans);
      lastFetchedAt = Date.now();
    } catch {
      // 🟢 NO MOCK FALLBACK. If auth fails, user is genuinely logged out.
      setUser(null);
      setStore(null);
      setProducts([]);
      setLimits(null);
      setPlans(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
