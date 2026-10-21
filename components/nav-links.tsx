"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "@/lib/navigation";

/** Desktop nav; the most specific matching link is highlighted. */
export function NavLinks() {
  const pathname = usePathname();
  const active = navLinks
    .filter((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <nav aria-label="Main" className="hidden gap-[clamp(12px,2vw,28px)] overflow-x-auto md:flex">
      {navLinks.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          aria-current={link === active ? "page" : undefined}
          className={link === active ? "text-accent" : "hover:text-accent"}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
