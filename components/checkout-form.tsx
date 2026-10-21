"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { bagTotals, FREE_DELIVERY_OVER_KES, STANDARD_DELIVERY_KES } from "@/lib/pricing";
import { clearBag, useFormatPrice, useHydrated, useStore } from "@/lib/store";
import { ButtonLink } from "./button-link";
import { OrderTotals } from "./order-totals";

const countries = ["Kenya", "Uganda", "Tanzania", "Nigeria", "United Kingdom", "United States", "Other"];

type Method = { id: string; label: string; note: string; costKes: number };

function deliveryMethods(isKenya: boolean, afterPromoKes: number): Method[] {
  if (!isKenya) {
    return [{ id: "intl", label: "International — DHL Express, 5–10 days", note: "Duties may apply on arrival", costKes: 4500 }];
  }
  return [
    {
      id: "std",
      label: "Standard — 1–2 days Nairobi, 2–4 days countrywide",
      note: "Free in Nairobi over KES 10,000",
      costKes: afterPromoKes >= FREE_DELIVERY_OVER_KES ? 0 : STANDARD_DELIVERY_KES,
    },
    { id: "exp", label: "Express — same-day Nairobi", note: "Order before 12pm, Monday–Saturday", costKes: 900 },
    { id: "pick", label: "Pick up from our Nairobi atelier", note: "Ready within 24 hours", costKes: 0 },
  ];
}

const payments = [
  { id: "mpesa", label: "M-Pesa", hint: "Pay with your phone", kenyaOnly: true },
  { id: "card", label: "Credit or debit card", hint: "Visa · Mastercard" },
  { id: "paypal", label: "PayPal", hint: "Redirects to PayPal" },
];

const requiredFields = {
  email: "email",
  first: "first name",
  last: "last name",
  address: "address",
  city: "town",
  phone: "phone",
} as const;

type Fields = Record<keyof typeof requiredFields | "region" | "postal", string> & { country: string; news: boolean };

const input =
  "h-[54px] border border-line-strong bg-white px-4 text-body outline-none focus:border-ink aria-invalid:border-error";
const fieldLabel = "text-label font-medium uppercase tracking-[0.16em]";

export function CheckoutForm() {
  const { bag, promoCode } = useStore();
  const hydrated = useHydrated();
  const format = useFormatPrice();
  const [fields, setFields] = useState<Fields>({
    email: "",
    news: true,
    first: "",
    last: "",
    address: "",
    city: "",
    region: "",
    postal: "",
    country: "Kenya",
    phone: "",
  });
  const [methodId, setMethodId] = useState("std");
  const [paymentId, setPaymentId] = useState("mpesa");
  const [mpesa, setMpesa] = useState("");
  const [missing, setMissing] = useState<string[]>([]);
  const [order, setOrder] = useState<{ number: string; firstName: string; email: string; message: string } | null>(null);

  const isKenya = fields.country === "Kenya";
  const baseTotals = bagTotals(bag, promoCode);
  const methods = deliveryMethods(isKenya, baseTotals.afterPromo);
  const method = methods.find((m) => m.id === methodId) ?? methods[0];
  const totals = bagTotals(bag, promoCode, method.costKes);
  const availablePayments = payments.filter((p) => isKenya || !p.kenyaOnly);
  const payment = availablePayments.find((p) => p.id === paymentId) ?? availablePayments[0];

  const set = (key: keyof Fields, value: string | boolean) => {
    setFields((f) => ({ ...f, [key]: value }));
    setMissing((m) => m.filter((k) => k !== key));
  };

  const placeOrder = () => {
    const gaps: string[] = (Object.keys(requiredFields) as (keyof typeof requiredFields)[]).filter((k) => !fields[k].trim());
    if (payment.id === "mpesa" && !mpesa.trim()) gaps.push("mpesa");
    setMissing(gaps);
    if (gaps.length) return;

    setOrder({
      number: `ZA-${Math.floor(10000 + Math.random() * 89999)}`,
      firstName: fields.first.trim(),
      email: fields.email.trim(),
      message:
        method.id === "pick"
          ? "We’ll message you when your order is ready to collect from the atelier."
          : method.id === "exp"
            ? "Your order will arrive today."
            : isKenya
              ? "Your order will be with you in 1–4 business days."
              : "Your order will be with you in 5–10 business days.",
    });
    clearBag();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (order) {
    return (
      <section className="mx-auto flex max-w-[760px] flex-col items-center gap-[22px] px-(--za-gutter) py-[clamp(64px,8vw,120px)] text-center">
        <span aria-hidden className="flex size-16 items-center justify-center rounded-full bg-tint text-[26px] text-accent">
          ✓
        </span>
        <span className="text-label font-normal uppercase tracking-[0.28em] text-accent">Order {order.number}</span>
        <h2 className="font-display text-[clamp(40px,4.4vw,60px)] leading-[1.05]">Thank you, {order.firstName}.</h2>
        <p className="max-w-[480px] text-base leading-[1.75] text-copy">
          {order.message} A confirmation has been sent to {order.email}.
        </p>
        <ButtonLink href="/collections" pad="mt-3 px-[34px] py-[17px]">
          Continue shopping
        </ButtonLink>
      </section>
    );
  }

  if (!hydrated) return <div className="min-h-[60vh]" />;

  if (totals.count === 0) {
    return (
      <section className="mx-auto flex max-w-[760px] flex-col items-center gap-5 px-(--za-gutter) py-[clamp(64px,8vw,120px)] text-center">
        <span className="font-display text-[34px]">Your bag is empty</span>
        <span className="text-body text-copy">Add a piece or two before checking out.</span>
        <ButtonLink href="/collections" pad="px-[30px] py-4">
          Shop collections
        </ButtonLink>
      </section>
    );
  }

  const missingLabels = missing.map((k) => (k === "mpesa" ? "M-Pesa number" : requiredFields[k as keyof typeof requiredFields]));
  const invalid = (key: string) => missing.includes(key) || undefined;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        placeOrder();
      }}
      className="mx-auto flex max-w-site flex-col gap-[clamp(24px,4vw,72px)] px-(--za-gutter) pt-[clamp(32px,4vw,56px)] pb-[clamp(64px,8vw,112px)] lg:flex-row lg:items-start"
    >
      <div className="flex min-w-0 flex-[2] flex-col">
        <p className="mb-8 border border-panel-border bg-panel px-5 py-4 text-sm text-copy">
          This is a demo checkout. No order is sent and no payment is taken — please don’t enter real card details.
        </p>

        <Step number={1} title="Contact" className="pb-9">
          <label className="flex flex-col gap-2">
            <span className={fieldLabel}>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={fields.email}
              onChange={(e) => set("email", e.target.value)}
              aria-invalid={invalid("email")}
              placeholder="you@example.com"
              className={input}
            />
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm text-copy">
            <input type="checkbox" checked={fields.news} onChange={(e) => set("news", e.target.checked)} className="size-4 accent-ink" />
            Email me about new arrivals and private sales
          </label>
        </Step>

        <Step number={2} title="Delivery address" className="py-9">
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
            <TextField label="First name" value={fields.first} onChange={(v) => set("first", v)} invalid={invalid("first")} placeholder="Wanjiru" autoComplete="given-name" />
            <TextField label="Last name" value={fields.last} onChange={(v) => set("last", v)} invalid={invalid("last")} placeholder="Kamau" autoComplete="family-name" />
          </div>
          <TextField
            label="Address"
            value={fields.address}
            onChange={(v) => set("address", v)}
            invalid={invalid("address")}
            placeholder="Street, building, apartment or house number"
            autoComplete="street-address"
          />
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-3">
            <TextField label="Town / city" value={fields.city} onChange={(v) => set("city", v)} invalid={invalid("city")} placeholder="Nairobi" autoComplete="address-level2" />
            <TextField
              label={isKenya ? "County" : "State / region"}
              value={fields.region}
              onChange={(v) => set("region", v)}
              placeholder={isKenya ? "Nairobi County" : "Region"}
              autoComplete="address-level1"
            />
            <TextField label="Postal code" value={fields.postal} onChange={(v) => set("postal", v)} placeholder="00100" autoComplete="postal-code" />
          </div>
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className={fieldLabel}>Country</span>
              <select
                value={fields.country}
                autoComplete="country-name"
                onChange={(e) => {
                  set("country", e.target.value);
                  setMethodId(e.target.value === "Kenya" ? "std" : "intl");
                }}
                className={`${input} cursor-pointer px-3.5`}
              >
                {countries.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <TextField
              label="Phone"
              type="tel"
              value={fields.phone}
              onChange={(v) => set("phone", v)}
              invalid={invalid("phone")}
              placeholder="+254 7XX XXX XXX"
              autoComplete="tel"
            />
          </div>
        </Step>

        <Step number={3} title="Delivery method" className="py-9">
          {methods.map((m) => (
            <ChoiceCard key={m.id} name="delivery" checked={m.id === method.id} onChange={() => setMethodId(m.id)}>
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-body font-normal">{m.label}</span>
                <span className="text-small text-muted">{m.note}</span>
              </span>
              <span className="text-body font-normal">{m.costKes ? format(m.costKes) : "Free"}</span>
            </ChoiceCard>
          ))}
        </Step>

        <Step number={4} title="Payment" aside="Secure, encrypted" className="border-b-0 pt-9">
          {availablePayments.map((p) => (
            <ChoiceCard
              key={p.id}
              name="payment"
              checked={p.id === payment.id}
              onChange={() => setPaymentId(p.id)}
              detail={
                p.id !== payment.id ? null : p.id === "mpesa" ? (
                  <div className="flex flex-col gap-2.5">
                    <label htmlFor="mpesa-number" className="sr-only">
                      M-Pesa number
                    </label>
                    <input
                      id="mpesa-number"
                      type="tel"
                      value={mpesa}
                      onChange={(e) => {
                        setMpesa(e.target.value);
                        setMissing((m) => m.filter((k) => k !== "mpesa"));
                      }}
                      aria-invalid={invalid("mpesa")}
                      placeholder="M-Pesa number, e.g. 0712 345 678"
                      className={`${input} h-[52px]`}
                    />
                    <span className="text-small leading-relaxed text-muted">
                      You’ll receive a prompt on your phone to enter your M-Pesa PIN.
                    </span>
                  </div>
                ) : p.id === "card" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <input aria-label="Card number" placeholder="Card number" inputMode="numeric" className={`${input} col-span-2 h-[52px]`} />
                    <input aria-label="Expiry date" placeholder="MM / YY" inputMode="numeric" className={`${input} h-[52px]`} />
                    <input aria-label="Security code" placeholder="CVC" inputMode="numeric" className={`${input} h-[52px]`} />
                  </div>
                ) : null
              }
            >
              <span className="flex-1 text-body font-normal">{p.label}</span>
              <span className="text-small text-muted">{p.hint}</span>
            </ChoiceCard>
          ))}
        </Step>
      </div>

      <aside className="flex min-w-0 flex-1 flex-col gap-[18px] lg:sticky lg:top-6">
        <div className="flex flex-col gap-[18px] border border-panel-border bg-panel p-[clamp(24px,2.6vw,36px)]">
          <span className="text-label font-medium uppercase tracking-label">Order summary</span>
          {totals.lines.map((line) => (
            <div key={line.id} className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-4">
              <div className="relative aspect-product w-16 overflow-hidden bg-tint">
                <Image src={line.product.image} alt="" fill sizes="64px" className="object-cover object-top" />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="font-display text-[19px] leading-[1.15] font-medium">{line.product.name}</span>
                <span className="text-small text-muted">
                  Qty {line.quantity} · UK {line.size}
                </span>
              </div>
              <span className="text-body font-normal whitespace-nowrap">{format(line.product.priceKes * line.quantity)}</span>
            </div>
          ))}
          <div className="flex flex-col gap-3.5 border-t border-[#e8dada] pt-[18px]">
            <OrderTotals totals={totals} promoCode={promoCode} />
          </div>
          {missingLabels.length > 0 && (
            <p role="alert" className="text-small leading-relaxed text-error">
              Please add your {missingLabels.join(", ")}.
            </p>
          )}
          <button
            type="submit"
            className="h-[58px] cursor-pointer bg-ink text-small font-normal uppercase tracking-button text-white transition-colors hover:bg-accent"
          >
            Place order — {format(totals.total)}
          </button>
        </div>
        <div className="flex items-center gap-3.5 text-sm leading-relaxed text-copy">
          <span
            aria-hidden
            className="flex size-12 shrink-0 items-center justify-center rounded-full border border-ink font-display text-[22px] italic text-ink"
          >
            Z
          </span>
          Hand-finished and packed in our Nairobi atelier, dispatched within 1–2 business days.
        </div>
      </aside>
    </form>
  );
}

function Step({
  number,
  title,
  aside,
  className = "",
  children,
}: {
  number: number;
  title: string;
  aside?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`flex flex-col gap-[18px] border-b border-line ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-3.5 font-display text-[30px] font-medium">
          <span className="flex size-[30px] items-center justify-center rounded-full bg-ink font-sans text-small font-medium text-white">
            {number}
          </span>
          {title}
        </h2>
        {aside && <span className="text-small text-muted">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  invalid,
  type = "text",
  ...rest
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: true;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className={fieldLabel}>{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid} className={input} {...rest} />
    </label>
  );
}

function ChoiceCard({
  name,
  checked,
  onChange,
  detail,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  detail?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`border ${checked ? "border-ink bg-white" : "border-line bg-[#fafafa]"}`}>
      <label className="flex cursor-pointer items-center gap-3.5 px-[22px] py-5">
        <input type="radio" name={name} checked={checked} onChange={onChange} className="size-[18px] accent-ink" />
        {children}
      </label>
      {detail && <div className="px-[22px] pb-[22px]">{detail}</div>}
    </div>
  );
}
