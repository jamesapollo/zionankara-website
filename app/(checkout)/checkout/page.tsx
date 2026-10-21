import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto flex max-w-site flex-col gap-4 px-(--za-gutter) py-[clamp(28px,3.5vw,44px)]">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Bag", href: "/bag" }, { label: "Checkout" }]} />
          <h1 className="font-display text-[clamp(44px,5vw,72px)] leading-none">Checkout</h1>
        </div>
      </section>
      <CheckoutForm />
    </>
  );
}
