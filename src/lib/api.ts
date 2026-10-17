// ═══════════════════════════════════════════════════════════
//  FLIP THIS AT DEPLOY
//  true  = Bolt preview  (sql.js, browser only)
//  false = Cloudflare    (real D1 backend via functions/)
// ═══════════════════════════════════════════════════════════
export const USE_WASM = true;

import * as local from "./api-local";
import * as remote from "./api-remote";

export const auth        = USE_WASM ? local.auth        : remote.auth;
export const store       = USE_WASM ? local.store       : remote.store;
export const products    = USE_WASM ? local.products    : remote.products;
export const uploadImage = USE_WASM ? local.uploadImage : remote.uploadImage;
export const ApiError    = USE_WASM ? local.ApiError    : remote.ApiError;
export const track       = USE_WASM ? local.track       : remote.track;
export const stats       = USE_WASM ? local.stats       : remote.stats;
export const admin       = USE_WASM ? local.admin       : remote.admin;

export type { StatsResponse } from "./api-remote";