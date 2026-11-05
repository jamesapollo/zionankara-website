import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactDetailsCards } from "@/components/contact-details-cards";
import { ContactForm } from "@/components/contact-form";
import { Faq } from "@/components/faq";
import { getContactOrNull } from "@/lib/erp/header-data";
import { humaniseSlug } from "@/lib/enquiry";

export const metadata: Metadata = {
  title: "Contact Zionankara | Atelier in Nairobi",
  description: "Write to the Zionankara atelier — orders, made-to-measure, press and wholesale enquiries.",
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default function ContactPage({ searchParams }: PageProps<"/contact">) {
  return (
    <>
      <section className="mx-auto flex max-w-site flex-col items-center gap-7 px-(--za-gutter) pt-[clamp(72px,9vw,140px)] pb-[clamp(48px,6vw,80px)] text-center">
        <span className="flex items-center gap-3.5 text-label font-normal uppercase tracking-[0.28em] text-accent">
          <span className="h-px w-10 bg-accent" />
          Contact
          <span className="h-px w-10 bg-accent" />
        </span>
        <h1 className="max-w-[980px] font-display text-[clamp(48px,6.4vw,104px)] leading-[0.98] font-normal tracking-[-0.01em] text-balance">
          We would love to <em className="text-accent">hear</em> from you.
        </h1>
        <p className="max-w-[560px] text-[clamp(16px,1.3vw,18px)] leading-[1.8] text-copy">
          Orders, made-to-measure, press or simply a question about a print — write to the atelier and we will reply
          within two working days.
        </p>
      </section>
      {/* Reads searchParams and the ERP contact details at request time, so builds never call the ERP. */}
      <Suspense fallback={<div aria-busy className="min-h-[640px]" />}>
        <ContactMain searchParams={searchParams} />
      </Suspense>
      <Faq />
    </>
  );
}

async function ContactMain({ searchParams }: Pick<PageProps<"/contact">, "searchParams">) {
  const params = await searchParams;
  const contact = await getContactOrNull();
  const topics = contact?.enquiry_topics ?? [];
  const wanted = one(params.topic);
  const defaultTopic = topics.includes(wanted) ? wanted : (topics[0] ?? "");
  const product = humaniseSlug(one(params.product));

  return (
    <section className="mx-auto grid max-w-site grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-[clamp(48px,7vw,120px)] px-(--za-gutter) pb-[clamp(72px,9vw,140px)]">
      <ContactForm
        topics={topics}
        defaultTopic={defaultTopic}
        defaultMessage={product ? `I'd like to ask about ${product}` : ""}
      />
      <ContactDetailsCards contact={contact} />
    </section>
  );
}
