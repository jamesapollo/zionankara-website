import type { Metadata } from "next";
import { BagView } from "@/components/bag-view";

export const metadata: Metadata = {
  title: "Your Bag",
  robots: { index: false },
};

export default function BagPage() {
  return <BagView />;
}
