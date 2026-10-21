import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPurchase } from "@/components/product-purchase";
import { getCategory, getProduct, products } from "@/lib/catalog";
import { discountLabel } from "@/lib/currency";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = getProduct((await params).slug);
  if (!product) return {};
  const category = getCategory(product.categorySlug);
  return {
    title: `${product.name} — Ankara ${category?.singular ?? "Piece"}`,
    description: `${product.description} Made to measure available, worldwide shipping.`,
    openGraph: { images: [product.image] },
  };
}

const container =
  "mx-auto flex max-w-site flex-col gap-[clamp(24px,3vw,40px)] px-(--za-gutter) pt-[clamp(24px,3vw,40px)] pb-[clamp(64px,8vw,112px)]";

// The params read lives inside Suspense so the shared route shell stays URL-independent (instant navigation).
export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductDetails params={params} />
    </Suspense>
  );
}

function ProductSkeleton() {
  return (
    <div className={container} aria-busy>
      <div className="h-4 w-64 bg-tint" />
      <div className="grid grid-cols-1 gap-[clamp(28px,4.5vw,88px)] lg:grid-cols-[1.15fr_1fr]">
        <div className="aspect-product bg-tint" />
        <div className="flex flex-col gap-4">
          <div className="h-3 w-24 bg-tint" />
          <div className="h-14 w-3/4 bg-tint" />
          <div className="h-8 w-40 bg-tint" />
        </div>
      </div>
    </div>
  );
}

async function ProductDetails({ params }: Pick<PageProps<"/products/[slug]">, "params">) {
  const product = getProduct((await params).slug);
  if (!product) notFound();
  const category = getCategory(product.categorySlug);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    brand: { "@type": "Brand", name: "Zionankara" },
    offers: {
      "@type": "Offer",
      price: product.priceKes,
      priceCurrency: "KES",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div className={container}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Collections", href: "/collections" },
          ...(category ? [{ label: category.name, href: `/collections/${category.slug}` }] : []),
          { label: product.name },
        ]}
      />
      <div className="grid grid-cols-1 items-start gap-[clamp(28px,4.5vw,88px)] lg:grid-cols-[1.15fr_1fr]">
        <ProductGallery
          image={product.image}
          name={product.name}
          badge={product.wasKes ? discountLabel(product.priceKes, product.wasKes) : undefined}
        />
        <div className="flex flex-col gap-3.5 lg:sticky lg:top-24">
          <span className="text-label font-normal uppercase tracking-label text-accent">{category?.singular}</span>
          <h1 className="font-display text-[clamp(40px,4.4vw,64px)] leading-none">{product.name}</h1>
          <ProductPurchase product={product} />
        </div>
      </div>
    </div>
  );
}
