// ═══════════════════════════════════════════════════════════
//  PRODUCTION — talks to functions/ which talks to Turso.
//  No token here. Cookies handled by the browser.
// ═══════════════════════════════════════════════════════════

async function apiFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

// ── Reads ──
export async function query(sql: string, args: any[] = []): Promise<any[]> {
  // The frontend never sends raw SQL in production. Instead we map
  // known query shapes to the REST endpoints that already exist.
  const s = sql.trim().toUpperCase();

  // products for the logged-in store
  if (s.startsWith("SELECT") && s.includes("FROM PRODUCTS")) {
    return await apiFetch("/api/products");
  }

  // store for the logged-in user
  if (s.startsWith("SELECT") && s.includes("FROM STORES")) {
    return await apiFetch("/api/store");
  }

  // current user
  if (s.startsWith("SELECT") && s.includes("FROM USERS")) {
    return await apiFetch("/api/me");
  }

  throw new Error("Unsupported query in production: " + sql.slice(0, 80));
}

// ── Writes ──
export async function run(sql: string, args: any[] = []): Promise<any> {
  const s = sql.trim().toUpperCase();

  if (s.startsWith("INSERT INTO PRODUCTS")) {
    return await apiFetch("/api/products", {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  if (s.startsWith("UPDATE PRODUCTS")) {
    return await apiFetch("/api/products/" + args[args.length - 1], {
      method: "PUT",
      body: JSON.stringify({}),
    });
  }

  if (s.startsWith("DELETE FROM PRODUCTS")) {
    return await apiFetch("/api/products/" + args[0], {
      method: "DELETE",
    });
  }

  if (s.startsWith("UPDATE STORES")) {
    return await apiFetch("/api/store", {
      method: "PUT",
      body: JSON.stringify({}),
    });
  }

  throw new Error("Unsupported write in production: " + sql.slice(0, 80));
}