import type { Metadata } from "next";
import { BagView } from "@/components/bag-view";
import { OrderingPaused } from "@/components/ordering-paused";
import { catalogueSource } from "@/lib/catalogue-source";

export const metadata: Metadata = {
  title: "Your Bag",
  robots: { index: false },
};

export default function BagPage() {
  if (catalogueSource() === "erp") return <OrderingPaused trail={[{ label: "Home", href: "/" }, { label: "Bag" }]} />;
  return <BagView />;
}
