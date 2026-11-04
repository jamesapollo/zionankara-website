import { describe, expect, it } from "vitest";
import { signRequest } from "./sign";

describe("signRequest", () => {
  it("reproduces the worked example from storefront-signing.md", () => {
    expect(
      signRequest({
        method: "GET",
        pathWithQuery: "/api/v1/storefront/store",
        timestamp: 1760000000,
        host: "zionkenya.com",
        clientIp: "203.0.113.10",
        body: "",
        secret: "example-secret",
      }),
    ).toBe("63a46ad23afc6f6739e447e37d656ebf81cafd24de4cbbb0c73484397c0cd52e");
  });

  it("uppercases the method and changes with the body", () => {
    const base = {
      pathWithQuery: "/x",
      timestamp: 1,
      host: "h",
      clientIp: "127.0.0.1",
      secret: "s",
    };
    const get = signRequest({ ...base, method: "get", body: "" });
    expect(get).toBe(signRequest({ ...base, method: "GET", body: "" }));
    expect(signRequest({ ...base, method: "POST", body: "{}" })).not.toBe(
      signRequest({ ...base, method: "POST", body: "" }),
    );
  });
});
