import { Breadcrumbs } from "./breadcrumbs";
import { ButtonLink } from "./button-link";

/** Shown in place of the bag and checkout while the catalogue comes from the ERP and online ordering is paused. */
export function OrderingPaused({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <section className="mx-auto flex max-w-site flex-col items-start gap-6 px-(--za-gutter) py-[clamp(48px,7vw,112px)]">
      <Breadcrumbs items={trail} />
      <h1 className="font-display text-[clamp(44px,5vw,72px)] leading-none">Online ordering is coming soon</h1>
      <p className="max-w-[520px] text-base leading-[1.7] text-copy">
        We are getting the shop ready for online orders. Until then, get in touch and we will help you with any piece you
        love.
      </p>
      <ButtonLink href="/contact">Contact us</ButtonLink>
    </section>
  );
}
