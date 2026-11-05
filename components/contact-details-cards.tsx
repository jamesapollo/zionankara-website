import Image from "next/image";
import { locationLabel, mailHref, socialLinks, telHref, whatsappHref } from "@/lib/contact";
import type { ContactDetails } from "@/lib/erp/types";

const card = "flex flex-col gap-2.5 border-t border-ink pt-5";
const cardLabel = "text-[11px] uppercase tracking-[0.22em] text-[#777]";
const value = "font-display text-[24px] leading-[1.2] hover:text-accent";
const sub = "text-[14px] text-[#777]";

/** Details cards plus the atelier photo. Empty ERP fields are omitted; with no contact only the photo shows. */
export function ContactDetailsCards({ contact }: { contact: ContactDetails | null }) {
  const email = contact?.email?.trim();
  const phone = contact?.phone?.trim();
  const whatsapp = whatsappHref(contact?.whatsapp);
  const address = [contact?.address_line?.trim(), contact?.city?.trim()].filter(Boolean).join(", ") || locationLabel(contact);
  const hours = contact?.opening_hours?.trim();
  const visitNote = contact?.visit_note?.trim();
  const social = socialLinks(contact);

  return (
    <aside className="flex flex-col gap-10">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))] gap-8">
        {email && mailHref(email) && (
          <div className={card}>
            <span className={cardLabel}>Write</span>
            <a href={mailHref(email)!} className={`${value} break-words`}>
              {email}
            </a>
          </div>
        )}
        {(phone || whatsapp) && (
          <div className={card}>
            <span className={cardLabel}>Call or WhatsApp</span>
            {phone && telHref(phone) && (
              <a href={telHref(phone)!} className={value}>
                {phone}
              </a>
            )}
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={phone ? "text-[15px] hover:text-accent" : value}>
                WhatsApp
              </a>
            )}
            {hours && <span className={sub}>{hours}</span>}
          </div>
        )}
        {address && (
          <div className={card}>
            <span className={cardLabel}>Visit the atelier</span>
            <span className="font-display text-[24px] leading-[1.2]">{address}</span>
            {visitNote && <span className={sub}>{visitNote}</span>}
          </div>
        )}
        {social.length > 0 && (
          <div className={card}>
            <span className={cardLabel}>Follow</span>
            <div className="flex flex-col gap-1.5 text-[15px]">
              {social.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="relative aspect-[4/5] max-h-[560px] w-full overflow-hidden bg-tint [clip-path:inset(0_round_400px_400px_0_0)]">
        <Image
          src="/images/editorial/about-gate.jpg"
          alt="The doorway of the Zionankara atelier"
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover"
        />
      </div>
    </aside>
  );
}
