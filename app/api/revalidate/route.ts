import { revalidateTag } from "next/cache";
import { tagsFor, verifyRevalidation } from "@/lib/erp/revalidate";

/**
 * Called by the ERP after it changes store contact details, categories or products, so the change
 * shows on the next page load instead of after the 5-minute cache. Signed with REVALIDATE_SECRET:
 * `X-Revalidate-Signature` = HMAC-SHA256 hex of `<X-Revalidate-Timestamp>.<raw body>`. See README.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET?.trim() ?? "";
  if (!secret) return Response.json({ error: "Revalidation is not configured." }, { status: 503 });

  const body = await request.text();
  const authentic = verifyRevalidation({
    timestamp: request.headers.get("x-revalidate-timestamp"),
    signature: request.headers.get("x-revalidate-signature"),
    body,
    secret,
  });
  if (!authentic) return Response.json({ error: "Invalid signature." }, { status: 401 });

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const result = tagsFor(payload);
  if ("error" in result) return Response.json({ error: result.error }, { status: 400 });

  // expire: 0 drops the data now, so the next request fetches fresh data instead of serving stale.
  for (const tag of result.tags) revalidateTag(tag, { expire: 0 });
  return Response.json({ revalidated: result.tags });
}
