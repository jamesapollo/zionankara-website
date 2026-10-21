import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CollectionPage } from "@/components/collection-page";
import { categories, getCategory } from "@/lib/catalog";

// "new-in" is a collection view sorted by newest rather than a product category.
const NEW_IN = "new-in";

export function generateStaticParams() {
  return [{ category: NEW_IN }, ...categories.map((c) => ({ category: c.slug }))];
}

export async function generateMetadata({ params }: PageProps<"/collections/[category]">): Promise<Metadata> {
  const { category: slug } = await params;
  if (slug === NEW_IN) return { title: "New In — Ankara Dresses" };
  const category = getCategory(slug);
  if (!category) return {};
  return {
    title: `Ankara ${category.name}`,
    description: `Shop Zionankara ${category.name.toLowerCase()} cut from authentic African wax prints. Worldwide shipping.`,
  };
}

// The params read lives inside Suspense so the shared route shell stays URL-independent (instant navigation).
export default function CategoryPage({ params }: PageProps<"/collections/[category]">) {
  return (
    <Suspense fallback={<div aria-busy className="h-[clamp(180px,20vw,260px)] bg-tint" />}>
      <Category params={params} />
    </Suspense>
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
