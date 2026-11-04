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

const itemClass = "border-b border-[#F1F1F1] py-3.5 text-[13px] uppercase tracking-[0.18em] hover:text-accent";

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
        className="flex cursor-pointer items-center gap-2.5 text-[12px] uppercase tracking-[0.16em] hover:text-accent"
      >
        {isOpen ? (
          <span aria-hidden className="w-[22px] text-center font-display text-[26px] leading-none">
            ×
          </span>
        ) : (
          <svg width="22" height="11" viewBox="0 0 22 11" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
            <path d="M0 .5h22M0 5.5h22M0 10.5h22" />
          </svg>
        )}
        Menu
      </button>
      {isOpen && (
        <div id="mobile-menu" className="absolute inset-x-0 top-full max-h-[calc(100dvh-70px)] min-h-[60vh] overflow-y-auto border-t border-b border-line bg-white">
          <nav aria-label="Mobile" className="flex flex-col px-[clamp(20px,6vw,40px)] pt-2 pb-10">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={close}
                aria-current={link.href === "/" && pathname === "/" ? "page" : undefined}
                className={`${itemClass} ${link.href === "/" && pathname === "/" ? "text-accent" : ""}`}
              >
                {link.label}
              </Link>
            ))}
            {categories.length > 0 && (
              <>
                <span className="pt-7 pb-1.5 text-[11px] tracking-[0.28em] text-accent uppercase">Shop</span>
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
              <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-7 text-[12px] tracking-[0.16em] text-muted uppercase">
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
