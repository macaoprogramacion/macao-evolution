"use client";

import { useCart, type CartItem } from "@/context/cart-context";
import { CheckoutModal } from "@/components/checkout";
import Image from "next/image";
import { ShoppingCart, X, Plus, Minus, Trash2, Check, Tag, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

function AddedToast({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 animate-in slide-in-from-right duration-300">
      <div className="rounded-full bg-green-500 p-1">
        <Check size={12} className="text-white" />
      </div>
      <span className="text-sm text-foreground">{message}</span>
    </div>
  );
}

export function CartButton() {
  const { totalItems, setIsOpen, isOpen } = useCart();

  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-110 active:scale-95"
      aria-label="Abrir carrito"
    >
      <ShoppingCart size={22} />
      {totalItems > 0 && (
        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
          {totalItems}
        </span>
      )}
    </button>
  );
}

export function CartPanel() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    isOpen,
    setIsOpen,
    totalItems,
    totalPrice,
    hasServiceSelected,
  } = useCart();
  const [toast, setToast] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [setIsOpen]);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-background shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <ShoppingCart size={20} className="text-foreground" />
            <h2 className="text-lg font-semibold text-foreground">
              Carrito ({totalItems})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Cerrar carrito"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="px-6 py-2">
            <AddedToast message={toast} />
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="rounded-full bg-secondary p-6">
                <ShoppingCart size={32} className="text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-foreground">
                Tu carrito está vacío
              </p>
              <p className="text-sm text-muted-foreground">
                Agrega servicios o productos haciendo click sobre ellos
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-xl border border-border p-3 transition-colors hover:bg-secondary/50"
                >
                  {/* Image */}
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-medium leading-tight text-foreground">
                          {item.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-500"
                          aria-label={`Eliminar ${item.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <span className="mt-0.5 inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {item.type === "service" ? "Servicio" : "Producto"}
                      </span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-500">
                          <Tag size={10} />
                          DESCUENTO
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity controls */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="min-w-[20px] text-center text-sm font-medium text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="text-xs text-muted-foreground line-through mr-1">
                            ${(item.originalPrice * item.quantity).toFixed(2)}
                          </span>
                        )}
                        <span className={`text-sm font-semibold ${item.originalPrice && item.originalPrice > item.price ? 'text-red-500' : 'text-foreground'}`}>
                          {item.price === 0
                            ? "GRATIS"
                            : `$${(item.price * item.quantity).toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border px-6 py-4 space-y-4">
            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-foreground">
                Total
              </span>
              <span className="text-xl font-bold text-foreground">
                ${totalPrice.toFixed(2)}
              </span>
            </div>

            {/* Service warning */}
            {!hasServiceSelected && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 animate-in fade-in duration-300">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Agrega un servicio (Colectivo o Privado) para poder reservar.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={clearCart}
                className="flex-1 rounded-full border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Vaciar
              </button>
              <button
                type="button"
                disabled={!hasServiceSelected}
                onClick={() => {
                  if (!hasServiceSelected) return;
                  setIsOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className={`flex-1 rounded-full px-4 py-3 text-sm font-medium transition-all ${
                  hasServiceSelected
                    ? "bg-foreground text-background hover:opacity-80"
                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                }`}
              >
                Reservar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
    </>
  );
}
