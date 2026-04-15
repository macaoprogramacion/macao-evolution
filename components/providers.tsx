"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { CartProvider } from "@/context/cart-context";
import { CartButton, CartPanel } from "@/components/cart";
import { Toaster } from "@/components/ui/sonner";

function CartUI() {
  const pathname = usePathname();
  // Hide cart on photographer, admin, and sellers pages
  if (pathname.startsWith("/photographer") || pathname.startsWith("/admin") || pathname.startsWith("/sellers")) return null;
  return (
    <>
      <CartButton />
      <CartPanel />
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <CartProvider>
        {children}
        <CartUI />
        <Toaster />
      </CartProvider>
    </ThemeProvider>
  );
}
