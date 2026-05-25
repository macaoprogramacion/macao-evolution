"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { getCustomerSession } from "@/lib/customer-session";
import { loadCustomerCart, saveCustomerCart } from "@/lib/customer-cart";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  type: "service" | "product";
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  totalItems: number;
  totalPrice: number;
  hasServiceSelected: boolean;
  getConflictingService: (id: string) => CartItem | null;
  replaceService: (oldId: string, newItem: Omit<CartItem, "quantity">) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ownerEmail, setOwnerEmail] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  // Load authenticated customer cart from Supabase.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const session = await getCustomerSession();
      const email = session?.email?.trim().toLowerCase() || "";
      if (!mounted) return;
      setOwnerEmail(email);
      if (!email) return;
      const remoteItems = await loadCustomerCart(email);
      if (!mounted) return;
      setItems(remoteItems);
    })();

    const onAuthChanged = async () => {
      const session = await getCustomerSession();
      const email = session?.email?.trim().toLowerCase() || "";
      setOwnerEmail(email);
      if (!email) {
        setItems([]);
        return;
      }
      setItems(await loadCustomerCart(email));
    };

    window.addEventListener("macao-auth-changed", onAuthChanged);
    return () => {
      mounted = false;
      window.removeEventListener("macao-auth-changed", onAuthChanged);
    };
  }, []);

  // Persist cart to Supabase whenever items change for authenticated users.
  useEffect(() => {
    if (!ownerEmail) return;
    const timer = setTimeout(() => {
      saveCustomerCart(ownerEmail, items);
    }, 250);
    return () => clearTimeout(timer);
  }, [items, ownerEmail]);

  const addItem = useCallback((newItem: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === newItem.id);
      if (existing) {
        return prev.map((item) =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const SERVICE_IDS = ["service-horseback-ride", "service-dune-buggy"];

  const getConflictingService = useCallback((id: string): CartItem | null => {
    if (!SERVICE_IDS.includes(id)) return null;
    const otherId = id === "service-horseback-ride" ? "service-dune-buggy" : "service-horseback-ride";
    return items.find((item) => item.id === otherId) || null;
  }, [items]);

  const replaceService = useCallback((oldId: string, newItem: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const filtered = prev.filter((item) => item.id !== oldId);
      const existing = filtered.find((item) => item.id === newItem.id);
      if (existing) {
        return filtered.map((item) =>
          item.id === newItem.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...filtered, { ...newItem, quantity: 1 }];
    });
    setIsOpen(true);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const hasServiceSelected = items.some(
    (item) => item.id === "service-horseback-ride" || item.id === "service-dune-buggy"
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isOpen,
        setIsOpen,
        totalItems,
        totalPrice,
        hasServiceSelected,
        getConflictingService,
        replaceService,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
