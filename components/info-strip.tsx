import type { ContactDetails } from "@/lib/erp/types";
import { locationLabel, mailHref, socialLinks, telHref } from "@/lib/contact";

/** Accent strip above the header. Empty fields are omitted; renders nothing without contact. */
export function InfoStrip({ contact }: { contact: ContactDetails | null }) {
  if (!contact) return null;
  const phone = contact.phone?.trim();
  const tel = telHref(phone);
  const email = contact.email?.trim();
  const mail = mailHref(email);
  const location = locationLabel(contact);
  const socials = socialLinks(contact);
  if (!tel && !mail && !location && socials.length === 0) return null;

  return (
    <div className="bg-accent text-white">
      <div className="mx-auto flex max-w-site items-center justify-center px-(--za-gutter) py-2 text-small tracking-[0.04em] nav:justify-between">
        <div className="flex items-center gap-x-6">
          {tel && (
            <a href={tel} className="hover:underline">
              {phone}
            </a>
          )}
          {mail && (
            <a href={mail} className="hover:underline max-nav:hidden">
              {email}
            </a>
          )}
          {location && <span className="max-nav:hidden">{location}</span>}
        </div>
        {socials.length > 0 && (
          <ul className="flex gap-5 uppercase tracking-[0.14em] max-nav:hidden">
            {socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
