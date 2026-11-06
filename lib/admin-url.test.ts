import { afterEach, describe, expect, it, vi } from "vitest";
import { adminUrl } from "./admin-url";

afterEach(() => vi.unstubAllEnvs());

describe("adminUrl", () => {
  it("uses the ERP origin, where the dashboard is served", () => {
    vi.stubEnv("ERP_ADMIN_URL", "");
    vi.stubEnv("ERP_API_URL", "https://admin.zionankara.com/api");
    expect(adminUrl()).toBe("https://admin.zionankara.com/");
  });

  it("prefers ERP_ADMIN_URL when set", () => {
    vi.stubEnv("ERP_ADMIN_URL", " https://dashboard.example.com/admin ");
    vi.stubEnv("ERP_API_URL", "https://admin.zionankara.com");
    expect(adminUrl()).toBe("https://dashboard.example.com/admin");
  });

  it("is null when neither is set or the value is not a web address", () => {
    vi.stubEnv("ERP_ADMIN_URL", "");
    vi.stubEnv("ERP_API_URL", "");
    expect(adminUrl()).toBeNull();
    vi.stubEnv("ERP_API_URL", "admin.zionankara.com");
    expect(adminUrl()).toBeNull();
    vi.stubEnv("ERP_ADMIN_URL", "javascript:alert(1)");
    expect(adminUrl()).toBeNull();
  });
});
