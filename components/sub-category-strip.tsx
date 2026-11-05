import type { CollectionSectionView } from "@/lib/catalogue/types";
import { categoryHref } from "@/lib/erp/queries";
import { CollectionSection } from "./collection-section";

/** A parent category's sub-categories (e.g. Occasion) as Collections-style sections, above its product grid. */
export function SubCategoryStrip({ sections }: { sections: CollectionSectionView[] }) {
  if (sections.length === 0) return null;
  return (
    <div className="mb-[clamp(40px,5vw,72px)] flex flex-col gap-[clamp(40px,5vw,64px)] border-b border-line pb-[clamp(40px,5vw,72px)]">
      {sections.map((s) => (
        <CollectionSection key={s.slug} name={s.name} href={categoryHref(s.slug)} products={s.products} />
      ))}
    </div>
  );
}
