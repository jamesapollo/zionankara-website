import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-url";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin", "latin-ext"],
});


export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ankara Dresses & African Fashion in Kenya | Zionankara",
    template: "%s | Zionankara",
  },
  description:
    "Nairobi's Ankara clothing boutique: Ankara dresses, Ankara two piece sets and African inspired fashion in the best Ankara prints in Kenya. Shipped worldwide.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${jost.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
