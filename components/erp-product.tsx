"use client";

import Link from "next/link";
import { useState } from "react";
import { discountLabel } from "@/lib/currency";
import { defaultSelection, firstUnchosen, galleryFor, priceFor, selectedVariant, selectValue, soldOutValue, variantLabel } from "@/lib/catalogue/product";
import { addToErpBag } from "@/lib/erp-bag-store";
import type { ProductDetail } from "@/lib/erp/types";
import { useFormatPrice } from "@/lib/store";
import { formatPrice } from "@/lib/currency";
import { ProductGallery } from "./product-gallery";
import { QuantityStepper } from "./quantity-stepper";
import { WhatsAppOrderButton } from "./whatsapp-order-button";
import { InfoPanels, panels } from "./product-purchase";

/** Only the shipping panel: the local copy's fabric and care claims do not apply to arbitrary ERP products. */
const infoPanels = panels.filter((p) => p.title === "Shipping & returns");

/**
 * The ERP product: gallery and purchase area share the chosen option values, so picking a colour
 * switches the photos. Adding to the bag stores the variant id; the ERP prices it at checkout.
 */
export function ErpProduct({ product, whatsapp, url }: { product: ProductDetail; whatsapp: string | null; url: string }) {
  const [selection, setSelection] = useState(() => defaultSelection(product.variants));
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const format = useFormatPrice();

  const photos = galleryFor(product.images, selection).map((i, n) => ({
    url: i.url,
    alt: i.alt_text || (n === 0 ? product.title : `${product.title} — photo ${n + 1}`),
    width: i.width,
    height: i.height,
  }));
  const variant = selectedVariant(product.variants, selection);
  const price = variant?.price ?? product.price;
  const { priceKes, wasKes } = priceFor(price);
  const showFrom = !variant && product.price_varies;
  const inStock = variant ? variant.in_stock : product.in_stock;
  const description = product.description || product.short_description;
  const missing = firstUnchosen(product.option_types, selection);
  const canAdd = Boolean(variant?.in_stock) && !missing;

  const choose = (next: number[]) => {
    setSelection(next);
    setAdded(false);
  };
  const add = () => {
    if (!variant || !canAdd) return;
    addToErpBag({
      variantId: variant.id,
      slug: product.slug,
      title: product.title,
      label: variantLabel(product.option_types, selection),
      image: photos[0]?.url ?? null,
      quantity,
    });
    setAdded(true);
  };

  return (
    <div className="grid grid-cols-1 items-start gap-[clamp(28px,4.5vw,88px)] lg:grid-cols-[1.15fr_1fr]">
      <ProductGallery
        key={photos.map((p) => p.url).join("|")}
        photos={photos}
        name={product.title}
        badge={wasKes ? discountLabel(priceKes, wasKes) : undefined}
      />
      <div className="flex flex-col gap-3.5 lg:sticky lg:top-24">
        {product.categories[0] && (
          <span className="text-label font-normal uppercase tracking-label text-accent">{product.categories[0].name}</span>
        )}
        <h1 className="font-display text-[clamp(40px,4.4vw,64px)] leading-none">{product.title}</h1>

        <div className="flex flex-col gap-[26px]">
          <div className="flex flex-wrap items-baseline gap-3.5">
            {showFrom && <span className="text-small uppercase tracking-label text-copy">From</span>}
            <span className={`text-[28px] font-normal ${wasKes ? "text-accent" : ""}`}>{format(priceKes)}</span>
            {wasKes && (
              <>
                <span className="text-[17px] text-subtle line-through">{format(wasKes)}</span>
                <span className="text-small text-copy">You save {format(wasKes - priceKes)}</span>
              </>
            )}
          </div>

          {description && (
            <p className="border-t border-line pt-[26px] text-base leading-[1.75] text-pretty whitespace-pre-line text-copy">
              {description}
            </p>
          )}

          {product.option_types.map((type) => {
            const ids = type.values.map((v) => v.id);
            const chosen = type.values.find((v) => selection.includes(v.id));
            return (
              <fieldset key={type.name} className="flex flex-col gap-3.5">
                <legend className="mb-3.5 text-sm font-normal">
                  {type.name}
                  {chosen && (
                    <>
                      {" — "}
                      <span className="text-copy">{chosen.value}</span>
                    </>
                  )}
                </legend>
                <div className="flex flex-wrap gap-2.5">
                  {type.values.map((v) => {
                    const on = v.id === chosen?.id;
                    const soldOut = soldOutValue(product.variants, selection, ids, v.id);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        aria-pressed={on}
                        aria-label={soldOut ? `${v.value}, sold out` : v.value}
                        onClick={() => choose(selectValue(product.variants, product.option_types, selection, v.id))}
                        className={`h-12 min-w-[52px] cursor-pointer border px-4 text-sm ${soldOut ? "text-subtle line-through" : ""} ${on ? "border-ink bg-ink text-white" : "border-line-strong hover:border-ink"}`}
                      >
                        {v.value}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <QuantityStepper value={quantity} onChange={setQuantity} size="lg" />
              <button
                type="button"
                disabled={!canAdd}
                onClick={add}
                className="h-(--za-control-lg) flex-1 cursor-pointer bg-ink text-small font-normal uppercase tracking-button text-white hover:bg-accent disabled:cursor-not-allowed disabled:border disabled:border-line-strong disabled:bg-tint disabled:text-copy"
              >
                {missing ? `Choose ${missing.toLowerCase()}` : canAdd ? "Add to bag" : "Sold out"}
              </button>
            </div>
            <WhatsAppOrderButton
              whatsapp={whatsapp}
              order={{
                title: product.title,
                details: product.option_types.flatMap((t) => {
                  const chosen = t.values.find((v) => selection.includes(v.id));
                  return chosen ? [`${t.name}: ${chosen.value}`] : [];
                }),
                quantity,
                price: formatPrice(priceKes * quantity, "KES"),
                url,
              }}
            />
            {added && (
              <p role="status" className="flex flex-wrap gap-x-3 text-sm">
                Added to your bag.
                <Link href="/bag" className="border-b border-current hover:text-accent">
                  View bag
                </Link>
              </p>
            )}
            <Link
              href={`/contact?topic=Order%20enquiry&product=${encodeURIComponent(product.slug)}`}
              className="self-start border-b border-current pb-1 text-small font-normal uppercase tracking-button hover:text-accent"
            >
              Ask about this piece
            </Link>
          </div>

          <p className="flex gap-2.5 text-sm text-copy">
            <span aria-hidden className="text-accent">✓</span>
            {inStock ? "In stock" : "Currently sold out"}
          </p>

          <InfoPanels panels={infoPanels} />
        </div>
      </div>
    </div>
  );
}
