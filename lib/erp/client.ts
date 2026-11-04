import "server-only";
import { signRequest } from "./sign";
import type { ErpRedirect } from "./types";

/** Placeholder client IP for requests with no shopper (cached reads, build time). */
export const NO_SHOPPER_IP = "0.0.0.0";
const LOOPBACK_IP = "127.0.0.1";
/** Addresses we never forward as a shopper IP. */
const UNSPECIFIED = new Set(["", "::1", "::", "0.0.0.0", "::ffff:0.0.0.0"]);

export type ErpErrorKind = "config" | "network" | "http";

/** Thrown for config problems, network failures and non-2xx reads. `status` is 0 when no response arrived. */
export class ErpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly kind: ErpErrorKind = "http",
  ) {
    super(message);
    this.name = "ErpError";
  }
}

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function config(host: string | undefined) {
  const baseUrl = env("ERP_API_URL");
  const secret = env("STOREFRONT_SIGNING_SECRET");
  if (!baseUrl || !secret) {
    throw new ErpError("ERP_API_URL and STOREFRONT_SIGNING_SECRET must be set", 0, "config");
  }
  const resolvedHost = env("ERP_STOREFRONT_HOST") || host?.trim() || "";
  if (!resolvedHost) {
    throw new ErpError("ERP_STOREFRONT_HOST must be set", 0, "config");
  }
  return { baseUrl, secret, host: resolvedHost };
}

function safeIp(ip: string): string {
  const v = ip.trim();
  return UNSPECIFIED.has(v) ? LOOPBACK_IP : v;
}

/** The shopper's IP: first x-forwarded-for entry, else x-real-ip, else loopback. Never unspecified. */
export function shopperIp(h: Headers): string {
  const first = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return safeIp(first || h.get("x-real-ip") || LOOPBACK_IP);
}

async function signedFetch(
  path: string,
  method: "GET" | "POST",
  body: string,
  clientIp: string,
  host: string | undefined,
): Promise<Response> {
  const cfg = config(host);
  const url = new URL(path, cfg.baseUrl);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signRequest({
    method,
    pathWithQuery: url.pathname + url.search,
    timestamp,
    host: cfg.host,
    clientIp,
    body,
    secret: cfg.secret,
  });
  const headers = new Headers({
    Accept: "application/json",
    "X-Storefront-Host": cfg.host,
    "X-Storefront-Client-IP": clientIp,
    "X-Storefront-Timestamp": String(timestamp),
    "X-Storefront-Signature": signature,
  });
  if (body !== "") headers.set("Content-Type", "application/json");
  try {
    return await fetch(url, {
      method,
      headers,
      body: body === "" ? undefined : body,
      cache: "no-store",
    });
  } catch (cause) {
    throw new ErpError(`ERP request failed: ${(cause as Error).message}`, 0, "network");
  }
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Signed GET using the 0.0.0.0 no-shopper IP. Resolves to the body, which may be the
 * `{redirect}` hint for a renamed slug. Throws ErpError for 4xx/5xx (incl. 404) and network failure.
 */
export async function erpGet<T>(
  path: string,
  opts: { clientIp?: string } = {},
): Promise<T | ErpRedirect> {
  const res = await signedFetch(path, "GET", "", opts.clientIp ?? NO_SHOPPER_IP, undefined);
  if (!res.ok) throw new ErpError(`ERP responded ${res.status}`, res.status);
  const json = (await readJson(res)) as T | ErpRedirect | null;
  if (json === null) throw new ErpError("ERP returned an unreadable body", res.status);
  return json;
}

/**
 * Signed JSON POST for a shopper action. Does not throw on 4xx (422/429 come back as status + body);
 * throws ErpError on 5xx and network failure. `host` is the request host, used only when
 * ERP_STOREFRONT_HOST is unset. An unspecified clientIp is replaced with 127.0.0.1.
 */
export async function erpPost<T>(
  path: string,
  body: unknown,
  opts: { clientIp: string; host?: string },
): Promise<{ status: number; data: T }> {
  const res = await signedFetch(path, "POST", JSON.stringify(body), safeIp(opts.clientIp), opts.host);
  if (res.status >= 500) throw new ErpError(`ERP responded ${res.status}`, res.status);
  return { status: res.status, data: (await readJson(res)) as T };
}
