import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryResults } from "@/components/category-results";
import { CollectionPage } from "@/components/collection-page";
import { CollectionSearch } from "@/components/collection-search";
import { CollectionSection } from "@/components/collection-section";
import { catalogueSource } from "@/lib/catalogue-source";
import { loadCollections } from "@/lib/catalogue/loaders";
import { sanitizeListing } from "@/lib/catalogue/params";
import { categoryHref } from "@/lib/erp/queries";

export const metadata: Metadata = {
  title: "Ankara Shop: Dresses, Two Piece Sets & African Prints",
  description:
    "Browse Zionankara's Ankara dresses, gowns, two-piece sets, kimonos and African print clothing. Filter by size, colour, occasion and price.",
};

const title = (
  <>
    Ankara <em className="text-accent">collections</em>
  </>
);

export default function CollectionsPage({ searchParams }: PageProps<"/collections">) {
  // Local source: the page stays fully static and never touches searchParams.
  if (catalogueSource() === "local") return <CollectionPage title={title} />;

  // ERP source: every ERP read sits behind searchParams (request-time) inside Suspense, so builds never call the ERP.
  return (
    <Suspense fallback={<div aria-busy className="h-[clamp(180px,20vw,260px)] bg-tint" />}>
      <ErpCollections searchParams={searchParams} />
    </Suspense>
  );
}

async function ErpCollections({ searchParams }: Pick<PageProps<"/collections">, "searchParams">) {
  const raw = await searchParams;
  const view = await loadCollections(raw);

  if (view.search) {
    const { search } = view;
    return (
      <CollectionPage
        title={
          <>
            Results for <em className="text-accent">“{search.q}”</em>
          </>
        }
        trail={[{ label: "Home", href: "/" }, { label: "Collections", href: "/collections" }, { label: "Search" }]}
        intro={`${search.total} ${search.total === 1 ? "piece" : "pieces"} matching your search.`}
      >
        <CollectionSearch defaultValue={search.q} />
        <CategoryResults
          path="/collections"
          listing={sanitizeListing(raw)}
          products={search.products}
          total={search.total}
          page={search.page}
          pageCount={search.pageCount}
        />
      </CollectionPage>
    );
  }

  return (
    <CollectionPage title={title}>
      <CollectionSearch />
      <div className="flex flex-col gap-[clamp(48px,6vw,88px)]">
        {view.sections.map((section, i) => (
          <CollectionSection
            key={section.slug}
            name={section.name}
            href={categoryHref(section.slug)}
            products={section.products}
            eager={i === 0}
          />
        ))}
        {view.sections.length === 0 && (
          <p className="bg-tint px-6 py-24 text-center font-display text-[32px]">New pieces are on their way</p>
        )}
      </div>
    </CollectionPage>
  );
}
