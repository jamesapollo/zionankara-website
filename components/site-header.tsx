import Link from "next/link";
import { HeaderControls } from "./header-controls";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";

const navLinks = [
  { href: "/collections?sort=new", label: "New In" },
  { href: "/collections", label: "Collections" },
  { href: "/collections/two-piece-sets", label: "Two-Piece" },
  { href: "/#about", label: "About" },
];

const navText = "text-[clamp(11px,1.1vw,13px)] font-normal uppercase tracking-[clamp(0.06em,0.8vw,0.14em)] whitespace-nowrap";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/94 backdrop-blur-md">
      <div className="mx-auto grid max-w-site grid-cols-[1fr_auto_1fr] items-center gap-6 px-(--za-gutter) py-[18px]">
        <div className={navText}>
          <MobileMenu links={navLinks} />
          <nav aria-label="Main" className="hidden gap-[clamp(12px,2vw,28px)] overflow-x-auto md:flex">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} className="hover:text-accent">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <Link href="/" aria-label="Zionankara home">
          <Logo />
        </Link>
        <div className={`flex items-center justify-end gap-[clamp(12px,2vw,24px)] ${navText}`}>
          <HeaderControls />
        </div>
      </div>
    </header>
  );
}
