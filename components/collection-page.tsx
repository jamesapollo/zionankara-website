import type { ReactNode } from "react";
import { Breadcrumbs } from "./breadcrumbs";
import { CollectionBrowser } from "./collection-browser";

type CollectionPageProps = {
  title: ReactNode;
  crumb?: string;
  initialCategory?: string;
  initialSort?: "featured" | "new";
};

export function CollectionPage({ title, crumb, initialCategory, initialSort }: CollectionPageProps) {
  return (
    <>
      <section className="bg-tint">
        <div className="mx-auto flex max-w-site flex-wrap items-end justify-between gap-8 px-(--za-gutter) py-[clamp(40px,5vw,72px)]">
          <div className="flex flex-col gap-[18px]">
            <Breadcrumbs
              items={
                crumb
                  ? [{ label: "Home", href: "/" }, { label: "Collections", href: "/collections" }, { label: crumb }]
                  : [{ label: "Home", href: "/" }, { label: "Collections" }]
              }
            />
            <h1 className="font-display text-[clamp(44px,5.5vw,80px)] leading-none">{title}</h1>
          </div>
          <p className="max-w-[420px] text-base leading-[1.7] text-pretty text-copy">
            Gowns, sets and everyday pieces in authentic African wax prints — cut in small batches, shipped worldwide.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-site px-(--za-gutter) pt-[clamp(32px,4vw,56px)] pb-[clamp(64px,8vw,112px)]">
        {/* Keyed so moving between collections resets the filters to that collection. */}
        <CollectionBrowser key={`${initialCategory}-${initialSort}`} initialCategory={initialCategory} initialSort={initialSort} />
      </section>
    </>
  );
}
