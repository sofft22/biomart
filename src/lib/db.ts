// ═══════════════════════════════════════════════════════════
//  FLIP THIS WHEN DEPLOYING
//  true  = Bolt preview  (browser WASM database)
//  false = Cloudflare    (real Turso via functions/)
// ═══════════════════════════════════════════════════════════
const USE_WASM = true;

import { query as wasmQuery, run as wasmRun } from "./db-wasm";
import { query as remoteQuery, run as remoteRun } from "./db-remote";

export const query = USE_WASM ? wasmQuery : remoteQuery;
export const run = USE_WASM ? wasmRun : remoteRun;