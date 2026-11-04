import type { CategoryKind, CategoryLink, Price } from "@/lib/erp/types";

/** One product card, whichever source it came from. */
export type CardProduct = {
  slug: string;
  name: string;
  image: { url: string; alt: string; width: number; height: number } | null;
  price: Price;
  isNew: boolean;
  /** Short line under the name (local sample data only). */
  note?: string;
};

export type CollectionSectionView = { slug: string; name: string; kind: CategoryKind; products: CardProduct[] };

export type CollectionsView = {
  sections: CollectionSectionView[];
  /** Set when `?q=` asked for a search: a flat result list instead of sections. */
  search: { q: string; products: CardProduct[]; total: number; page: number; pageCount: number } | null;
};

export type FilterView = {
  name: string;
  values: { id: number; value: string; product_count: number }[];
};

export type CategoryView = {
  category: {
    slug: string;
    name: string;
    kind: CategoryKind;
    description: string | null;
    parent: CategoryLink | null;
    children: CategoryLink[];
  };
  products: CardProduct[];
  total: number;
  page: number;
  pageCount: number;
  filters: FilterView[];
  priceRange: { min: number; max: number; currency: string } | null;
};
