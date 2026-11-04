"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CurrencySelect } from "./header-controls";

type MobileMenuProps = {
  links: { href: string; label: string }[];
  categories: { href: string; label: string; accent?: boolean }[];
  socials: { label: string; href: string }[];
};

const itemClass = "border-b border-line py-4 hover:text-accent";

export function MobileMenu({ links, categories, socials }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const pathname = usePathname();
  // Close automatically after navigating to another page.
  const isOpen = open && openedAt === pathname;
  const close = () => setOpen(false);

  return (
    <div className="nav:hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        onClick={() => {
          setOpen(!isOpen);
          setOpenedAt(pathname);
        }}
        className="flex cursor-pointer items-center gap-2.5 uppercase hover:text-accent"
      >
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
          {isOpen ? <path d="M2 1l14 12M16 1L2 13" /> : <path d="M0 1h18M0 7h18M0 13h18" />}
        </svg>
        Menu
      </button>
      {isOpen && (
        <div id="mobile-menu" className="absolute inset-x-0 top-full max-h-[80dvh] overflow-y-auto border-b border-line bg-white">
          <nav aria-label="Mobile" className="flex flex-col px-(--za-gutter) py-2">
            {links.map((link) => (
              <Link key={link.label} href={link.href} onClick={close} className={itemClass}>
                {link.label}
              </Link>
            ))}
            {categories.length > 0 && (
              <>
                <span className="pt-5 pb-1 text-label tracking-[0.22em] text-muted uppercase">Shop</span>
                {categories.map((item) => (
                  <Link key={item.href} href={item.href} onClick={close} className={`${itemClass} ${item.accent ? "text-accent" : ""}`}>
                    {item.label}
                  </Link>
                ))}
              </>
            )}
            <Link href="/search" onClick={close} className={itemClass}>
              Search
            </Link>
            <div className="flex items-center justify-between py-4">
              <span>Currency</span>
              <CurrencySelect />
            </div>
            {socials.length > 0 && (
              <ul className="flex flex-wrap gap-x-5 gap-y-2 border-t border-line py-4 text-small text-muted">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
