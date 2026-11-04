import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ERP_TIMEOUT_MS, ErpError, erpGet, erpPost, shopperIp } from "./client";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubEnv("ERP_API_URL", "https://erp.example.test");
  vi.stubEnv("STOREFRONT_SIGNING_SECRET", "secret");
  vi.stubEnv("ERP_STOREFRONT_HOST", "shop.example.test");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("erpGet", () => {
  it("sends the four signed headers with client IP 0.0.0.0", async () => {
    fetchMock.mockResolvedValue(json({ data: { ok: 1 } }));
    const res = await erpGet<{ data: { ok: number } }>("/api/v1/storefront/store");
    expect(res).toEqual({ data: { ok: 1 } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://erp.example.test/api/v1/storefront/store");
    const h = new Headers(init.headers);
    expect(h.get("X-Storefront-Host")).toBe("shop.example.test");
    expect(h.get("X-Storefront-Client-IP")).toBe("0.0.0.0");
    expect(h.get("X-Storefront-Timestamp")).toMatch(/^\d{10}$/);
    expect(h.get("X-Storefront-Signature")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("throws ErpError with the status on 500", async () => {
    fetchMock.mockResolvedValue(json({ message: "boom" }, 500));
    await expect(erpGet("/api/v1/storefront/store")).rejects.toMatchObject({
      name: "ErpError",
      status: 500,
    });
  });

  it("throws ErpError (status 0) on network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    const err = (await erpGet("/x").catch((e) => e)) as ErpError;
    expect(err).toBeInstanceOf(ErpError);
    expect(err.status).toBe(0);
  });

  it("maps an abort/timeout rejection to a network ErpError", async () => {
    fetchMock.mockRejectedValue(new DOMException("The operation timed out.", "TimeoutError"));
    const err = (await erpGet("/x").catch((e) => e)) as ErpError;
    expect(err).toBeInstanceOf(ErpError);
    expect([err.status, err.kind]).toEqual([0, "network"]);
    expect(err.message).toMatch(/timed out/);
  });

  it("aborts a never-resolving fetch via a timeout signal", async () => {
    const ctl = new AbortController();
    const spy = vi.spyOn(AbortSignal, "timeout").mockReturnValue(ctl.signal);
    fetchMock.mockImplementation(
      (_url: URL, init: RequestInit) =>
        new Promise((_res, rej) =>
          init.signal!.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError"))),
        ),
    );
    const pending = erpGet("/x").catch((e) => e);
    ctl.abort();
    const err = (await pending) as ErpError;
    expect(spy).toHaveBeenCalledWith(ERP_TIMEOUT_MS);
    expect([err.status, err.kind]).toEqual([0, "network"]);
    spy.mockRestore();
  });

  it("throws a config ErpError when ERP_STOREFRONT_HOST is unset", async () => {
    vi.stubEnv("ERP_STOREFRONT_HOST", "");
    const err = (await erpGet("/x").catch((e) => e)) as ErpError;
    expect(err).toBeInstanceOf(ErpError);
    expect(err.kind).toBe("config");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws a config ErpError when the URL or secret is missing", async () => {
    vi.stubEnv("STOREFRONT_SIGNING_SECRET", "");
    await expect(erpGet("/x")).rejects.toMatchObject({ kind: "config" });
  });

  it("throws ErpError with status 404 so callers can map it", async () => {
    fetchMock.mockResolvedValue(json({ message: "Not found." }, 404));
    await expect(erpGet("/x")).rejects.toMatchObject({ status: 404 });
  });

  it("returns the redirect hint as-is", async () => {
    fetchMock.mockResolvedValue(json({ redirect: { slug: "new-slug", status: 301 } }));
    expect(await erpGet("/x")).toEqual({ redirect: { slug: "new-slug", status: 301 } });
  });

  it("signs the normalized path and query it sends", async () => {
    fetchMock.mockResolvedValue(json({ data: [] }));
    await erpGet("/api/v1/storefront/products?q=a b");
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://erp.example.test/api/v1/storefront/products?q=a%20b",
    );
  });
});

describe("erpPost", () => {
  it("returns status and body for 422 and 429 without throwing", async () => {
    fetchMock.mockResolvedValue(json({ message: "Too Many Attempts." }, 429));
    const res = await erpPost("/p", { a: 1 }, { clientIp: "203.0.113.9", host: "req.example.test" });
    expect(res).toEqual({ status: 429, data: { message: "Too Many Attempts." } });
    const [, init] = fetchMock.mock.calls[0];
    const h = new Headers(init.headers);
    expect(h.get("X-Storefront-Client-IP")).toBe("203.0.113.9");
    expect(h.get("X-Storefront-Host")).toBe("shop.example.test"); // env wins
    expect(init.body).toBe('{"a":1}');
    expect(init.cache).toBe("no-store");
  });

  it("falls back to the request host when the env var is unset", async () => {
    vi.stubEnv("ERP_STOREFRONT_HOST", "");
    fetchMock.mockResolvedValue(json({}, 201));
    await erpPost("/p", {}, { clientIp: "127.0.0.1", host: "req.example.test" });
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get("X-Storefront-Host")).toBe(
      "req.example.test",
    );
  });

  it("throws ErpError on 5xx and network failure", async () => {
    fetchMock.mockResolvedValue(json({}, 502));
    await expect(erpPost("/p", {}, { clientIp: "127.0.0.1" })).rejects.toMatchObject({ status: 502 });
    fetchMock.mockRejectedValue(new Error("down"));
    await expect(erpPost("/p", {}, { clientIp: "127.0.0.1" })).rejects.toBeInstanceOf(ErpError);
  });

  it("never sends an unspecified IP", async () => {
    fetchMock.mockResolvedValue(json({}, 201));
    await erpPost("/p", {}, { clientIp: "0.0.0.0", host: "h.test" });
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get("X-Storefront-Client-IP")).toBe(
      "127.0.0.1",
    );
  });
});

describe("shopperIp", () => {
  const ip = (init: Record<string, string>) => shopperIp(new Headers(init));
  it("uses the first x-forwarded-for entry", () => {
    expect(ip({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" })).toBe("203.0.113.9");
  });
  it("falls back to x-real-ip, then 127.0.0.1", () => {
    expect(ip({ "x-real-ip": "198.51.100.4" })).toBe("198.51.100.4");
    expect(ip({})).toBe("127.0.0.1");
  });
  it.each(["::1", "::", "0.0.0.0", "::ffff:0.0.0.0", ""])("maps %j to 127.0.0.1", (v) => {
    expect(ip({ "x-forwarded-for": v })).toBe("127.0.0.1");
    expect(ip({ "x-real-ip": v })).toBe("127.0.0.1");
  });
  it("maps an empty first xff entry via x-real-ip", () => {
    expect(ip({ "x-forwarded-for": " , 1.2.3.4", "x-real-ip": "198.51.100.4" })).toBe("198.51.100.4");
  });
});
