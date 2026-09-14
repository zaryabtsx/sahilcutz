"use client";

import { usePathname } from "next/navigation";

export function WhatsAppButton() {
  const pathname = usePathname();
  const isPaymentStatusPage = pathname === "/booking/payment-status";

  if (pathname?.startsWith("/admin")) return null;

  const whatsappMessage = isPaymentStatusPage
    ? "Hello, I need help regarding my payment. Can you please assist me?"
    : "Hello Sahil Cutz, I would like to book an appointment.";
  const whatsappUrl = `https://wa.me/923421480405?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={isPaymentStatusPage ? "Get payment help on WhatsApp" : "Chat with Sahil Cutz on WhatsApp"}
      className="group fixed bottom-5 right-5 z-50 inline-flex max-w-[calc(100vw-2rem)] items-center gap-2 overflow-hidden rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-black/30 transition-all duration-300 hover:scale-105 hover:bg-[#20bd5a] focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 focus:ring-offset-background motion-safe:animate-pulse sm:bottom-6 sm:right-6"
    >
      <span className="shrink-0 transition-transform duration-300 group-hover:rotate-12" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" aria-hidden="true">
          <path d="M20.5 11.5a8.5 8.5 0 0 1-12.57 7.46L4 20l1.08-3.77A8.5 8.5 0 1 1 20.5 11.5Z" strokeWidth="1.8" />
          <path d="M8.7 8.2c.2-.45.42-.46.8-.46h.34c.2 0 .4.08.5.34l.56 1.34c.1.25.08.43-.08.62l-.42.5c-.12.14-.15.28-.05.47.2.36.52.78.96 1.18.45.4.9.68 1.27.85.2.09.33.06.45-.08l.52-.6c.14-.17.32-.2.55-.1l1.34.63c.25.12.34.3.28.53-.08.37-.25.72-.52 1.04-.27.32-.62.46-1.05.43-.57-.04-1.5-.43-2.65-1.42-1.15-.98-1.84-1.94-2.2-2.54-.36-.6-.73-1.5-.6-2.13.08-.4.2-.56.3-.76Z" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className="truncate">Chat with us</span>
    </a>
  );
}
