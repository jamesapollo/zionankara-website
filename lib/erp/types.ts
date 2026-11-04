/** Types mirroring the ERP storefront OpenAPI resources (docs/api/openapi.yaml). */

export type Money = { amount: string; currency: string };

export type Price = {
  original: Money;
  current: Money;
  saving: Money | null;
  on_offer: boolean;
  offer_ends_at: string | null;
};

export type CategoryKind = "standard" | "new_in" | "on_sale";

export type SocialLinks = {
  instagram: string | null;
  tiktok: string | null;
  pinterest: string | null;
  facebook: string | null;
  x: string | null;
  youtube: string | null;
};

export type ContactDetails = {
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address_line: string | null;
  city: string | null;
  country_code: string | null;
  opening_hours: string | null;
  visit_note: string | null;
  social_links: SocialLinks;
  enquiry_topics: string[];
};

export type ErpStore = {
  name: string;
  slug: string;
  currency: string;
  timezone: string;
  primary_domain: string | null;
  allow_backorders: boolean;
  contact: ContactDetails;
};

export type NavItem = { slug: string; name: string; kind: CategoryKind };

export type CategoryNode = NavItem & { children: CategoryNode[] };

export type CategoryLink = { slug: string; name: string };

export type CategoryDetail = NavItem & {
  description: string | null;
  seo_title: string | null;
  meta_description: string | null;
  parent: CategoryLink | null;
  children: CategoryLink[];
  updated_at: string;
};

export type MainImage = {
  url: string;
  alt_text: string | null;
  width: number;
  height: number;
};

export type ProductImage = MainImage & { is_main: boolean; option_value_ids: number[] };

export type ProductListItem = {
  slug: string;
  title: string;
  short_description: string | null;
  is_featured: boolean;
  main_image: MainImage | null;
  price: Price;
  price_varies: boolean;
  in_stock: boolean;
  published_at: string | null;
  updated_at: string;
};

export type Variant = {
  sku: string;
  price: Price;
  option_value_ids: number[];
  in_stock: boolean;
};

export type ProductDetail = {
  slug: string;
  title: string;
  short_description: string | null;
  description: string | null;
  seo_title: string | null;
  meta_description: string | null;
  is_featured: boolean;
  price: Price;
  price_varies: boolean;
  in_stock: boolean;
  published_at: string | null;
  updated_at: string;
  categories: CategoryLink[];
  option_types: { name: string; values: { id: number; value: string }[] }[];
  image_option_type: string | null;
  variants: Variant[];
  images: ProductImage[];
};

export type ProductFilter = {
  name: string;
  values: { id: number; value: string; product_count: number }[];
};

export type ProductFilters = {
  data: ProductFilter[];
  price_range: { min: Money; max: Money } | null;
};

export type Paginated<T> = {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
};

/** Body returned (with HTTP 200) when a slug has been renamed. */
export type ErpRedirect = { redirect: { slug: string; status: 301 } };
