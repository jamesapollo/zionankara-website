"use client";

import { useSyncExternalStore } from "react";
import { currencies, type Currency } from "./currency";

export type BagLine = { slug: string; quantity: number };
type State = { currency: Currency; bag: BagLine[] };

const STORAGE_KEY = "zionankara:store";
const initialState: State = { currency: "KES", bag: [] };

let state = initialState;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && currencies.includes(saved.currency) && Array.isArray(saved.bag)) {
      state = { currency: saved.currency, bag: saved.bag };
    }
  } catch {
    // Storage unavailable (private mode, blocked site data): keep defaults.
  }
}

function setState(next: State) {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Non-critical: the change still applies for this visit.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;
const getServerSnapshot = () => initialState;

export function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setCurrency(currency: Currency) {
  setState({ ...state, currency });
}

export function addToBag(slug: string) {
  const existing = state.bag.find((line) => line.slug === slug);
  setState({
    ...state,
    bag: existing
      ? state.bag.map((line) => (line.slug === slug ? { ...line, quantity: line.quantity + 1 } : line))
      : [...state.bag, { slug, quantity: 1 }],
  });
}

export function bagCount(bag: BagLine[]) {
  return bag.reduce((total, line) => total + line.quantity, 0);
}
