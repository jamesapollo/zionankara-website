import { MAX_QUANTITY } from "./store";

/** One ERP variant in the bag, with what the bag page shows before the ERP prices it. */
export type ErpBagLine = {
  variantId: number;
  slug: string;
  title: string;
  label: string;
  image: string | null;
  quantity: number;
};

/** The ERP accepts at most 50 lines per order. */
export const MAX_LINES = 50;

const clamp = (quantity: number) => Math.max(1, Math.min(MAX_QUANTITY, quantity));

function isLine(value: unknown): value is ErpBagLine {
  const l = value as ErpBagLine;
  return (
    Number.isInteger(l?.variantId) &&
    l.variantId > 0 &&
    typeof l.slug === "string" &&
    typeof l.title === "string" &&
    typeof l.label === "string" &&
    (l.image === null || typeof l.image === "string") &&
    Number.isInteger(l.quantity) &&
    l.quantity > 0
  );
}

/** Adds a line, merging with an existing line for the same variant (quantity capped). */
export function addErpLine(bag: ErpBagLine[], line: ErpBagLine): ErpBagLine[] {
  const existing = bag.find((l) => l.variantId === line.variantId);
  if (existing) return bag.map((l) => (l === existing ? { ...l, quantity: clamp(l.quantity + line.quantity) } : l));
  if (bag.length >= MAX_LINES) return bag;
  return [...bag, { ...line, quantity: clamp(line.quantity) }];
}

/** A saved bag from storage: well-formed lines only, duplicates merged, quantities clamped, at most 50 lines. */
export function parseErpBag(raw: unknown): ErpBagLine[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isLine).reduce<ErpBagLine[]>((bag, line) => addErpLine(bag, line), []);
}

export function erpBagCount(bag: ErpBagLine[]) {
  return bag.reduce((n, l) => n + l.quantity, 0);
}
