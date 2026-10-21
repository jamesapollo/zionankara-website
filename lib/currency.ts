export const currencies = ["KES", "USD", "GBP", "EUR"] as const;
export type Currency = (typeof currencies)[number];

export const currencyLabels: Record<Currency, string> = {
  KES: "KES",
  USD: "$ USD",
  GBP: "£ GBP",
  EUR: "€ EUR",
};

// Indicative display rates from the design; replace with live rates before launch.
const ratesFromKes: Record<Currency, number> = {
  KES: 1,
  USD: 1 / 129,
  GBP: 1 / 172,
  EUR: 1 / 150,
};

export function formatPrice(kes: number, currency: Currency) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(kes * ratesFromKes[currency]);
}

export function discountLabel(priceKes: number, wasKes: number) {
  return `−${Math.round((1 - priceKes / wasKes) * 100)}%`;
}
