import { afterEach, describe, expect, it, vi } from "vitest";
import { catalogueSource } from "./catalogue-source";

afterEach(() => vi.unstubAllEnvs());

describe("catalogueSource", () => {
  it("defaults to local when unset", () => {
    vi.stubEnv("CATALOGUE_SOURCE", "");
    expect(catalogueSource()).toBe("local");
  });
  it("accepts erp, trimmed and case-insensitive", () => {
    vi.stubEnv("CATALOGUE_SOURCE", "ERP ");
    expect(catalogueSource()).toBe("erp");
  });
  it("treats anything else as local", () => {
    vi.stubEnv("CATALOGUE_SOURCE", "bogus");
    expect(catalogueSource()).toBe("local");
  });
});
