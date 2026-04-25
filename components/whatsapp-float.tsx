"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";

const WHATSAPP_NUMBER = "18494731020";

export function WhatsAppFloat() {
  const pathname = usePathname();

  const isInternalPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/photographer") ||
    pathname.startsWith("/sellers");

  if (isInternalPath) {
    return null;
  }

  return (
    <Link
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg transition-transform duration-200 hover:scale-105 hover:bg-[#20ba5a]"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="text-sm font-semibold">WhatsApp</span>
    </Link>
  );
}