import Link from "next/link";
import { Logo } from "./logo";
import { NewsletterForm } from "./newsletter-form";

const columns = [
  {
    title: "Shop",
    links: [
      { href: "/collections?sort=new", label: "New in" },
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
  {
    title: "Follow",
    links: [
      { href: "https://instagram.com", label: "Instagram" },
      { href: "https://tiktok.com", label: "TikTok" },
      { href: "https://pinterest.com", label: "Pinterest" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-ink text-on-dark">
      <div className="mx-auto flex max-w-site flex-col gap-14 px-(--za-gutter) pt-[clamp(56px,6vw,80px)] pb-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex max-w-[400px] flex-col gap-5 sm:col-span-2">
            <Logo className="text-[34px] text-white" accentClassName="text-accent-soft" />
            <p className="text-body leading-[1.7]">Letters on new collections and private sales. Rarely, and beautifully.</p>
            <NewsletterForm />
          </div>
          {columns.map((column) => (
            <div key={column.title} className="flex flex-col gap-3.5 text-body">
              <span className="mb-1.5 text-label uppercase tracking-[0.22em] text-white">{column.title}</span>
              {column.links.map((link) => (
                <Link key={link.label} href={link.href} className="hover:text-accent-soft">
                  {link.label}
                </Link>
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
