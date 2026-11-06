import { whatsappOrderHref, type WhatsAppOrder } from "@/lib/contact";

/** "Order on WhatsApp" from the product design: opens a chat with the order pre-filled. Hidden without a number. */
export function WhatsAppOrderButton({ whatsapp, order }: { whatsapp: string | null; order: WhatsAppOrder }) {
  const href = whatsappOrderHref(whatsapp, order);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-14 items-center justify-center gap-3 border border-[#25D366] text-[13px] font-normal uppercase tracking-[0.2em] text-[#128C7E] transition-colors duration-200 hover:bg-[#25D366] hover:text-white"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="fill-[#25D366] transition-colors duration-200 group-hover:fill-white">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.1.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3z" />
      </svg>
      Order on WhatsApp
    </a>
  );
}
