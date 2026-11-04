import Link from "next/link";
import { Suspense } from "react";
import { fallbackCategoryRow, getCategoryRowItems, getContactOrNull, type CategoryRowItem } from "@/lib/erp/header-data";
import type { ContactDetails } from "@/lib/erp/types";
import { mainLinks } from "@/lib/navigation";
import { CategoryRow } from "./category-row";
import { HeaderControls } from "./header-controls";
import { InfoStrip } from "./info-strip";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";
import { socialLinks } from "@/lib/contact";

const navText = "text-[clamp(11px,1.1vw,13px)] font-normal uppercase tracking-[clamp(0.06em,0.8vw,0.14em)] whitespace-nowrap";

function HeaderMarkup({ contact, categories }: { contact: ContactDetails | null; categories: CategoryRowItem[] }) {
  return (
    <>
      <InfoStrip contact={contact} />
      <header className="sticky top-0 z-20 border-b border-line bg-white/94 backdrop-blur-md">
        <div className="mx-auto grid max-w-site grid-cols-[1fr_auto_1fr] items-center gap-6 px-(--za-gutter) py-[18px]">
          <div className={navText}>
            <MobileMenu links={mainLinks} categories={categories} socials={socialLinks(contact)} />
            <NavLinks />
          </div>
          <Link href="/" aria-label="Zionankara home">
            <Logo />
          </Link>
          <div className={`flex items-center justify-end gap-[clamp(12px,2vw,24px)] ${navText}`}>
            <HeaderControls />
          </div>
        </div>
        <CategoryRow items={categories} />
      </header>
    </>
  );
}

async function LoadedHeader() {
  const [contact, categories] = await Promise.all([getContactOrNull(), getCategoryRowItems()]);
  return <HeaderMarkup contact={contact} categories={categories} />;
}

/** The ERP-fed parts stream in; the shell (main row, local category row) prerenders. */
export function SiteHeader() {
  return (
    <Suspense fallback={<HeaderMarkup contact={null} categories={fallbackCategoryRow()} />}>
      <LoadedHeader />
    </Suspense>
  );
}
