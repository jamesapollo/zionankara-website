import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { discountLabel } from "@/lib/currency";
import { Price } from "./price";

type ProductCardProps = {
  product: Product;
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
  product,
  frameClassName = "aspect-product",
  titleClassName = "text-[22px]",
  showNote = false,
  priceSize = "md",
  showNewBadge = false,
  eager = false,
  sizes,
}: ProductCardProps) {
  return (
    <Link href={`/products/${product.slug}`} className="group flex h-full flex-col gap-4 hover:text-ink">
      <div className={`relative overflow-hidden bg-tint ${frameClassName}`}>
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes={sizes}
          loading={eager ? "eager" : "lazy"}
          className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
        />
        {showNewBadge && product.isNew && (
          <span className="absolute top-3.5 left-3.5 bg-white px-2.5 py-1.5 text-[11px] font-normal uppercase tracking-[0.2em]">
            New
          </span>
        )}
        {product.wasKes && (
          <span className="absolute top-3.5 right-3.5 bg-accent px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white">
            {discountLabel(product.priceKes, product.wasKes)}
          </span>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className={`font-display font-medium leading-[1.1] group-hover:text-accent ${titleClassName}`}>{product.name}</h3>
          {showNote && <span className="text-small text-muted">{product.note}</span>}
        </div>
        <Price priceKes={product.priceKes} wasKes={product.wasKes} size={priceSize} />
      </div>
    </Link>
  );
}
