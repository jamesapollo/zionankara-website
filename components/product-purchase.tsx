"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { printColours, sizes, type Product } from "@/lib/catalog";
import { addToBag, useFormatPrice } from "@/lib/store";
import { QuantityStepper } from "./quantity-stepper";

const panels = [
  {
    title: "Fabric & fit",
    body: "100% cotton wax print, fully lined in cotton voile. True to size with a fitted waist — model is 5′8″ and wears UK 10.",
  },
  {
    title: "Care instructions",
    body: "Hand wash cold or gentle machine wash inside out. Dry in shade to protect the print. Warm iron on the reverse.",
  },
  {
    title: "Shipping & returns",
    body: "Nairobi delivery in 1–2 days, rest of Kenya 2–4 days, international 5–10 days. Free returns within 14 days on unworn items; made-to-measure pieces are final sale.",
  },
];

const hexFor = (colour: string) => printColours.find((c) => c.id === colour)?.hex ?? "#111111";

export function ProductPurchase({ product }: { product: Product }) {
  const format = useFormatPrice();
  const [print, setPrint] = useState(0);
  const [size, setSize] = useState(product.sizes.includes("10") ? "10" : product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [openPanel, setOpenPanel] = useState(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const handleAdd = () => {
    addToBag({ slug: product.slug, size, print: product.prints[print].label, quantity });
    setAdded(true);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="flex flex-col gap-[26px]">
      <div className="flex flex-wrap items-baseline gap-3.5">
        <span className={`text-[28px] font-normal ${product.wasKes ? "text-accent" : ""}`}>{format(product.priceKes)}</span>
        {product.wasKes && (
          <>
            <span className="text-[17px] text-subtle line-through">{format(product.wasKes)}</span>
            <span className="text-small text-copy">You save {format(product.wasKes - product.priceKes)}</span>
          </>
        )}
      </div>

      <p className="border-t border-line pt-[26px] text-base leading-[1.75] text-pretty text-copy">{product.description}</p>

      <fieldset className="flex flex-col gap-3.5">
        <legend className="mb-3.5 text-sm font-normal">
          Print — <span className="text-copy">{product.prints[print].label}</span>
        </legend>
        <div className="flex gap-3.5">
          {product.prints.map((p, i) => (
            <button
              key={p.label}
              type="button"
              title={p.label}
              aria-label={p.label}
              aria-pressed={i === print}
              onClick={() => setPrint(i)}
              style={{ background: hexFor(p.colour) }}
              className={`size-[38px] cursor-pointer rounded-full ${i === print ? "shadow-ring" : "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]"}`}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3.5">
        <div className="flex items-baseline justify-between">
          <legend className="text-sm font-normal">Size (UK)</legend>
          <Link href="/size-guide" className="text-small text-copy underline underline-offset-[3px] hover:text-accent">
            Size guide →
          </Link>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {sizes.map((s) => {
            const available = product.sizes.includes(s);
            const on = s === size;
            return (
              <button
                key={s}
                type="button"
                disabled={!available}
                aria-pressed={on}
                aria-label={available ? `UK ${s}` : `UK ${s}, sold out`}
                onClick={() => setSize(s)}
                className={`h-12 w-[52px] cursor-pointer border text-sm disabled:cursor-not-allowed disabled:text-subtle disabled:line-through ${on ? "border-ink bg-ink text-white" : "border-line-strong hover:border-ink disabled:hover:border-line-strong"}`}
              >
                {s}
              </button>
            );
          })}
        </div>
        <span className="text-small text-muted">Between sizes? We also make to measure — add your measurements at checkout.</span>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <QuantityStepper value={quantity} onChange={setQuantity} size="lg" />
        <button
          type="button"
          onClick={handleAdd}
          className="h-(--za-control-lg) flex-[1_1_240px] cursor-pointer bg-ink text-small font-normal uppercase tracking-button text-white transition-colors hover:bg-accent"
        >
          <span aria-live="polite">{added ? "Added to bag ✓" : `Add to bag — ${format(product.priceKes * quantity)}`}</span>
        </button>
      </div>

      <ul className="flex flex-col gap-2.5 text-sm text-copy">
        <li className="flex gap-2.5">
          <span aria-hidden className="text-accent">✓</span>In stock — ships within 2–4 business days
        </li>
        <li className="flex gap-2.5">
          <span aria-hidden className="text-accent">✓</span>Free returns within 14 days
        </li>
      </ul>

      <div className="flex flex-col border-t border-line">
        {panels.map((panel, i) => {
          const open = openPanel === i;
          return (
            <div key={panel.title} className="border-b border-line">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenPanel(open ? -1 : i)}
                className="flex w-full cursor-pointer items-center justify-between py-[22px] text-left text-body font-normal hover:text-accent"
              >
                {panel.title}
                <span aria-hidden className="text-xl font-light">
                  {open ? "−" : "+"}
                </span>
              </button>
              {open && <p className="pb-[22px] text-body leading-[1.7] text-pretty text-copy">{panel.body}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
