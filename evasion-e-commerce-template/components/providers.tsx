"use client";

import { CartProvider } from "@/context/cart-context";
import { CartButton, CartPanel } from "@/components/cart";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartButton />
      <CartPanel />
      <Toaster />
    </CartProvider>
  );
}
