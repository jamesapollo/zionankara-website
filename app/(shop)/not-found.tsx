import type { Metadata } from "next";
import { NotFoundContent } from "@/components/not-found-content";

export const metadata: Metadata = { title: "Page not found" };

/** Shown (inside the shop header and footer) when a shop page calls notFound(). */
export default function ShopNotFound() {
  return <NotFoundContent />;
}
