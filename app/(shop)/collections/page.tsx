import type { Metadata } from "next";
import { CollectionPage } from "@/components/collection-page";

export const metadata: Metadata = {
  title: "Shop Ankara Collections",
  description:
    "Browse Zionankara's Ankara dresses, gowns, two-piece sets, kimonos and African print clothing. Filter by size, colour, occasion and price.",
};

export default function CollectionsPage() {
  return (
    <CollectionPage
      title={
        <>
          Ankara <em className="text-accent">collections</em>
        </>
      }
    />
  );
}
