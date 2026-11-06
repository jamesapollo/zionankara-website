"use server";

import { headers } from "next/headers";
import { erpGetLive, erpPost, shopperIp } from "@/lib/erp/client";
import type { DeliveryZone, OrderBody } from "@/lib/erp/types";

/** Raw ERP answer for the checkout classifiers; status 0 means the ERP could not be reached. */
export type ErpReply = { status: number; data: unknown };

const FAILED: ErpReply = { status: 0, data: null };
const ip = async () => shopperIp(await headers());

/** Active delivery zones for a country (empty: delivery is quoted later), or null when they could not be loaded. */
export async function getDeliveryZones(country: string): Promise<DeliveryZone[] | null> {
  if (!/^[A-Z]{2}$/.test(country)) return null;
  try {
    const { status, data } = await erpGetLive<{ data?: DeliveryZone[] }>(
      `/api/v1/storefront/delivery-zones?country=${country}`,
      { clientIp: await ip() },
    );
    if (status !== 200 || !Array.isArray(data?.data)) {
      console.error(`[checkout] delivery zones failed with status ${status}`);
      return null;
    }
    return data.data;
  } catch (error) {
    console.warn("[checkout] delivery zones unavailable:", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Live prices, availability, delivery fee and totals for the bag (POST /checkout/validate). */
export async function quoteCheckout(input: {
  lines: { variant_id: number; quantity: number }[];
  country: string;
  delivery_zone_id: number | null;
}): Promise<ErpReply> {
  try {
    return await erpPost("/api/v1/storefront/checkout/validate", input, { clientIp: await ip() });
  } catch (error) {
    console.warn("[checkout] quote failed:", error instanceof Error ? error.message : error);
    return FAILED;
  }
}

/** Places the order (POST /orders). The same key and body replay the same order instead of creating another. */
export async function submitOrder(body: OrderBody, idempotencyKey: string): Promise<ErpReply> {
  try {
    const reply = await erpPost("/api/v1/storefront/orders", body, {
      clientIp: await ip(),
      headers: { "Idempotency-Key": idempotencyKey },
    });
    // Status only: never log buyer fields.
    if (![201, 409, 422, 429].includes(reply.status)) console.error(`[checkout] ERP rejected the order with status ${reply.status}`);
    return reply;
  } catch (error) {
    console.warn("[checkout] order failed:", error instanceof Error ? error.message : error);
    return FAILED;
  }
}
