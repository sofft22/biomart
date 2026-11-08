import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [limits, setLimits] = useState<MeResponse["limits"] | null>(null);
  const [plans, setPlans] = useState<PlansMap | null>(null);

  // Read current user without putting `user` in refresh's dep array
  const userRef = useRef<User | null>(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // In-flight guard so concurrent refresh() calls collapse into one request
  const inFlight = useRef<Promise<void> | null>(null);

  const refresh = useCallback(async (force = false) => {
    // If we already have a user and this isn't a forced refresh, bail.
    if (!force && userRef.current !== null) {
      setLoading(false);
      return;
    }

    // If a request is already running, wait for it instead of firing another.
    if (inFlight.current) {
      return inFlight.current;
    }

    const run = (async () => {
      try {
        const data = await auth.me();
        setUser(data.user);
        setStore(data.store as any);
        setProducts(data.products || []);
        setLimits(data.limits);
        setPlans(data.plans);
      } catch {
        setUser(null);
        setStore(null);
        setProducts([]);
        setLimits(null);
        setPlans(null);
      } finally {
        setLoading(false);
        inFlight.current = null;
      }
    })();

    inFlight.current = run;
    return run;
  }, []); // ← NO dependencies. `refresh` identity is stable forever.

  // Run exactly once on mount.
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
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
