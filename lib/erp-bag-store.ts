"use client";

import { useSyncExternalStore } from "react";
import { addErpLine, parseErpBag, type ErpBagLine } from "./erp-bag";
import { MAX_QUANTITY } from "./store";

const STORAGE_KEY = "zionankara:erp-bag:v1";
const EMPTY: ErpBagLine[] = [];

let bag: ErpBagLine[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded) return;
  loaded = true;
  try {
    bag = parseErpBag(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"));
  } catch {
    // Storage unavailable or corrupt: start empty.
  }
}

function update(next: (current: ErpBagLine[]) => ErpBagLine[]) {
  load();
  bag = next(bag);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bag));
  } catch {
    // Non-critical: the change still applies for this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => {
  load();
  return bag;
};

export function useErpBag(): ErpBagLine[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

export const addToErpBag = (line: ErpBagLine) => update((b) => addErpLine(b, line));

export const setErpLineQuantity = (variantId: number, quantity: number) =>
  update((b) =>
    b.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.max(1, Math.min(MAX_QUANTITY, quantity)) } : l)),
  );

export const removeErpLine = (variantId: number) => update((b) => b.filter((l) => l.variantId !== variantId));

export const clearErpBag = () => update(() => EMPTY);
