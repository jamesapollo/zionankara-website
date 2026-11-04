import { createHash, createHmac } from "node:crypto";

export type SignInput = {
  method: string;
  /** Path plus query exactly as sent (WHATWG-normalized). */
  pathWithQuery: string;
  /** Unix seconds. */
  timestamp: number;
  host: string;
  clientIp: string;
  /** The exact string sent as the request body ("" when none). */
  body: string;
  secret: string;
};

/** HMAC-SHA256 hex per the ERP's storefront-signing.md canonical string. */
export function signRequest(input: SignInput): string {
  const canonical = [
    input.method.toUpperCase(),
    input.pathWithQuery,
    String(input.timestamp),
    input.host,
    input.clientIp,
    createHash("sha256").update(input.body).digest("hex"),
  ].join("\n");
  return createHmac("sha256", input.secret).update(canonical).digest("hex");
}
