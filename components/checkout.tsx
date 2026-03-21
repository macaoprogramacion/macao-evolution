"use client";

import { useState } from "react";
import { useCart } from "@/context/cart-context";
import {
  X,
  CreditCard,
  User,
  Phone,
  Mail,
  Lock,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Check,
  Shield,
  CircleDollarSign,
} from "lucide-react";

type PaymentOption = "full" | "partial";
type PaymentMethod = "card" | "paypal";

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
}

interface CardInfo {
  number: string;
  name: string;
  expiry: string;
  cvc: string;
}

export function CheckoutModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { items, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: "",
    phone: "",
    email: "",
  });
  const [paymentOption, setPaymentOption] = useState<PaymentOption>("full");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [card, setCard] = useState<CardInfo>({
    number: "",
    name: "",
    expiry: "",
    cvc: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const depositAmount = totalPrice * 0.2;
  const remainingAmount = totalPrice * 0.8;
  const amountToPay = paymentOption === "full" ? totalPrice : depositAmount;

  // --- Validation ---
  function validateStep1() {
    const newErrors: Record<string, string> = {};
    if (!customer.name.trim()) newErrors.name = "El nombre es obligatorio";
    if (!customer.phone.trim()) newErrors.phone = "El teléfono es obligatorio";
    else if (!/^[\d\s\-+()]{7,20}$/.test(customer.phone))
      newErrors.phone = "Número de teléfono inválido";
    if (!customer.email.trim())
      newErrors.email = "El correo electrónico es obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email))
      newErrors.email = "Correo electrónico inválido";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function validateStep2() {
    if (paymentMethod === "paypal") return true;
    const newErrors: Record<string, string> = {};
    if (!card.number.trim())
      newErrors.cardNumber = "El número de tarjeta es obligatorio";
    else if (card.number.replace(/\s/g, "").length < 16)
      newErrors.cardNumber = "Número de tarjeta inválido";
    if (!card.name.trim())
      newErrors.cardName = "El nombre del titular es obligatorio";
    if (!card.expiry.trim())
      newErrors.cardExpiry = "La fecha de expiración es obligatoria";
    else if (!/^\d{2}\/\d{2}$/.test(card.expiry))
      newErrors.cardExpiry = "Formato inválido (MM/AA)";
    if (!card.cvc.trim()) newErrors.cardCvc = "El CVC es obligatorio";
    else if (!/^\d{3,4}$/.test(card.cvc))
      newErrors.cardCvc = "CVC inválido";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // --- Handlers ---
  function goToStep2() {
    if (validateStep1()) setStep(2);
  }

  function handlePay() {
    if (!validateStep2()) return;
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setStep(3);
    }, 2000);
  }

  function handleFinish() {
    clearCart();
    setStep(1);
    setCustomer({ name: "", phone: "", email: "" });
    setCard({ number: "", name: "", expiry: "", cvc: "" });
    setPaymentOption("full");
    setPaymentMethod("card");
    setErrors({});
    onClose();
  }

  // Format card number with spaces
  function formatCardNumber(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  // Format expiry as MM/YY
  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-background shadow-2xl border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>

          {/* Step indicator */}
          {step < 3 && (
            <div className="px-8 pt-8 pb-2">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    step >= 1
                      ? "bg-foreground text-background"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {step > 1 ? <Check size={14} /> : "1"}
                </div>
                <div
                  className={`h-0.5 flex-1 rounded transition-colors ${
                    step >= 2 ? "bg-foreground" : "bg-secondary"
                  }`}
                />
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    step >= 2
                      ? "bg-foreground text-background"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  2
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground px-1">
                <span>Registro</span>
                <span>Pago</span>
              </div>
            </div>
          )}

          {/* ===== STEP 1: Registration ===== */}
          {step === 1 && (
            <div className="px-8 pb-8 pt-4">
              <h2 className="text-xl font-title text-foreground mb-1">
                Crear tu cuenta
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Regístrate para completar tu reserva
              </p>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Nombre completo
                  </label>
                  <div className="relative">
                    <User
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type="text"
                      value={customer.name}
                      onChange={(e) =>
                        setCustomer({ ...customer, name: e.target.value })
                      }
                      placeholder="Juan Pérez"
                      className={`w-full rounded-xl border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-foreground/20 ${
                        errors.name ? "border-red-500" : "border-border"
                      }`}
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Número de teléfono
                  </label>
                  <div className="relative">
                    <Phone
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type="tel"
                      value={customer.phone}
                      onChange={(e) =>
                        setCustomer({ ...customer, phone: e.target.value })
                      }
                      placeholder="+1 (809) 555-0123"
                      className={`w-full rounded-xl border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-foreground/20 ${
                        errors.phone ? "border-red-500" : "border-border"
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type="email"
                      value={customer.email}
                      onChange={(e) =>
                        setCustomer({ ...customer, email: e.target.value })
                      }
                      placeholder="juan@ejemplo.com"
                      className={`w-full rounded-xl border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-foreground/20 ${
                        errors.email ? "border-red-500" : "border-border"
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Continue button */}
              <button
                type="button"
                onClick={goToStep2}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-semibold text-background transition-opacity hover:opacity-80"
              >
                Continuar al pago
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ===== STEP 2: Payment ===== */}
          {step === 2 && (
            <div className="px-8 pb-8 pt-4">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setErrors({});
                }}
                className="mb-4 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronLeft size={14} />
                Volver al registro
              </button>

              <h2 className="text-xl font-title text-foreground mb-1">
                Metodo de pago
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Elige cómo deseas pagar tu reserva
              </p>

              {/* Payment option: Full vs 20% */}
              <div className="mb-6 space-y-3">
                <p className="text-sm font-medium text-foreground mb-2">
                  Opción de pago
                </p>
                <button
                  type="button"
                  onClick={() => setPaymentOption("full")}
                  className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                    paymentOption === "full"
                      ? "border-foreground bg-foreground/5"
                      : "border-border hover:border-foreground/30"
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                      paymentOption === "full"
                        ? "border-foreground"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {paymentOption === "full" && (
                      <div className="h-2.5 w-2.5 rounded-full bg-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      Pago completo
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Paga el monto total ahora
                    </p>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    ${totalPrice.toFixed(2)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentOption("partial")}
                  className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors ${
                    paymentOption === "partial"
                      ? "border-foreground bg-foreground/5"
                      : "border-border hover:border-foreground/30"
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                      paymentOption === "partial"
                        ? "border-foreground"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {paymentOption === "partial" && (
                      <div className="h-2.5 w-2.5 rounded-full bg-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      Reserva con el 20%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Paga ${depositAmount.toFixed(2)} ahora y $
                      {remainingAmount.toFixed(2)} al llegar al rancho
                    </p>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    ${depositAmount.toFixed(2)}
                  </span>
                </button>
              </div>

              {/* Payment method tabs */}
              <div className="mb-5">
                <p className="text-sm font-medium text-foreground mb-3">
                  Método
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("card");
                      setErrors({});
                    }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-colors ${
                      paymentMethod === "card"
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    <CreditCard size={16} />
                    Tarjeta
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("paypal");
                      setErrors({});
                    }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-colors ${
                      paymentMethod === "paypal"
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    <CircleDollarSign size={16} />
                    PayPal
                  </button>
                </div>
              </div>

              {/* Card form */}
              {paymentMethod === "card" && (
                <div className="space-y-4 mb-6">
                  {/* Card number */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Número de tarjeta
                    </label>
                    <div className="relative">
                      <CreditCard
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <input
                        type="text"
                        value={card.number}
                        onChange={(e) =>
                          setCard({
                            ...card,
                            number: formatCardNumber(e.target.value),
                          })
                        }
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className={`w-full rounded-xl border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-foreground/20 ${
                          errors.cardNumber ? "border-red-500" : "border-border"
                        }`}
                      />
                    </div>
                    {errors.cardNumber && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.cardNumber}
                      </p>
                    )}
                  </div>

                  {/* Card holder name */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Nombre del titular
                    </label>
                    <div className="relative">
                      <User
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <input
                        type="text"
                        value={card.name}
                        onChange={(e) =>
                          setCard({ ...card, name: e.target.value })
                        }
                        placeholder="JUAN PÉREZ"
                        className={`w-full rounded-xl border bg-background py-3 pl-10 pr-4 text-sm uppercase text-foreground placeholder:text-muted-foreground/50 placeholder:normal-case outline-none transition-colors focus:ring-2 focus:ring-foreground/20 ${
                          errors.cardName ? "border-red-500" : "border-border"
                        }`}
                      />
                    </div>
                    {errors.cardName && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.cardName}
                      </p>
                    )}
                  </div>

                  {/* Expiry + CVC */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Expiración
                      </label>
                      <div className="relative">
                        <Calendar
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                          type="text"
                          value={card.expiry}
                          onChange={(e) =>
                            setCard({
                              ...card,
                              expiry: formatExpiry(e.target.value),
                            })
                          }
                          placeholder="MM/AA"
                          maxLength={5}
                          className={`w-full rounded-xl border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-foreground/20 ${
                            errors.cardExpiry
                              ? "border-red-500"
                              : "border-border"
                          }`}
                        />
                      </div>
                      {errors.cardExpiry && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors.cardExpiry}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">
                        CVC
                      </label>
                      <div className="relative">
                        <Lock
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                          type="text"
                          value={card.cvc}
                          onChange={(e) =>
                            setCard({
                              ...card,
                              cvc: e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 4),
                            })
                          }
                          placeholder="123"
                          maxLength={4}
                          className={`w-full rounded-xl border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-foreground/20 ${
                            errors.cardCvc ? "border-red-500" : "border-border"
                          }`}
                        />
                      </div>
                      {errors.cardCvc && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors.cardCvc}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PayPal info */}
              {paymentMethod === "paypal" && (
                <div className="mb-6 rounded-xl border border-border bg-secondary/50 p-5 text-center">
                  <CircleDollarSign
                    size={32}
                    className="mx-auto mb-2 text-foreground"
                  />
                  <p className="text-sm font-medium text-foreground">
                    Serás redirigido a PayPal
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Completa el pago de forma segura con tu cuenta de PayPal
                  </p>
                </div>
              )}

              {/* Order summary */}
              <div className="mb-6 rounded-xl border border-border bg-secondary/30 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                {paymentOption === "partial" && (
                  <>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Depósito (20%)
                      </span>
                      <span className="text-foreground">
                        ${depositAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Restante al llegar
                      </span>
                      <span className="text-muted-foreground">
                        ${remainingAmount.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
                <div className="mt-3 border-t border-border pt-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    Total a pagar ahora
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    ${amountToPay.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Pay button */}
              <button
                type="button"
                onClick={handlePay}
                disabled={isProcessing}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-semibold text-background transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    {paymentMethod === "paypal"
                      ? `Pagar con PayPal — $${amountToPay.toFixed(2)}`
                      : `Pagar $${amountToPay.toFixed(2)}`}
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Shield size={12} />
                <span>Pago seguro y encriptado</span>
              </div>
            </div>
          )}

          {/* ===== STEP 3: Confirmation ===== */}
          {step === 3 && (
            <div className="px-8 py-12 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <Check size={32} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-title text-foreground mb-2">
                Reserva confirmada!
              </h2>
              <p className="text-sm text-muted-foreground mb-2">
                Hemos enviado los detalles de tu reserva a{" "}
                <span className="font-medium text-foreground">
                  {customer.email}
                </span>
              </p>
              {paymentOption === "partial" && (
                <p className="text-sm text-muted-foreground mb-6">
                  Recuerda que debes pagar{" "}
                  <span className="font-semibold text-foreground">
                    ${remainingAmount.toFixed(2)}
                  </span>{" "}
                  al llegar al rancho.
                </p>
              )}
              <div className="rounded-xl border border-border bg-secondary/30 p-4 mb-6 text-left">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  Resumen
                </p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cliente</span>
                    <span className="text-foreground">{customer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total pagado</span>
                    <span className="font-semibold text-foreground">
                      ${amountToPay.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Método</span>
                    <span className="text-foreground capitalize">
                      {paymentMethod === "card" ? "Tarjeta" : "PayPal"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Artículos</span>
                    <span className="text-foreground">{items.length}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleFinish}
                className="w-full rounded-full bg-foreground py-3.5 text-sm font-semibold text-background transition-opacity hover:opacity-80"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
