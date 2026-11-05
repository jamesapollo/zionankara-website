import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/button-link";

export const metadata: Metadata = {
  title: "About Zionankara | Ankara Fashion Atelier, Nairobi",
  description:
    "The story behind Zionankara — authentic Ankara wax prints, cut in small batches with clean modern lines and finished by hand.",
};

const eyebrow = "text-label font-normal uppercase tracking-[0.28em] text-accent";
const h2 = "font-display text-h2 font-normal text-balance";
const wrap = "mx-auto max-w-site px-(--za-gutter)";

const values = [
  ["i.", "Authentic prints", "We work only with genuine wax prints, chosen bolt by bolt for colour, weight and story."],
  ["ii.", "Small batches", "Each style is cut in limited runs — less waste, more care, and pieces that stay special."],
  ["iii.", "Made to last", "Finished by hand with lined seams and generous hems, so every garment can be passed on."],
] as const;

const steps = [
  ["01", "Sourcing", "Prints selected for quality and colourfastness.", "/images/products/forest-boubou.jpg"],
  ["02", "Pattern & cut", "Clean, modern silhouettes drafted in our atelier.", "/images/products/royal-corset-dress.jpg"],
  ["03", "Hand finishing", "Seams, hems and fastenings finished by hand.", "/images/products/floral-panel-dress.jpg"],
  ["04", "To your door", "Wrapped with care and shipped worldwide.", "/images/products/indigo-wrap-kaftan.jpg"],
] as const;

export default function AboutPage() {
  return (
    <>
      <section className={`${wrap} flex flex-col items-center gap-7 pt-[clamp(72px,9vw,140px)] pb-[clamp(48px,6vw,80px)] text-center`}>
        <span className={`flex items-center gap-3.5 ${eyebrow}`}>
          <span className="h-px w-10 bg-accent" />
          Our story
          <span className="h-px w-10 bg-accent" />
        </span>
        <h1 className="max-w-[980px] font-display text-[clamp(48px,6.4vw,104px)] leading-[0.98] font-normal tracking-[-0.01em] text-balance">
          Woven in heritage, <em className="text-accent">worn</em> around the world.
        </h1>
        <p className="max-w-[560px] text-[clamp(16px,1.3vw,18px)] leading-[1.8] text-copy">
          Zionankara is a small atelier dedicated to one idea — that Ankara deserves the same care as any fine textile.
        </p>
      </section>

      <div className={wrap}>
        <div className="relative aspect-[21/9] min-h-[320px] w-full max-w-full overflow-hidden">
          <Image
            src="/images/editorial/fabric-market.jpg"
            alt="Bolts of wax-print fabric at a market stall"
            fill
            priority
            sizes="(min-width: 1360px) 1248px, 100vw"
            className="object-cover"
          />
        </div>
      </div>

      <section className={`${wrap} grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-center gap-[clamp(40px,6vw,104px)] py-[clamp(72px,9vw,140px)]`}>
        <div className="flex flex-col gap-7">
          <span className={eyebrow}>How it began</span>
          <h2 className={`${h2} leading-[1.04]`}>
            A love of print, <em>passed down</em>.
          </h2>
          <p className="max-w-[520px] text-body-lg leading-[1.8] text-copy">
            It started in a family sewing room, surrounded by bolts of wax print and the women who wore them with pride.
            Our founder wanted those prints to live in pieces that felt as considered as anything in a fine boutique.
          </p>
          <p className="max-w-[520px] text-body-lg leading-[1.8] text-copy">
            Today, Zionankara dresses women across the world — for weddings, celebrations and the quiet everyday.
          </p>
          <p className="mt-2 font-display text-[28px] italic text-ink">— Founder name, Creative Director</p>
        </div>
        <div className="relative aspect-[4/5] max-h-[720px] overflow-hidden rounded-t-[400px]">
          <Image
            src="/images/editorial/about-gate.jpg"
            alt="Two women wearing Zionankara wax-print pieces against an iron gate"
            fill
            sizes="(min-width: 900px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </section>

      <section className="bg-tint">
        <div className={`${wrap} flex flex-col gap-14 py-[clamp(64px,8vw,120px)]`}>
          <div className="flex flex-col items-center gap-3.5 text-center">
            <span className={eyebrow}>What we stand for</span>
            <h2 className={`${h2} leading-none`}>
              Made with <em>intention</em>
            </h2>
          </div>
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-[clamp(32px,4vw,56px)]">
            {values.map(([n, title, body]) => (
              <li key={n} className="flex flex-col gap-4 border-t border-ink pt-7">
                <span className="font-display text-xl italic text-accent">{n}</span>
                <h3 className="font-display text-[30px] leading-[1.1] font-medium">{title}</h3>
                <p className="leading-[1.8] text-copy">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`${wrap} flex flex-col gap-14 py-[clamp(72px,9vw,140px)]`}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-3.5">
            <span className={eyebrow}>From bolt to wardrobe</span>
            <h2 className={`${h2} leading-none`}>
              Our <em>process</em>
            </h2>
          </div>
          <p className="max-w-[380px] leading-[1.7] text-copy">
            Each piece passes through the same careful hands, start to finish.
          </p>
        </div>
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-7">
          {steps.map(([n, title, body, src]) => (
            <li key={n} className="flex flex-col gap-5">
              <div className="relative aspect-[4/5] overflow-hidden bg-panel">
                <Image src={src} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 520px) 50vw, 100vw" className="object-cover" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline gap-3.5">
                  <span className="text-label tracking-[0.2em] text-accent">{n}</span>
                  <h3 className="font-display text-[26px] font-medium">{title}</h3>
                </div>
                <p className="text-body leading-[1.7] text-copy">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,460px),1fr))] bg-ink text-white">
        <div className="relative min-h-[clamp(380px,42vw,620px)]">
          <Image
            src="/images/hero/hero-studio.jpg"
            alt="A woman wearing Zionankara"
            fill
            sizes="(min-width: 960px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <figure className="flex flex-col justify-center gap-7 px-[clamp(24px,6vw,96px)] py-[clamp(56px,8vw,120px)]">
          <span className="text-label font-normal uppercase tracking-[0.28em] text-accent-soft">In her words</span>
          <blockquote className="font-display text-[clamp(32px,3.4vw,52px)] leading-[1.15] font-normal text-balance">
            “I wore it to my daughter’s wedding and was asked about it all night. It feels{" "}
            <em className="text-accent-soft">made for me</em>.”
          </blockquote>
          <figcaption className="text-small uppercase tracking-[0.2em] text-[#bdbdbd]">Client name · London</figcaption>
        </figure>
      </section>

      <section className={`${wrap} flex flex-col items-center gap-7 py-[clamp(72px,9vw,140px)] text-center`}>
        <h2 className="max-w-[760px] font-display text-[clamp(40px,4.6vw,68px)] leading-[1.02] font-normal text-balance">
          Find a piece to <em className="text-accent">treasure</em>.
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          <ButtonLink href="/collections">Shop the collection</ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            Contact the atelier
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
