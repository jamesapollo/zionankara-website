"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CurrencySelect } from "./header-controls";

type MobileMenuProps = { links: { href: string; label: string }[] };

export function MobileMenu({ links }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const pathname = usePathname();
  // Close automatically after navigating to another page.
  const isOpen = open && openedAt === pathname;

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        onClick={() => {
          setOpen(!isOpen);
          setOpenedAt(pathname);
        }}
        className="cursor-pointer uppercase hover:text-accent"
      >
        {isOpen ? "Close" : "Menu"}
      </button>
      {isOpen && (
        <div id="mobile-menu" className="absolute inset-x-0 top-full border-b border-line bg-white">
          <nav aria-label="Mobile" className="flex flex-col px-(--za-gutter) py-2">
            {[...links, { href: "/search", label: "Search" }].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-4 hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center justify-between py-4">
              <span>Currency</span>
              <CurrencySelect />
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
