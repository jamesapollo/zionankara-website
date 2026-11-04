import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { cardFromLocal } from "@/lib/catalogue/map";
import type { CardProduct } from "@/lib/catalogue/types";
import { discountLabel } from "@/lib/currency";
import { Price } from "./price";

type ProductCardProps = {
  /** A local sample product or a card mapped from the ERP. */
  product: Product | CardProduct;
  /** Classes for the image frame; defaults to the style guide's 4:5 ratio. */
  frameClassName?: string;
  titleClassName?: string;
  showNote?: boolean;
  priceSize?: "md" | "lg";
  showNewBadge?: boolean;
  /** Load immediately; set for cards in the first visible row. */
  eager?: boolean;
  sizes: string;
};

export function ProductCard({
  product: source,
  frameClassName = "aspect-product",
  titleClassName = "text-[22px]",
  showNote = false,
  priceSize = "md",
  showNewBadge = false,
  eager = false,
  sizes,
}: ProductCardProps) {
  const product = "price" in source ? source : cardFromLocal(source);
  const priceKes = Number(product.price.current.amount);
  const wasKes = product.price.on_offer ? Number(product.price.original.amount) : undefined;
  return (
    <Link href={`/products/${encodeURIComponent(product.slug)}`} className="group flex h-full flex-col gap-4 hover:text-ink">
      <div className={`relative overflow-hidden bg-tint ${frameClassName}`}>
        {product.image && (
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            sizes={sizes}
            loading={eager ? "eager" : "lazy"}
            className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
          />
        )}
        {showNewBadge && product.isNew && (
          <span className="absolute top-3.5 left-3.5 bg-white px-2.5 py-1.5 text-[11px] font-normal uppercase tracking-[0.2em]">
            New
          </span>
        )}
        {wasKes && (
          <span className="absolute top-3.5 right-3.5 bg-accent px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white">
            {discountLabel(priceKes, wasKes)}
          </span>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className={`font-display font-medium leading-[1.1] group-hover:text-accent ${titleClassName}`}>{product.name}</h3>
          {showNote && <span className="text-small text-muted">{product.note}</span>}
        </div>
        <Price priceKes={priceKes} wasKes={wasKes} size={priceSize} />
      </div>
    </Link>
  );
}
