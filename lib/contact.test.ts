import { describe, expect, it } from "vitest";
import { locationLabel, mailHref, socialLinks, telHref, whatsappHref } from "./contact";
import type { ContactDetails } from "./erp/types";

const base: ContactDetails = {
  email: null, phone: null, whatsapp: null, address_line: null, city: null, country_code: null,
  opening_hours: null, visit_note: null, enquiry_topics: [],
  social_links: { instagram: null, tiktok: null, pinterest: null, facebook: null, x: null, youtube: null },
};
const withContact = (over: Partial<ContactDetails>): ContactDetails => ({ ...base, ...over });

describe("telHref", () => {
  it("strips whitespace", () => expect(telHref(" +254 700 000 000 ")).toBe("tel:+254700000000"));
  it("is null for empty, blank or missing", () => {
    expect(telHref("")).toBeNull();
    expect(telHref("   ")).toBeNull();
    expect(telHref(null)).toBeNull();
  });
});

describe("whatsappHref", () => {
  it("strips the + and non-digits", () => expect(whatsappHref("+254 700-000 000")).toBe("https://wa.me/254700000000"));
  it("is null when unset or without digits", () => {
    expect(whatsappHref(null)).toBeNull();
    expect(whatsappHref("")).toBeNull();
    expect(whatsappHref("+")).toBeNull();
  });
});

describe("mailHref", () => {
  it("builds mailto", () => expect(mailHref("a@b.co")).toBe("mailto:a@b.co"));
  it("is null when empty", () => {
    expect(mailHref("")).toBeNull();
    expect(mailHref(undefined)).toBeNull();
  });
});

describe("locationLabel", () => {
  it("joins city and country name", () => expect(locationLabel(withContact({ city: "Nairobi", country_code: "ke" }))).toBe("Nairobi, Kenya"));
  it("city only", () => expect(locationLabel(withContact({ city: "Nairobi" }))).toBe("Nairobi"));
  it("country only", () => expect(locationLabel(withContact({ country_code: "KE" }))).toBe("Kenya"));
  it("falls back to the raw code when invalid", () => expect(locationLabel(withContact({ city: "X", country_code: "1" }))).toBe("X, 1"));
  it("is null when nothing set or contact is null", () => {
    expect(locationLabel(base)).toBeNull();
    expect(locationLabel(null)).toBeNull();
  });
});

describe("socialLinks", () => {
  it("keeps a stable order and skips empty/blank values", () => {
    const links = socialLinks(
      withContact({ social_links: { instagram: "https://i", tiktok: "  ", pinterest: null, facebook: "https://f", x: null, youtube: "https://y" } }),
    );
    expect(links).toEqual([
      { label: "Instagram", href: "https://i" },
      { label: "Facebook", href: "https://f" },
      { label: "YouTube", href: "https://y" },
    ]);
  });
  it("is empty for null contact", () => expect(socialLinks(null)).toEqual([]));
});
