// Sample catalogue from the Claude Design "Zionankara Fashion Homepage" project.
// Prices are stored in KES and converted for display (see lib/currency.ts).

export type Product = {
  slug: string;
  name: string;
  category: string;
  note: string;
  description: string;
  priceKes: number;
  wasKes?: number;
  image: string;
};

export type Category = {
  slug: string;
  name: string;
  image: string;
};

export const categories: Category[] = [
  { slug: "gowns", name: "Gowns", image: "/images/products/lace-mermaid-gown.jpg" },
  { slug: "midi-dresses", name: "Midi Dresses", image: "/images/products/floral-panel-dress.jpg" },
  { slug: "two-piece-sets", name: "Two-Piece Sets", image: "/images/products/blush-skirt-set.jpg" },
  { slug: "kimonos", name: "Kimonos", image: "/images/products/indigo-wrap-kaftan.jpg" },
  { slug: "skirts", name: "Skirts", image: "/images/products/earth-print-mermaid-gown.jpg" },
  { slug: "tops", name: "Tops", image: "/images/products/violet-leaf-blouse.jpg" },
  { slug: "headwraps", name: "Headwraps", image: "/images/products/cobalt-leaf-gown.jpg" },
  { slug: "fabrics", name: "Fabrics", image: "/images/editorial/fabric-market.jpg" },
];

export const products: Product[] = [
  {
    slug: "adunni-gown",
    name: "The Adúnní Gown",
    category: "Gown",
    note: "Indigo & ochre wax print, floor length",
    description: "A floor-length gown cut from a single bolt of indigo and ochre wax print.",
    priceKes: 18500,
    image: "/images/products/olive-swirl-gown.jpg",
  },
  {
    slug: "ife-wrap-dress",
    name: "Ìfẹ́ Wrap Dress",
    category: "Midi Dress",
    note: "Terracotta geometric",
    description: "A fitted wrap dress in a warm terracotta geometric print.",
    priceKes: 9800,
    image: "/images/products/sunburst-bustier-dress.jpg",
  },
  {
    slug: "omo-puff-midi",
    name: "Ọmọ Puff Midi",
    category: "Midi Dress",
    note: "Sage & cream",
    description: "A puff-sleeve midi with a gathered waist and soft A-line skirt.",
    priceKes: 8900,
    image: "/images/products/blush-skirt-set.jpg",
  },
  {
    slug: "ewa-kimono-set",
    name: "Ẹwà Kimono Set",
    category: "Two-Piece",
    note: "Two-piece, midnight print",
    description: "A relaxed kimono and matching trouser in a deep midnight print.",
    priceKes: 14500,
    image: "/images/products/forest-boubou.jpg",
  },
  {
    slug: "yetunde-pleated-gown",
    name: "Yetúndé Pleated Gown",
    category: "Gown",
    note: "Heritage indigo",
    description: "Softly pleated bodice with a sweeping skirt in heritage indigo.",
    priceKes: 16800,
    image: "/images/products/cobalt-leaf-gown.jpg",
  },
  {
    slug: "asa-peplum-set",
    name: "Àṣà Peplum Set",
    category: "Two-Piece",
    note: "Office to evening",
    description: "Structured peplum top and tapered trouser — office to evening.",
    priceKes: 9900,
    wasKes: 12500,
    image: "/images/products/royal-corset-dress.jpg",
  },
  {
    slug: "morenike-shirt-dress",
    name: "Morẹ́nikẹ́ Shirt Dress",
    category: "Midi Dress",
    note: "Self-tie belt, hidden pockets",
    description: "Relaxed shirt dress with a self-tie belt and hidden pockets.",
    priceKes: 9200,
    image: "/images/products/indigo-wrap-kaftan.jpg",
  },
  {
    slug: "osun-long-kimono",
    name: "Ọ̀ṣun Long Kimono",
    category: "Kimono",
    note: "Marigold print, voile lined",
    description: "Lightweight duster in marigold print, lined in cotton voile.",
    priceKes: 8400,
    image: "/images/products/violet-leaf-blouse.jpg",
  },
  {
    slug: "bisi-wrap-skirt",
    name: "Bísí Wrap Skirt",
    category: "Skirt",
    note: "Adjustable wrap",
    description: "Adjustable wrap skirt that flatters every figure and age.",
    priceKes: 4900,
    wasKes: 6500,
    image: "/images/products/earth-print-mermaid-gown.jpg",
  },
  {
    slug: "ayo-off-shoulder-gown",
    name: "Ayọ̀ Off-Shoulder Gown",
    category: "Gown",
    note: "Fitted waist, soft flare",
    description: "Off-shoulder neckline with a fitted waist and soft flare.",
    priceKes: 19800,
    image: "/images/products/swirl-bell-sleeve-dress.jpg",
  },
];

const bySlug = (slugs: string[]) =>
  slugs.map((slug) => {
    const product = products.find((p) => p.slug === slug);
    if (!product) throw new Error(`Unknown product: ${slug}`);
    return product;
  });

export const newArrivals = bySlug(["adunni-gown", "ife-wrap-dress", "omo-puff-midi", "ewa-kimono-set"]);

export const signaturePieces = bySlug([
  "yetunde-pleated-gown",
  "asa-peplum-set",
  "morenike-shirt-dress",
  "osun-long-kimono",
  "bisi-wrap-skirt",
  "ayo-off-shoulder-gown",
]);
