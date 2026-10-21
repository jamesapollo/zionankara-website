import Link from "next/link";
import { AnnouncementBar } from "@/components/announcement-bar";
import { CurrencySelect } from "@/components/header-controls";
import { Logo } from "@/components/logo";

// Checkout drops the shop navigation so the only ways out are back to the bag or home.
export default function CheckoutLayout({ children }: LayoutProps<"/checkout">) {
  return (
    <>
      <AnnouncementBar />
      <header className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-site grid-cols-[1fr_auto_1fr] items-center gap-6 px-(--za-gutter) py-[18px]">
          <Link href="/bag" className="text-[clamp(11px,1.1vw,13px)] font-normal uppercase tracking-[0.16em] whitespace-nowrap hover:text-accent">
            ← <span className="hidden sm:inline">Back to </span>bag
          </Link>
          <Link href="/" aria-label="Zionankara home">
            <Logo />
          </Link>
          <div className="flex justify-end">
            <CurrencySelect />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-site flex-wrap justify-between gap-4 px-(--za-gutter) py-7 text-small text-muted">
          <span>© 2026 Zionankara</span>
          <span className="flex gap-5">
            <Link href="/shipping-returns" className="hover:text-accent">
              Shipping &amp; returns
            </Link>
            <Link href="/privacy" className="hover:text-accent">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-accent">
              Terms
            </Link>
          </span>
        </div>
      </footer>
    </>
  );
}
