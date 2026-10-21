import Image from "next/image";
import Link from "next/link";
import { ButtonLink, TextLink } from "@/components/button-link";
import { ProductCard } from "@/components/product-card";
import { categories, newArrivals, signaturePieces } from "@/lib/catalog";

const eyebrow = "text-label font-normal uppercase tracking-[0.28em] text-accent";
const sectionTitle = "font-display text-h2 font-normal";

export default function Home() {
  const [featured, ...arrivals] = newArrivals;

  return (
    <>
      {/* Hero */}
      {/* Below md the photo stacks above the copy so the text never covers the model. */}
      <section className="relative w-full overflow-hidden bg-[#efe4d6] md:aspect-video md:max-h-[calc(100vh-70px)] md:min-h-[580px]">
        <div className="relative aspect-[4/3] md:absolute md:inset-0 md:aspect-auto">
          <Image
            src="/images/hero/hero-studio.jpg"
            alt="Woman in an Ankara dress arranging folded wax-print fabrics"
            fill
            sizes="100vw"
            loading="eager"
            fetchPriority="high"
            className="object-cover object-[72%_center]"
          />
        </div>
        <div className="relative mx-auto flex h-full max-w-site items-center px-(--za-gutter) py-[clamp(32px,5vw,72px)]">
          <div className="flex w-[min(100%,clamp(340px,36vw,520px))] flex-col gap-[clamp(20px,2.4vw,32px)]">
            <h1 className="flex items-center gap-3.5 text-small font-normal uppercase tracking-label text-[#3e3a36]">
              <span className="h-px w-10 shrink-0 bg-accent" />
              Ankara Dresses &amp; African Print Clothing
            </h1>
            <p className="font-display text-display leading-[0.98] tracking-[-0.01em] text-balance">
              Heritage, <em className="text-accent">tailored</em> for the woman of now.
            </p>
            <p className="max-w-[420px] text-[clamp(16px,1.3vw,18px)] leading-[1.7] text-pretty text-[#3e3a36]">
              Contemporary silhouettes cut from authentic Ankara wax prints — pieces made to be treasured, worn and
              passed on.
            </p>
            <div className="flex flex-wrap gap-4">
              <ButtonLink href="#new">Shop the collection</ButtonLink>
              <ButtonLink href="#categories" variant="secondary">
                Explore prints
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="border-t border-line py-[clamp(56px,7vw,96px)]">
        <div className="mx-auto mb-11 flex max-w-site flex-wrap items-end justify-between gap-6 px-(--za-gutter)">
          <h2 className={sectionTitle}>
            Best <em>collections</em>
          </h2>
          <TextLink href="/collections">All collections</TextLink>
        </div>
        <div className="mx-auto flex max-w-site snap-x snap-proximity gap-7 overflow-x-auto scroll-px-(--za-gutter) px-(--za-gutter) pb-4">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/collections/${category.slug}`}
              className="group flex shrink-0 snap-start flex-col items-center gap-[18px] hover:text-accent"
            >
              <div className="relative h-[260px] w-[200px] overflow-hidden rounded-t-[100px] bg-tint">
                <Image
                  src={category.image}
                  alt=""
                  fill
                  sizes="200px"
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
                />
              </div>
              <span className="font-display text-[22px] font-medium">{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* New arrivals */}
      <section id="new" className="mx-auto max-w-site px-(--za-gutter) py-[clamp(56px,7vw,96px)]">
        <div className="mb-11 flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-3.5">
            <span className={eyebrow}>Just arrived</span>
            <h2 className={sectionTitle}>New arrivals</h2>
          </div>
          <p className="max-w-[380px] text-base leading-[1.7] text-copy">
            Limited runs, each cut from a single bolt of print — once it’s gone, it’s gone.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:auto-rows-[minmax(460px,auto)] lg:grid-cols-4">
          <div className="md:col-span-2 lg:row-span-2">
            <ProductCard
              product={featured}
              showNote
              priceSize="lg"
              titleClassName="text-[28px]"
              frameClassName="aspect-product lg:aspect-auto lg:min-h-[560px] lg:flex-1"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
          {arrivals.map((product, i) => (
            <div key={product.slug} className={i === arrivals.length - 1 ? "md:col-span-2" : undefined}>
              <ProductCard
                product={product}
                showNote
                frameClassName="aspect-product lg:aspect-auto lg:min-h-[340px] lg:flex-1"
                sizes={
                  i === arrivals.length - 1
                    ? "(min-width: 768px) 50vw, 100vw"
                    : "(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                }
              />
            </div>
          ))}
        </div>
        <div className="mt-14 flex justify-center">
          <ButtonLink href="/collections" variant="secondary" className="px-11">
            Show more
          </ButtonLink>
        </div>
      </section>

      {/* Celebration banner */}
      <section className="grid grid-cols-1 bg-ink text-white lg:grid-cols-2">
        <div className="flex flex-col justify-center gap-7 px-[clamp(24px,6vw,96px)] py-[clamp(56px,8vw,120px)]">
          <span className="text-label font-normal uppercase tracking-[0.28em] text-accent-soft">The Celebration Edit</span>
          <h2 className="font-display text-[clamp(44px,5.5vw,84px)] leading-none text-balance">
            Dressed for every <em className="text-accent-soft">occasion</em> worth remembering.
          </h2>
          <p className="max-w-[460px] text-body-lg text-[#bdbdbd]">
            Weddings, owambe, christenings and quiet dinners — wax-print pieces finished by hand, shipped worldwide.
          </p>
          <div>
            <ButtonLink href="/collections/gowns" variant="on-dark" className="px-9">
              Shop the edit
            </ButtonLink>
          </div>
        </div>
        <div className="relative min-h-[clamp(380px,42vw,620px)]">
          <Image
            src="/images/products/veiled-maxi-dress.jpg"
            alt="Model in a floral Ankara maxi dress with a sheer orange veil"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover object-[center_20%]"
          />
        </div>
      </section>

      {/* Signature pieces */}
      <section id="shop" className="mx-auto max-w-site px-(--za-gutter) py-[clamp(64px,8vw,112px)]">
        <div className="mb-14 flex flex-col items-center gap-3.5 text-center">
          <span className={eyebrow}>Most loved</span>
          <h2 className={sectionTitle}>Signature pieces</h2>
        </div>
        <div className="grid grid-cols-1 gap-x-[clamp(20px,3vw,48px)] gap-y-[clamp(40px,4vw,64px)] sm:grid-cols-2">
          {signaturePieces.map((product) => (
            <ProductCard
              key={product.slug}
              product={product}
              priceSize="lg"
              titleClassName="text-[clamp(24px,2.2vw,32px)]"
              sizes="(min-width: 1360px) 650px, (min-width: 640px) 50vw, 100vw"
            />
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-tint">
        <div className="mx-auto grid max-w-site grid-cols-1 items-center gap-[clamp(40px,6vw,104px)] px-(--za-gutter) py-[clamp(64px,8vw,120px)] lg:grid-cols-2">
          <div className="relative aspect-product max-h-[720px] overflow-hidden rounded-b-[400px]">
            <Image
              src="/images/editorial/about-gate.jpg"
              alt="Two women wearing Zionankara wax-print pieces against an iron gate"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-7">
            <span className={eyebrow}>Our story</span>
            <h2 className="font-display text-[clamp(40px,4.6vw,68px)] leading-[1.02] text-balance">
              Woven in heritage, <em>worn</em> around the world.
            </h2>
            <p className="max-w-[520px] text-body-lg leading-[1.8] text-pretty text-copy">
              Zionankara began with a simple belief: that Ankara deserves the same care as any fine textile. We source
              authentic wax prints, then cut each piece in small batches with clean, modern lines — for daughters,
              mothers and grandmothers alike.
            </p>
            <p className="max-w-[520px] text-body-lg leading-[1.8] text-pretty text-copy">
              Every garment is finished by hand and made to last for generations.
            </p>
            <div>
              <ButtonLink href="/about">Learn more</ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
