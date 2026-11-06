import type { Metadata } from "next";
import { BagView } from "@/components/bag-view";
import { ErpBagView } from "@/components/erp-bag-view";
import { catalogueSource } from "@/lib/catalogue-source";

export const metadata: Metadata = {
  title: "Your Bag",
  robots: { index: false },
};

export default function BagPage() {
  if (catalogueSource() === "erp") return <ErpBagView />;
  return <BagView />;
}
