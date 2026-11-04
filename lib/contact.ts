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
