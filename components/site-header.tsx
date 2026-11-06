import Link from "next/link";
import { Suspense } from "react";
import { catalogueSource } from "@/lib/catalogue-source";
import { fallbackCategoryRow, getCategoryRowItems, getContactOrNull, type CategoryRowItem } from "@/lib/erp/header-data";
import { erpConfigured } from "@/lib/erp/client";
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

/** Placeholder heights so the streamed strip and row do not shift the page. */
function HeaderMarkup({
  contact,
  categories,
  reserve,
}: {
  contact: ContactDetails | null;
  categories: CategoryRowItem[];
  reserve?: { strip: boolean; categoryRow: boolean };
}) {
  // Search lives on the ERP collections page; the local catalogue has no search.
  const searchHref = catalogueSource() === "erp" ? "/collections" : undefined;
  return (
    <>
      {reserve ? reserve.strip && <div aria-hidden className="h-9 bg-accent" /> : <InfoStrip contact={contact} />}
      <header className="sticky top-0 z-20 border-b border-line bg-white/94 backdrop-blur-md">
        <div className="mx-auto grid max-w-site grid-cols-[1fr_auto_1fr] items-center gap-6 px-(--za-gutter) py-[18px]">
          <div className={navText}>
            <MobileMenu links={mainLinks} categories={categories} socials={socialLinks(contact)} searchHref={searchHref} />
            <NavLinks />
          </div>
          <Link href="/" aria-label="Zionankara home">
            <Logo />
          </Link>
          <div className={`flex items-center justify-end gap-[clamp(12px,2vw,24px)] ${navText}`}>
            <HeaderControls searchHref={searchHref} erp={catalogueSource() === "erp"} />
          </div>
        </div>
        {reserve?.categoryRow && categories.length === 0 ? <div aria-hidden className="h-[65px] border-t border-[#F1F1F1] max-nav:hidden" /> : <CategoryRow items={categories} />}
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
    <Suspense fallback={<HeaderMarkup contact={null} categories={fallbackCategoryRow()} reserve={{ strip: erpConfigured(), categoryRow: catalogueSource() === "erp" }} />}>
      <LoadedHeader />
    </Suspense>
  );
}
