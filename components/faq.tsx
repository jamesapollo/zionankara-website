"use client";

import { useState } from "react";

const items = [
  {
    q: "How long does delivery take?",
    a: "Nairobi orders arrive within 1–3 working days; international orders typically within 7–12 working days, tracked.",
  },
  {
    q: "Can I order a piece in a different print?",
    a: "Yes. Most styles can be made in any print currently in stock — mention the style and print in your message.",
  },
  {
    q: "Do you offer made to measure?",
    a: "We do. Share your measurements and the occasion and we will confirm a fitting or a remote measuring guide.",
  },
  {
    q: "What is your returns policy?",
    a: "Ready-to-wear pieces may be returned unworn within 14 days. Made-to-measure pieces are final sale.",
  },
];

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="bg-tint px-(--za-gutter) py-[clamp(64px,8vw,120px)]">
      <div className="mx-auto grid max-w-site grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-[clamp(40px,6vw,96px)]">
        <div className="flex flex-col gap-5">
          <span className="text-label font-normal uppercase tracking-[0.28em] text-accent">Before you write</span>
          <h2 className="font-display text-h2 font-normal">
            Common <em className="text-accent">questions</em>
          </h2>
        </div>
        <div className="border-b border-[#D9C4C7]">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="border-t border-[#D9C4C7]">
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex w-full cursor-pointer items-center justify-between gap-6 py-[22px] text-left font-display text-[24px] font-normal"
                  >
                    {item.q}
                    <span aria-hidden="true" className="font-display text-[28px] text-accent">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                </h3>
                <div id={`faq-${i}`} hidden={!isOpen} className="max-w-[560px] pb-6 text-[16px] leading-[1.8] text-copy">
                  {item.a}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
