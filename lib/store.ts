"use client";

import { useCallback, useSyncExternalStore } from "react";
import { currencies, formatPrice, type Currency } from "./currency";

export type BagLine = { id: string; slug: string; size: string; print: string; quantity: number };
type State = { currency: Currency; bag: BagLine[]; promoCode: string | null };

const STORAGE_KEY = "zionankara:store:v2";
const MAX_QUANTITY = 10;
const initialState: State = { currency: "KES", bag: [], promoCode: null };

let state = initialState;
let loaded = false;
const listeners = new Set<() => void>();

function isBagLine(value: unknown): value is BagLine {
  const line = value as BagLine;
  return (
    typeof line?.id === "string" &&
    typeof line.slug === "string" &&
    typeof line.size === "string" &&
    typeof line.print === "string" &&
    Number.isInteger(line.quantity) &&
    line.quantity > 0
  );
}

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && currencies.includes(saved.currency) && Array.isArray(saved.bag)) {
      state = {
        currency: saved.currency,
        bag: saved.bag.filter(isBagLine),
        promoCode: typeof saved.promoCode === "string" ? saved.promoCode : null,
      };
    }
  } catch {
    // Storage unavailable (private mode, blocked site data): keep defaults.
  }
}

function setState(update: (current: State) => State) {
  load();
  state = update(state);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Non-critical: the change still applies for this visit.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Loading here (idempotent) means the first client render after hydration already has the saved bag.
const getSnapshot = () => {
  load();
  return state;
};
const getServerSnapshot = () => initialState;

export function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const noopSubscribe = () => () => {};

/** False during the server render and hydration, true once the saved bag has been read in the browser. */
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/** Formats a KES amount in the visitor's chosen currency. */
export function useFormatPrice() {
  const { currency } = useStore();
  return useCallback((kes: number) => formatPrice(kes, currency), [currency]);
}

export function setCurrency(currency: Currency) {
  setState((s) => ({ ...s, currency }));
}

export function addToBag(item: { slug: string; size: string; print: string; quantity: number }) {
  const id = `${item.slug}|${item.size}|${item.print}`;
  setState((s) => {
    const existing = s.bag.find((line) => line.id === id);
    return {
      ...s,
      bag: existing
        ? s.bag.map((line) =>
            line.id === id ? { ...line, quantity: Math.min(MAX_QUANTITY, line.quantity + item.quantity) } : line,
          )
        : [...s.bag, { id, ...item, quantity: Math.min(MAX_QUANTITY, item.quantity) }],
    };
  });
}

export function setLineQuantity(id: string, quantity: number) {
  setState((s) => ({
    ...s,
    bag: s.bag.map((line) =>
      line.id === id ? { ...line, quantity: Math.max(1, Math.min(MAX_QUANTITY, quantity)) } : line,
    ),
  }));
}

export function removeLine(id: string) {
  setState((s) => ({ ...s, bag: s.bag.filter((line) => line.id !== id) }));
}

export function setPromoCode(promoCode: string | null) {
  setState((s) => ({ ...s, promoCode }));
}

export function clearBag() {
  setState((s) => ({ ...s, bag: [], promoCode: null }));
}

export function bagCount(bag: BagLine[]) {
  return bag.reduce((total, line) => total + line.quantity, 0);
}

export { MAX_QUANTITY };
