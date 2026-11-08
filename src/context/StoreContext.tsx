import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { store as storeApi } from "../lib/api";
import type { Product, Store, StorefrontResponse } from "../types";

interface StoreState {
  loading: boolean;
  store: Store | null;
  products: Product[];
  error: string | null;
  reload: () => Promise<void>;
}

const Ctx = createContext<StoreState | null>(null);

export function StoreProvider({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  // In-flight guard: multiple reload() calls collapse into one request.
  const inFlight = useRef<Promise<void> | null>(null);

  const reload = useCallback(async () => {
    if (!slug) {
      setLoading(false);
      setError("No store specified.");
      return;
    }

    if (inFlight.current) {
      return inFlight.current;
    }

    const run = (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = (await storeApi.public(slug)) as StorefrontResponse;
        setStore(data.store);
        setProducts(data.products || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Could not load store.");
        setStore(null);
        setProducts([]);
      } finally {
        setLoading(false);
        inFlight.current = null;
      }
    })();

    inFlight.current = run;
    return run;
  }, [slug]);

  // Fetch once per slug change. `reload` is stable per slug, so this fires
  // exactly once when slug changes and never again from re-renders.
  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <Ctx.Provider value={{ loading, store, products, error, reload }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStoreContext(): StoreState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStoreContext must be used inside StoreProvider");
  return ctx;
}
