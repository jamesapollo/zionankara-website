const httpUrl = (value: string | undefined): URL | null => {
  try {
    const url = new URL((value ?? "").trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
};

/**
 * Staff sign-in for the footer "Admin" link (design: "Staff sign in"). `ERP_ADMIN_URL` wins; otherwise the
 * ERP origin, where the dashboard is served. Null hides the link.
 */
export function adminUrl(): string | null {
  const explicit = httpUrl(process.env.ERP_ADMIN_URL);
  if (explicit) return explicit.href;
  const erp = httpUrl(process.env.ERP_API_URL);
  return erp ? `${erp.origin}/` : null;
}
