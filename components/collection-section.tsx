import Link from "next/link";
import type { CardProduct } from "@/lib/catalogue/types";
import { ProductCard } from "./product-card";

type CollectionSectionProps = {
  name: string;
  href: string;
  products: CardProduct[];
  /** Give the first section's images priority. */
  eager?: boolean;
};

/** A category's newest products with a "View all" link, used on /collections. */
export function CollectionSection({ name, href, products, eager = false }: CollectionSectionProps) {
  return (
    <section aria-label={name} className="flex flex-col gap-7">
      <div className="flex items-baseline justify-between gap-4 border-b border-line pb-4">
        <h2 className="font-display text-h3">{name}</h2>
        <Link href={href} className="text-small uppercase tracking-[0.2em] underline-offset-[3px] hover:text-accent hover:underline">
          View all<span className="sr-only"> {name}</span>
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-[clamp(16px,2vw,28px)] gap-y-[clamp(36px,3.5vw,52px)] lg:grid-cols-4">
        {products.map((product, i) => (
          <ProductCard
            key={product.slug}
            product={product}
            showNewBadge
            eager={eager && i < 4}
            titleClassName="text-[clamp(18px,1.7vw,24px)]"
            sizes="(min-width: 1360px) 310px, (min-width: 1024px) 25vw, 50vw"
          />
        ))}
      </div>
    </section>
  );
}
