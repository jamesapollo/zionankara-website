"use client";

import { useActionState, useState } from "react";
import { sendEnquiry } from "@/app/(shop)/contact/actions";
import type { EnquiryState } from "@/lib/enquiry";

const idle: EnquiryState = { status: "idle" };
const label = "text-[11px] font-normal uppercase tracking-[0.22em] text-[#777]";
const input =
  "w-full border-0 border-b border-[#CFCFCF] bg-transparent py-3 text-[17px] font-light outline-none focus:border-ink aria-invalid:border-error";
const eyebrow = "text-label font-normal uppercase tracking-[0.28em] text-accent";

function FieldError({ id, text }: { id: string; text?: string }) {
  return (
    <p id={id} className="min-h-[14px] text-[12px] text-accent">
      {text}
    </p>
  );
}

export function ContactForm({
  topics,
  defaultTopic,
  defaultMessage,
}: {
  topics: string[];
  defaultTopic: string;
  defaultMessage: string;
}) {
  const [state, action, pending] = useActionState(sendEnquiry, idle);
  const [dismissed, setDismissed] = useState<EnquiryState | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(defaultTopic);
  const [message, setMessage] = useState(defaultMessage);

  if (state.status === "sent" && dismissed !== state) {
    return (
      <div className="flex flex-col gap-5 border-t border-ink py-[clamp(40px,5vw,72px)]" role="status">
        <span className={eyebrow}>Message sent</span>
        <h2 className="font-display text-h2 font-normal">
          Thank you, <em>{state.firstName}</em>.
        </h2>
        <p className="text-[17px] leading-[1.8] text-copy">
          Your note has reached the atelier. We will write back to {state.email} within two working days.
        </p>
        <button
          type="button"
          onClick={() => {
            setDismissed(state);
            setName("");
            setEmail("");
            setMessage("");
            setTopic(defaultTopic);
          }}
          className="cursor-pointer self-start border-b border-ink pb-1 text-small uppercase tracking-button"
        >
          Send another
        </button>
      </div>
    );
  }

  const errors = state.errors ?? {};
  const formError = state.status === "error" ? state.message : undefined;

  return (
    <form action={action} noValidate className="flex flex-col gap-9" aria-busy={pending}>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-x-8 gap-y-7">
        <div className="flex flex-col gap-1">
          <label htmlFor="enquiry-name" className={label}>
            Full name
          </label>
          <input
            id="enquiry-name"
            name="name"
            autoComplete="name"
            maxLength={120}
            placeholder="Amara Okafor"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby="enquiry-name-error"
            className={input}
          />
          <FieldError id="enquiry-name-error" text={errors.name} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="enquiry-email" className={label}>
            Email
          </label>
          <input
            id="enquiry-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby="enquiry-email-error"
            className={input}
          />
          <FieldError id="enquiry-email-error" text={errors.email} />
        </div>
      </div>

      {topics.length > 0 && (
        <div role="group" aria-labelledby="enquiry-topic-label" className="flex flex-col gap-3">
          <span id="enquiry-topic-label" className={label}>
            What is this about?
          </span>
          <div className="flex flex-wrap gap-2.5">
            {topics.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={topic === t}
                onClick={() => setTopic(t)}
                className={`cursor-pointer border px-[18px] py-2.5 text-label uppercase tracking-[0.14em] transition-colors ${
                  topic === t ? "border-ink bg-ink text-white" : "border-[#CFCFCF] hover:border-ink"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <FieldError id="enquiry-topic-error" text={errors.topic} />
        </div>
      )}
      <input type="hidden" name="topic" value={topic} />

      <div className="flex flex-col gap-1">
        <label htmlFor="enquiry-message" className={label}>
          Your message
        </label>
        <textarea
          id="enquiry-message"
          name="message"
          rows={5}
          maxLength={5000}
          placeholder="Tell us about the occasion, the print you love, or anything else…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby="enquiry-message-error"
          className={`${input} resize-y leading-[1.6]`}
        />
        <FieldError id="enquiry-message-error" text={errors.message} />
      </div>

      {/* Honeypot: hidden from people and assistive tech; bots fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div className="flex flex-col gap-4">
        {formError && (
          <p role="alert" className="text-body text-error">
            {formError}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-6">
          <button
            type="submit"
            disabled={pending}
            className="cursor-pointer bg-ink px-10 py-[18px] text-small uppercase tracking-button text-white transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send message"}
          </button>
          <span className="text-small text-[#777]">We reply within two working days.</span>
        </div>
      </div>
    </form>
  );
}
