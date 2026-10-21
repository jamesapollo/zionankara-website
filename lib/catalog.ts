// Sample catalogue from the Claude Design "Zionankara Fashion Homepage" project.
// Prices are stored in KES and converted for display (see lib/currency.ts).

export const sizes = ["6", "8", "10", "12", "14", "16", "18", "20", "22"] as const;

export const printColours = [
  { id: "indigo", label: "Indigo", hex: "#2e3a6b" },
  { id: "ochre", label: "Ochre", hex: "#c98b2b" },
  { id: "terracotta", label: "Terracotta", hex: "#b5523a" },
  { id: "emerald", label: "Emerald", hex: "#2f6b4f" },
  { id: "blush", label: "Blush", hex: "#e2b6bd" },
  { id: "mono", label: "Black & white", hex: "#111111" },
] as const;
export type PrintColour = (typeof printColours)[number]["id"];

export const occasions = ["Everyday", "Work", "Wedding guest", "Evening", "Owambe"] as const;
export type Occasion = (typeof occasions)[number];

export type Category = {
  slug: string;
  name: string;
  /** Singular label used on product pages, e.g. "Two-Piece Set". */
  singular: string;
  image: string;
};

export const categories: Category[] = [
  { slug: "gowns", name: "Gowns", singular: "Gown", image: "/images/products/lace-mermaid-gown.jpg" },
  { slug: "midi-dresses", name: "Midi Dresses", singular: "Midi Dress", image: "/images/products/floral-panel-dress.jpg" },
  { slug: "two-piece-sets", name: "Two-Piece Sets", singular: "Two-Piece Set", image: "/images/products/blush-skirt-set.jpg" },
  { slug: "kimonos", name: "Kimonos", singular: "Kimono", image: "/images/products/indigo-wrap-kaftan.jpg" },
  { slug: "skirts", name: "Skirts", singular: "Skirt", image: "/images/products/earth-print-mermaid-gown.jpg" },
  { slug: "tops", name: "Tops", singular: "Top", image: "/images/products/violet-leaf-blouse.jpg" },
  { slug: "headwraps", name: "Headwraps", singular: "Headwrap", image: "/images/products/cobalt-leaf-gown.jpg" },
  { slug: "fabrics", name: "Fabrics", singular: "Fabric", image: "/images/editorial/fabric-market.jpg" },
];

export type Product = {
  slug: string;
  name: string;
  categorySlug: string;
  note: string;
  description: string;
  priceKes: number;
  wasKes?: number;
  image: string;
  colour: PrintColour;
  occasion: Occasion;
  /** UK sizes in stock. */
  sizes: string[];
  isNew?: boolean;
  /** Print names offered on the product page; the first is the one photographed. */
  prints: { label: string; colour: PrintColour }[];
};

/** Every size except a rotating gap, so the size filter has something to do in the sample data. */
const sizesExcept = (...missing: string[]) => sizes.filter((size) => !missing.includes(size));

export const products: Product[] = [
  {
    slug: "adunni-gown",
    name: "The Adúnní Gown",
    categorySlug: "gowns",
    note: "Indigo & ochre wax print, floor length",
    description:
      "A floor-length gown cut from a single bolt of indigo and ochre wax print, with fluted sleeves and a softly fitted bodice that skims to the hem.",
    priceKes: 18500,
    image: "/images/products/olive-swirl-gown.jpg",
    colour: "indigo",
    occasion: "Wedding guest",
    sizes: sizesExcept("6", "22"),
    isNew: true,
    prints: [
      { label: "Indigo & ochre", colour: "indigo" },
      { label: "Emerald swirl", colour: "emerald" },
    ],
  },
  {
    slug: "ife-wrap-dress",
    name: "Ìfẹ́ Wrap Dress",
    categorySlug: "midi-dresses",
    note: "Terracotta geometric",
    description:
      "A body-skimming wrap dress in a warm terracotta geometric print, with a sweetheart neckline and an adjustable tie at the waist.",
    priceKes: 9800,
    image: "/images/products/sunburst-bustier-dress.jpg",
    colour: "terracotta",
    occasion: "Evening",
    sizes: sizesExcept("8", "20"),
    isNew: true,
    prints: [
      { label: "Terracotta sun", colour: "terracotta" },
      { label: "Ochre bloom", colour: "ochre" },
    ],
  },
  {
    slug: "omo-puff-midi",
    name: "Ọmọ Puff Midi",
    categorySlug: "midi-dresses",
    note: "Sage & cream",
    description:
      "A puff-sleeve midi with a gathered waist and soft A-line skirt — easy to wear from a garden lunch to a Sunday service.",
    priceKes: 8900,
    image: "/images/products/blush-skirt-set.jpg",
    colour: "blush",
    occasion: "Everyday",
    sizes: sizesExcept("10"),
    isNew: true,
    prints: [
      { label: "Blush leaf", colour: "blush" },
      { label: "Indigo fan", colour: "indigo" },
    ],
  },
  {
    slug: "ewa-kimono-set",
    name: "Ẹwà Kimono Set",
    categorySlug: "two-piece-sets",
    note: "Two-piece, midnight print",
    description:
      "A relaxed kimono and matching wide trouser in a deep midnight print, finished with a contrast wax-print sash.",
    priceKes: 14500,
    image: "/images/products/forest-boubou.jpg",
    colour: "emerald",
    occasion: "Owambe",
    sizes: sizesExcept("6", "8"),
    isNew: true,
    prints: [
      { label: "Midnight emerald", colour: "emerald" },
      { label: "Black & white", colour: "mono" },
    ],
  },
  {
    slug: "yetunde-pleated-gown",
    name: "Yetúndé Pleated Gown",
    categorySlug: "gowns",
    note: "Heritage indigo",
    description:
      "Softly pleated bodice with a sweeping skirt in heritage indigo, fully lined in cotton voile with an invisible back zip.",
    priceKes: 16800,
    image: "/images/products/cobalt-leaf-gown.jpg",
    colour: "indigo",
    occasion: "Wedding guest",
    sizes: sizesExcept("22"),
    prints: [
      { label: "Indigo leaf", colour: "indigo" },
      { label: "Emerald leaf", colour: "emerald" },
      { label: "Ochre bloom", colour: "ochre" },
    ],
  },
  {
    slug: "asa-peplum-set",
    name: "Àṣà Peplum Set",
    categorySlug: "two-piece-sets",
    note: "Office to evening",
    description:
      "A structured peplum top with a softly flared hem, paired with a high-waisted tapered trouser. Cut from authentic wax-print cotton and fully lined — polished enough for the office, easy enough for Sunday lunch.",
    priceKes: 9900,
    wasKes: 12500,
    image: "/images/products/royal-corset-dress.jpg",
    colour: "terracotta",
    occasion: "Work",
    sizes: sizesExcept("20"),
    prints: [
      { label: "Terracotta sun", colour: "terracotta" },
      { label: "Indigo fan", colour: "indigo" },
      { label: "Ochre bloom", colour: "ochre" },
      { label: "Emerald leaf", colour: "emerald" },
    ],
  },
  {
    slug: "morenike-shirt-dress",
    name: "Morẹ́nikẹ́ Shirt Dress",
    categorySlug: "midi-dresses",
    note: "Self-tie belt, hidden pockets",
    description: "Relaxed shirt dress with a self-tie belt, hidden pockets and generous batwing sleeves.",
    priceKes: 9200,
    image: "/images/products/indigo-wrap-kaftan.jpg",
    colour: "indigo",
    occasion: "Everyday",
    sizes: sizesExcept("6", "18"),
    prints: [
      { label: "Indigo fan", colour: "indigo" },
      { label: "Terracotta sun", colour: "terracotta" },
    ],
  },
  {
    slug: "osun-long-kimono",
    name: "Ọ̀ṣun Long Kimono",
    categorySlug: "kimonos",
    note: "Marigold print, voile lined",
    description: "Lightweight duster in a marigold leaf print, lined in cotton voile — throw it over denim or a slip dress.",
    priceKes: 8400,
    image: "/images/products/violet-leaf-blouse.jpg",
    colour: "ochre",
    occasion: "Everyday",
    sizes: sizesExcept("14"),
    prints: [
      { label: "Marigold leaf", colour: "ochre" },
      { label: "Blush leaf", colour: "blush" },
    ],
  },
  {
    slug: "bisi-wrap-skirt",
    name: "Bísí Wrap Skirt",
    categorySlug: "skirts",
    note: "Adjustable wrap",
    description: "Adjustable wrap skirt in an earth-toned mudcloth-inspired print that flatters every figure and age.",
    priceKes: 4900,
    wasKes: 6500,
    image: "/images/products/earth-print-mermaid-gown.jpg",
    colour: "ochre",
    occasion: "Everyday",
    sizes: [...sizes],
    prints: [
      { label: "Ochre bloom", colour: "ochre" },
      { label: "Black & white", colour: "mono" },
    ],
  },
  {
    slug: "ayo-off-shoulder-gown",
    name: "Ayọ̀ Off-Shoulder Gown",
    categorySlug: "gowns",
    note: "Fitted waist, soft flare",
    description: "Off-shoulder neckline with a fitted waist, bell sleeves and a soft flare to the floor.",
    priceKes: 19800,
    image: "/images/products/swirl-bell-sleeve-dress.jpg",
    colour: "indigo",
    occasion: "Evening",
    sizes: sizesExcept("6", "8", "22"),
    prints: [
      { label: "Ocean swirl", colour: "indigo" },
      { label: "Terracotta swirl", colour: "terracotta" },
    ],
  },
  {
    slug: "funke-lace-gown",
    name: "Fúnkẹ́ Lace Gown",
    categorySlug: "gowns",
    note: "Lace bodice, mermaid hem",
    description: "A sheer lace bodice and long sleeves above a fitted wax-print skirt that flares into a mermaid hem.",
    priceKes: 21500,
    image: "/images/products/lace-mermaid-gown.jpg",
    colour: "mono",
    occasion: "Evening",
    sizes: sizesExcept("20", "22"),
    prints: [
      { label: "Midnight lace", colour: "mono" },
      { label: "Ochre lace", colour: "ochre" },
    ],
  },
  {
    slug: "kemi-floral-midi",
    name: "Kẹ́mi Floral Midi",
    categorySlug: "midi-dresses",
    note: "Emerald bloom, lace sleeve",
    description: "A tailored midi in an emerald and coral bloom print, with sheer lace sleeves and a back vent.",
    priceKes: 10400,
    wasKes: 12900,
    image: "/images/products/floral-panel-dress.jpg",
    colour: "emerald",
    occasion: "Work",
    sizes: sizesExcept("12"),
    prints: [
      { label: "Emerald bloom", colour: "emerald" },
      { label: "Indigo bloom", colour: "indigo" },
    ],
  },
  {
    slug: "tolu-veil-maxi",
    name: "Tòlú Veil Maxi",
    categorySlug: "gowns",
    note: "With sheer tulle veil",
    description: "A floor-length maxi with a scalloped neckline and beaded waist, styled with a sheer tulle veil.",
    priceKes: 17200,
    image: "/images/products/veiled-maxi-dress.jpg",
    colour: "terracotta",
    occasion: "Owambe",
    sizes: sizesExcept("6", "16"),
    isNew: true,
    prints: [
      { label: "Terracotta garden", colour: "terracotta" },
      { label: "Blush garden", colour: "blush" },
    ],
  },
  {
    slug: "sade-leaf-blouse",
    name: "Ṣadé Leaf Blouse",
    categorySlug: "tops",
    note: "Scalloped neckline",
    description: "A fitted blouse with a scalloped leaf neckline and three-quarter sleeves — pair it with denim or a wrap skirt.",
    priceKes: 5600,
    image: "/images/products/violet-leaf-blouse.jpg",
    colour: "blush",
    occasion: "Work",
    sizes: sizesExcept("22"),
    prints: [
      { label: "Violet leaf", colour: "blush" },
      { label: "Marigold leaf", colour: "ochre" },
    ],
  },
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}

const bySlug = (slugs: string[]) =>
  slugs.map((slug) => {
    const product = getProduct(slug);
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

/** Other pieces to suggest alongside the given ones, preferring the same categories. */
export function recommendationsFor(slugs: string[], count = 4) {
  const chosen = slugs.map(getProduct).filter((p): p is Product => !!p);
  const chosenCategories = new Set(chosen.map((p) => p.categorySlug));
  return products
    .filter((p) => !slugs.includes(p.slug))
    .sort((a, b) => Number(chosenCategories.has(b.categorySlug)) - Number(chosenCategories.has(a.categorySlug)))
    .slice(0, count);
}
