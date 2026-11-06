import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ErpProduct } from "@/components/erp-product";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPurchase } from "@/components/product-purchase";
import { getCategory, getProduct, products } from "@/lib/catalog";
import { catalogueSource } from "@/lib/catalogue-source";
import { loadProductPage, MAX_PRODUCT_SLUG } from "@/lib/catalogue/loaders";
import { discountLabel } from "@/lib/currency";
import { getContactOrNull } from "@/lib/erp/header-data";
import { getProduct as getErpProduct } from "@/lib/erp/queries";
import { siteUrl } from "@/lib/site-url";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  if (catalogueSource() === "erp") {
    const { slug } = await params;
    if (slug.length > MAX_PRODUCT_SLUG) return {};
    await connection(); // request time only: metadata must not reach the ERP during a build
    try {
      const product = await getErpProduct(slug);
      const image = product.images.find((i) => i.is_main) ?? product.images[0];
      return {
        title: product.seo_title || product.title,
        description: product.meta_description || product.short_description || undefined,
        openGraph: image ? { images: [image.url] } : undefined,
      };
    } catch {
      // Missing/renamed/failed: the page body reports it (404, redirect or error page).
      return {};
    }
  }

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
      {catalogueSource() === "erp" ? <ErpProductDetails params={params} /> : <ProductDetails params={params} />}
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
  const whatsapp = (await getContactOrNull())?.whatsapp ?? null;

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
          <ProductPurchase product={product} whatsapp={whatsapp} url={`${siteUrl}/products/${product.slug}`} />
        </div>
      </div>
    </div>
  );
}

async function ErpProductDetails({ params }: Pick<PageProps<"/products/[slug]">, "params">) {
  const { slug } = await params;
  if (slug.length > MAX_PRODUCT_SLUG) notFound();
  const { product, recommendations } = await loadProductPage(slug);
  const category = product.categories[0];
  const image = product.images.find((i) => i.is_main) ?? product.images[0];
  const whatsapp = (await getContactOrNull())?.whatsapp ?? null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description ?? product.short_description ?? undefined,
    image: image?.url,
    brand: { "@type": "Brand", name: "Zionankara" },
    offers: {
      "@type": "Offer",
      price: product.price.current.amount,
      priceCurrency: product.price.current.currency,
      availability: product.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
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
          ...(category ? [{ label: category.name, href: `/collections/${encodeURIComponent(category.slug)}` }] : []),
          { label: product.title },
        ]}
      />
      <ErpProduct product={product} whatsapp={whatsapp} url={`${siteUrl}/products/${encodeURIComponent(product.slug)}`} />
      {recommendations.length > 0 && (
        <section className="flex flex-col gap-8 border-t border-line pt-[clamp(32px,4vw,56px)]">
          <h2 className="font-display text-h2 font-normal">
            You may also <em>like</em>
          </h2>
          <div className="grid grid-cols-2 gap-x-[clamp(16px,2vw,28px)] gap-y-10 lg:grid-cols-4">
            {recommendations.map((p) => (
              <ProductCard key={p.slug} product={p} sizes="(min-width: 1024px) 25vw, 50vw" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
