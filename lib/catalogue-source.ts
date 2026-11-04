export type CatalogueSource = "local" | "erp";

/** `CATALOGUE_SOURCE=erp` switches to the ERP; unset or anything else stays local. */
export function catalogueSource(): CatalogueSource {
  return process.env.CATALOGUE_SOURCE?.trim().toLowerCase() === "erp" ? "erp" : "local";
}
