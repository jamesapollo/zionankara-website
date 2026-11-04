import Link from "next/link";
import type { CategoryLink } from "@/lib/erp/types";
import { categoryHref } from "@/lib/erp/queries";

/** Links to a parent category's sub-categories (e.g. Occasion), shown above its product grid. */
export function SubCategoryStrip({ items }: { items: CategoryLink[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Sub-categories" className="mb-[clamp(28px,3vw,44px)] flex flex-wrap gap-3 border-b border-line pb-[clamp(28px,3vw,44px)]">
      {items.map((item) => (
        <Link
          key={item.slug}
          href={categoryHref(item.slug)}
          className="border border-line-strong px-[22px] py-3 text-small uppercase tracking-[0.2em] hover:border-ink hover:bg-ink hover:text-white"
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
}
