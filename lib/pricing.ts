import { getProduct } from "./catalog";
import type { BagLine } from "./store";

export const FREE_DELIVERY_OVER_KES = 10000;
export const STANDARD_DELIVERY_KES = 450;
const VAT_RATE = 0.16;

// Sample promotion from the design; real codes belong in the commerce backend.
export const PROMO_CODES: Record<string, number> = { ZION10: 0.1 };

export function resolveLines(bag: BagLine[]) {
  return bag.flatMap((line) => {
    const product = getProduct(line.slug);
    return product ? [{ ...line, product }] : [];
  });
}

/**
 * Bag totals in KES. `deliveryKes` overrides the standard delivery rule (checkout passes the chosen method);
 * omit it to apply standard delivery, free over the threshold.
 */
export function bagTotals(bag: BagLine[], promoCode: string | null, deliveryKes?: number) {
  const lines = resolveLines(bag);
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const gross = lines.reduce((n, l) => n + (l.product.wasKes ?? l.product.priceKes) * l.quantity, 0);
  const net = lines.reduce((n, l) => n + l.product.priceKes * l.quantity, 0);
  const promoRate = promoCode ? (PROMO_CODES[promoCode] ?? 0) : 0;
  const promo = Math.round(net * promoRate);
  const afterPromo = net - promo;
  const freeDelivery = afterPromo >= FREE_DELIVERY_OVER_KES;
  const delivery = count === 0 ? 0 : (deliveryKes ?? (freeDelivery ? 0 : STANDARD_DELIVERY_KES));
  const total = afterPromo + delivery;

  return {
    lines,
    count,
    gross,
    savings: gross - net,
    promo,
    afterPromo,
    freeDelivery,
    delivery,
    total,
    // Prices are VAT-inclusive; this is the VAT portion of the total.
    vat: Math.round((total * VAT_RATE) / (1 + VAT_RATE)),
  };
}
