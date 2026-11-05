import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CategoryResults } from "@/components/category-results";
import { CollectionPage } from "@/components/collection-page";
import { SubCategoryStrip } from "@/components/sub-category-strip";
import { catalogueSource } from "@/lib/catalogue-source";
import { categories, getCategory } from "@/lib/catalog";
import { loadCategoryPage } from "@/lib/catalogue/loaders";
import { titleParts } from "@/lib/catalogue/map";
import { getCategory as getErpCategory } from "@/lib/erp/queries";

// "new-in" is a collection view sorted by newest rather than a product category.
const NEW_IN = "new-in";
const MAX_SLUG = 120; // the ERP's category slug limit

// Only the local slugs are listed; under the ERP source the page body reads searchParams before any ERP call,
// so prerendering these never contacts the ERP and every other slug renders on demand.
export function generateStaticParams() {
  return [{ category: NEW_IN }, ...categories.map((c) => ({ category: c.slug }))];
}

export async function generateMetadata({ params, searchParams }: PageProps<"/collections/[category]">): Promise<Metadata> {
  const { category: slug } = await params;

  if (catalogueSource() === "erp") {
    // Request-time read: metadata must not reach the ERP during a build.
    await searchParams;
    try {
      const category = await getErpCategory(slug);
      return {
        title: category.seo_title || `Ankara ${category.name}`,
        description: category.meta_description || category.description || undefined,
      };
    } catch {
      // Missing/renamed/failed: the page body reports it (404, redirect or error page).
      return {};
    }
  }

  if (slug === NEW_IN) return { title: "New In — Ankara Dresses" };
  const category = getCategory(slug);
  if (!category) return {};
  return {
    title: `Ankara ${category.name}`,
    description: `Shop Zionankara ${category.name.toLowerCase()} cut from authentic African wax prints. Worldwide shipping.`,
  };
}

// The params read lives inside Suspense so the shared route shell stays URL-independent (instant navigation).
export default function CategoryPage({ params, searchParams }: PageProps<"/collections/[category]">) {
  return (
    <Suspense fallback={<div aria-busy className="h-[clamp(180px,20vw,260px)] bg-tint" />}>
      {catalogueSource() === "erp" ? <ErpCategory params={params} searchParams={searchParams} /> : <Category params={params} />}
    </Suspense>
  );
}

async function ErpCategory({ params, searchParams }: PageProps<"/collections/[category]">) {
  const [{ category: slug }, raw] = await Promise.all([params, searchParams]);
  if (slug.length > MAX_SLUG) notFound();

  const { view, listing } = await loadCategoryPage(slug, raw);
  const { category } = view;
  const { lead, accent } = titleParts(category.name, category.kind);
  const path = `/collections/${encodeURIComponent(category.slug)}`;

  return (
    <CollectionPage
      title={
        <>
          {lead} <em className="text-accent">{accent}</em>
        </>
      }
      trail={[
        { label: "Home", href: "/" },
        { label: "Collections", href: "/collections" },
        ...(category.parent ? [{ label: category.parent.name, href: `/collections/${encodeURIComponent(category.parent.slug)}` }] : []),
        { label: category.name },
      ]}
      intro={category.description ?? undefined}
    >
      <SubCategoryStrip sections={view.subSections} />
      <CategoryResults
        path={path}
        listing={listing}
        products={view.products}
        total={view.total}
        page={view.page}
        pageCount={view.pageCount}
        filters={view.filters}
        priceRange={view.priceRange}
      />
    </CollectionPage>
  );
}

async function Category({ params }: Pick<PageProps<"/collections/[category]">, "params">) {
  const { category: slug } = await params;

  if (slug === NEW_IN) {
    return (
      <CollectionPage
        crumb="New in"
        initialSort="new"
        title={
          <>
            New <em className="text-accent">in</em>
          </>
        }
      />
    );
  }

  const category = getCategory(slug);
  if (!category) notFound();

  return (
    <CollectionPage
      crumb={category.name}
      initialCategory={category.slug}
      title={
        <>
          Ankara <em className="text-accent">{category.name.toLowerCase()}</em>
        </>
      }
    />
  );
}
