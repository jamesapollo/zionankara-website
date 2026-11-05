import { describe, expect, it } from "vitest";
import { classifyEnquiryResponse, humaniseSlug, validateEnquiry, GENERIC_FAILURE, RATE_LIMITED } from "./enquiry";

const ok = { name: "Amara Okafor", email: "amara@example.com", topic: "Order enquiry", message: "Hello there, a question." };
const topics = ["Order enquiry", "Press"];

describe("validateEnquiry", () => {
  it("accepts a valid enquiry", () => expect(validateEnquiry(ok, topics)).toEqual({}));
  it("requires a name", () => expect(validateEnquiry({ ...ok, name: "  " }, topics).name).toBe("Please enter your name"));
  it("caps the name at 120", () => {
    expect(validateEnquiry({ ...ok, name: "a".repeat(121) }, topics).name).toBeTruthy();
    expect(validateEnquiry({ ...ok, name: "a".repeat(120) }, topics).name).toBeUndefined();
  });
  it("rejects bad emails", () => {
    for (const email of ["", "nope", "a@b", "a b@c.de"]) expect(validateEnquiry({ ...ok, email }, topics).email).toBe("Please enter a valid email");
  });
  it("caps the email at 254", () => {
    expect(validateEnquiry({ ...ok, email: `${"a".repeat(250)}@b.co` }, topics).email).toBeTruthy();
  });
  it("message: 9 fails, 10 passes, 5000 passes, 5001 fails", () => {
    expect(validateEnquiry({ ...ok, message: "a".repeat(9) }, topics).message).toBe("Please tell us a little more");
    expect(validateEnquiry({ ...ok, message: "a".repeat(10) }, topics).message).toBeUndefined();
    expect(validateEnquiry({ ...ok, message: "a".repeat(5000) }, topics).message).toBeUndefined();
    expect(validateEnquiry({ ...ok, message: "a".repeat(5001) }, topics).message).toBeTruthy();
  });
  it("counts the trimmed message", () => {
    expect(validateEnquiry({ ...ok, message: "   short   " }, topics).message).toBe("Please tell us a little more");
  });
  it("requires a topic only when the store has topics", () => {
    expect(validateEnquiry({ ...ok, topic: "" }, topics).topic).toBe("Please choose a topic");
    expect(validateEnquiry({ ...ok, topic: "" }, []).topic).toBeUndefined();
    expect(validateEnquiry({ ...ok, topic: "" }).topic).toBeUndefined();
  });
  it("caps a free topic at 40", () => {
    expect(validateEnquiry({ ...ok, topic: "a".repeat(41) }, []).topic).toBeTruthy();
  });
  it("rejects a topic the store does not offer", () => {
    expect(validateEnquiry({ ...ok, topic: "Other" }, topics).topic).toBe("Please choose a topic");
  });
});

describe("classifyEnquiryResponse", () => {
  it("202 with received is sent", () => expect(classifyEnquiryResponse(202, { data: { received: true } })).toEqual({ status: "sent" }));
  it("202 with an unreadable body is a failure", () => {
    expect(classifyEnquiryResponse(202, null)).toEqual({ status: "error", message: GENERIC_FAILURE });
    expect(classifyEnquiryResponse(200, {})).toEqual({ status: "error", message: GENERIC_FAILURE });
  });
  it("maps 422 field errors to the first message per field", () => {
    expect(
      classifyEnquiryResponse(422, { message: "x", errors: { email: ["bad email", "second"], message: ["too short"], other: ["x"] } }),
    ).toEqual({ status: "error", errors: { email: "bad email", message: "too short" } });
  });
  it("422 with only client_ip or unreadable body is the generic failure", () => {
    expect(classifyEnquiryResponse(422, { message: "x", errors: { client_ip: ["bad"] } })).toEqual({ status: "error", message: GENERIC_FAILURE });
    expect(classifyEnquiryResponse(422, null)).toEqual({ status: "error", message: GENERIC_FAILURE });
    expect(classifyEnquiryResponse(422, { errors: {} })).toEqual({ status: "error", message: GENERIC_FAILURE });
  });
  it("429 is the rate-limit copy", () => expect(classifyEnquiryResponse(429, null)).toEqual({ status: "error", message: RATE_LIMITED }));
  it("any other status is the generic failure", () => {
    for (const s of [200, 400, 401, 404, 403]) expect(classifyEnquiryResponse(s, { data: { received: true } }).message).toBe(GENERIC_FAILURE);
  });
});

describe("humaniseSlug", () => {
  it("turns a slug into words", () => expect(humaniseSlug("kente-wrap-dress")).toBe("kente wrap dress"));
  it("is empty for blank input", () => expect(humaniseSlug("  ")).toBe(""));
});
