"use server";

import { headers } from "next/headers";
import { erpPost, shopperIp } from "@/lib/erp/client";
import { getContactOrNull } from "@/lib/erp/header-data";
import { classifyEnquiryResponse, GENERIC_FAILURE, validateEnquiry, type EnquiryInput, type EnquiryState } from "@/lib/enquiry";

const text = (form: FormData, key: string) => {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
};

export async function sendEnquiry(_prev: EnquiryState, form: FormData): Promise<EnquiryState> {
  const values: EnquiryInput = {
    name: text(form, "name").trim(),
    email: text(form, "email").trim(),
    topic: text(form, "topic").trim(),
    message: text(form, "message").trim(),
  };

  // Topics are read again here (cached, ~5 min); with the ERP unreachable none are known and the ERP decides.
  const topics = (await getContactOrNull())?.enquiry_topics ?? [];
  const errors = validateEnquiry(values, topics);
  if (Object.keys(errors).length > 0) return { status: "error", errors, values };

  try {
    const { status, data } = await erpPost<unknown>(
      "/api/v1/storefront/enquiries",
      { ...values, topic: values.topic || undefined, website: text(form, "website") },
      { clientIp: shopperIp(await headers()) },
    );
    const result = classifyEnquiryResponse(status, data);
    if (result.status !== "sent") return { ...result, values };
    return { status: "sent", firstName: values.name.split(/\s+/)[0], email: values.email };
  } catch (error) {
    console.warn("[contact] enquiry failed:", error instanceof Error ? error.message : error);
    return { status: "error", message: GENERIC_FAILURE, values };
  }
}
