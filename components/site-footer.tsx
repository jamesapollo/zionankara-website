import Link from "next/link";
import { Suspense } from "react";
import { mailHref, socialLinks, telHref, whatsappHref } from "@/lib/contact";
import { catalogueSource } from "@/lib/catalogue-source";
import { getCategoryRowItems, getContactOrNull, type CategoryRowItem } from "@/lib/erp/header-data";
import type { ContactDetails } from "@/lib/erp/types";
import { Logo } from "./logo";
import { NewsletterForm } from "./newsletter-form";

const columns = [
  {
    title: "Shop",
    links: [
      { href: "/collections/new-in", label: "New in" },
      { href: "/collections/gowns", label: "Dresses" },
      { href: "/collections/two-piece-sets", label: "Two-piece sets" },
      { href: "/collections/fabrics", label: "Fabrics" },
    ],
  },
  {
    title: "Client care",
    links: [
      { href: "/size-guide", label: "Size guide" },
      { href: "/shipping-returns", label: "Shipping & returns" },
      { href: "/made-to-measure", label: "Made to measure" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

type FooterLink = { href: string; label: string; external?: boolean };

/** Client care and Follow columns; ERP contact fields are appended only when set. */
function footerColumns(contact: ContactDetails | null, categoryItems: CategoryRowItem[]) {
  const phone = contact?.phone?.trim();
  const email = contact?.email?.trim();
  const contactLinks: FooterLink[] = [
    ...(telHref(phone) ? [{ href: telHref(phone)!, label: phone!, external: true }] : []),
    ...(whatsappHref(contact?.whatsapp) ? [{ href: whatsappHref(contact?.whatsapp)!, label: "WhatsApp", external: true }] : []),
    ...(mailHref(email) ? [{ href: mailHref(email)!, label: email!, external: true }] : []),
  ];
  const follow: FooterLink[] = socialLinks(contact).map((s) => ({ ...s, external: true }));
  const [localShop, care] = columns;
  // Under erp the local slugs do not exist: SHOP links mirror the header category row.
  const shop =
    catalogueSource() === "erp"
      ? { title: "Shop", links: categoryItems.length > 0 ? categoryItems : [{ href: "/collections", label: "Collections" }] }
      : localShop;
  return [
    shop,
    { ...care, links: [...care.links, ...contactLinks] },
    ...(follow.length > 0 ? [{ title: "Follow", links: follow }] : []),
  ] as { title: string; links: FooterLink[] }[];
}

async function LoadedFooter() {
  const [contact, categoryItems] = await Promise.all([getContactOrNull(), getCategoryRowItems()]);
  return <FooterMarkup contact={contact} categoryItems={categoryItems} />;
}

export function SiteFooter() {
  return (
    <Suspense fallback={<FooterMarkup contact={null} categoryItems={[]} />}>
      <LoadedFooter />
    </Suspense>
  );
}

function FooterMarkup({ contact, categoryItems }: { contact: ContactDetails | null; categoryItems: CategoryRowItem[] }) {
  return (
    <footer className="bg-ink text-on-dark">
      <div className="mx-auto flex max-w-site flex-col gap-14 px-(--za-gutter) pt-[clamp(56px,6vw,80px)] pb-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex max-w-[400px] flex-col gap-5 sm:col-span-2">
            <Logo className="text-[34px] text-white" accentClassName="text-accent-soft" />
            <p className="text-body leading-[1.7]">Letters on new collections and private sales. Rarely, and beautifully.</p>
            <NewsletterForm />
          </div>
          {footerColumns(contact, categoryItems).map((column) => (
            <div key={column.title} className="flex flex-col gap-3.5 text-body">
              <span className="mb-1.5 text-label uppercase tracking-[0.22em] text-white">{column.title}</span>
              {column.links.map((link) => (
                link.external ? (
                  <a key={link.label} href={link.href} {...(link.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="hover:text-accent-soft">
                    {link.label}
                  </a>
                ) : (
                  <Link key={link.label} href={link.href} className="hover:text-accent-soft">
                    {link.label}
                  </Link>
                )
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-between gap-4 border-t border-[#2a2a2a] pt-7 text-small text-subtle">
          <span>© 2026 Zionankara. All rights reserved.</span>
          <span>Worldwide shipping · Privacy · Terms</span>
        </div>
      </div>
    </footer>
  );
}
