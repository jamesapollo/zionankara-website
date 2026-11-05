export type EnquiryField = "name" | "email" | "topic" | "message";
export type EnquiryInput = Record<EnquiryField, string>;
export type EnquiryErrors = Partial<Record<EnquiryField, string>>;

export type EnquiryState = {
  status: "idle" | "sent" | "error";
  errors?: EnquiryErrors;
  /** Form-level failure (rate limit, ERP down). */
  message?: string;
  firstName?: string;
  email?: string;
  /** What the shopper typed, so a failed send keeps their input. */
  values?: EnquiryInput;
};

export const GENERIC_FAILURE = "We couldn't send your message. Please try again.";
export const RATE_LIMITED = "You've sent a few messages — please try again in a little while.";

// Limits mirror POST /api/v1/storefront/enquiries.
const MAX = { name: 120, email: 254, topic: 40, message: 5000 } as const;
const MIN_MESSAGE = 10;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Field errors, empty when valid. A topic is required only when the store offers topics. */
export function validateEnquiry(input: EnquiryInput, topics: string[] = []): EnquiryErrors {
  const errors: EnquiryErrors = {};
  const name = input.name.trim();
  const email = input.email.trim();
  const topic = input.topic.trim();
  const message = input.message.trim();

  if (!name || name.length > MAX.name) errors.name = "Please enter your name";
  if (!EMAIL.test(email) || email.length > MAX.email) errors.email = "Please enter a valid email";
  if (topics.length > 0) {
    if (!topics.includes(topic)) errors.topic = "Please choose a topic";
  } else if (topic.length > MAX.topic) {
    errors.topic = "Please choose a topic";
  }
  if (message.length < MIN_MESSAGE || message.length > MAX.message) errors.message = "Please tell us a little more";
  return errors;
}

const FIELDS: EnquiryField[] = ["name", "email", "topic", "message"];

/** Turns an ERP response into the state the form shows. Anything but 202/422/429 is a failure. */
export function classifyEnquiryResponse(status: number, body: unknown): EnquiryState {
  if (status === 202) {
    const received = (body as { data?: { received?: unknown } } | null)?.data?.received;
    return received === true ? { status: "sent" } : { status: "error", message: GENERIC_FAILURE };
  }
  if (status === 429) return { status: "error", message: RATE_LIMITED };
  if (status === 422) {
    const raw = (body as { errors?: Record<string, unknown> } | null)?.errors;
    const errors: EnquiryErrors = {};
    for (const field of FIELDS) {
      const first = Array.isArray(raw?.[field]) ? (raw[field] as unknown[])[0] : undefined;
      if (typeof first === "string" && first) errors[field] = first;
    }
    // Only non-field errors (e.g. client_ip) would be a confusing message under a field.
    return Object.keys(errors).length > 0 ? { status: "error", errors } : { status: "error", message: GENERIC_FAILURE };
  }
  return { status: "error", message: GENERIC_FAILURE };
}

/** "kente-wrap-dress" -> "kente wrap dress". */
export function humaniseSlug(slug: string): string {
  return slug.trim().replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Form field name for the honeypot: deliberately unlike "website" so browser autofill leaves it alone. */
export const HONEYPOT_FIELD = "hp_company_url_x";

/** The POST body for /enquiries; the honeypot form field is sent as the API's `website`. */
export function enquiryBody(values: EnquiryInput, form: FormData) {
  const trap = form.get(HONEYPOT_FIELD);
  return { ...values, topic: values.topic || undefined, website: typeof trap === "string" ? trap : "" };
}
