import type { ContactDetails, SocialLinks } from "@/lib/erp/types";

const socialLabels: Record<keyof SocialLinks, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  facebook: "Facebook",
  x: "X",
  youtube: "YouTube",
};

const clean = (value: string | null | undefined) => value?.trim() || null;

/** Social links that are actually set, in a stable order. */
export function socialLinks(contact: ContactDetails | null): { label: string; href: string }[] {
  if (!contact) return [];
  return (Object.keys(socialLabels) as (keyof SocialLinks)[]).flatMap((key) => {
    const href = clean(contact.social_links?.[key]);
    return href ? [{ label: socialLabels[key], href }] : [];
  });
}

/** `tel:` href from an E.164 number, or null when unset. */
export function telHref(phone: string | null | undefined): string | null {
  const value = clean(phone);
  return value ? `tel:${value.replace(/\s+/g, "")}` : null;
}

/** `wa.me` link from an E.164 number (the `+` is stripped), or null when unset. */
export function whatsappHref(whatsapp: string | null | undefined): string | null {
  const digits = clean(whatsapp)?.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

export type WhatsAppOrder = {
  title: string;
  /** Lines such as "Size: UK 10"; empty ones are skipped. */
  details: string[];
  quantity: number;
  /** Already formatted, e.g. "KES 19,800". */
  price: string;
  url: string;
};

/** `wa.me` link that opens a chat with the store, pre-filled with the order (design: "Order on WhatsApp"). */
export function whatsappOrderHref(whatsapp: string | null | undefined, order: WhatsAppOrder): string | null {
  const base = whatsappHref(whatsapp);
  if (!base) return null;
  const text = [
    "Hello Zionankara, I'd like to order:",
    "",
    order.title,
    ...order.details.filter((d) => d.trim() !== ""),
    `Quantity: ${order.quantity}`,
    `Price: ${order.price}`,
    `Link: ${order.url}`,
    "",
    "Please let me know how to proceed.",
  ].join("\n");
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function mailHref(email: string | null | undefined): string | null {
  const value = clean(email);
  return value ? `mailto:${value}` : null;
}

/** "Nairobi, Kenya" from city and ISO country code; omits whichever is missing. */
export function locationLabel(contact: ContactDetails | null): string | null {
  if (!contact) return null;
  const code = clean(contact.country_code);
  let country: string | null = null;
  if (code) {
    try {
      country = new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code;
    } catch {
      country = code;
    }
  }
  return [clean(contact.city), country].filter(Boolean).join(", ") || null;
}
