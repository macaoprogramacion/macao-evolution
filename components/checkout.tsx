"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useCart } from "@/context/cart-context";
import {
  X,
  CreditCard,
  User,
  Phone,
  Mail,
  Lock,
  ChevronRight,
  ChevronLeft,
  Check,
  Shield,
  CircleDollarSign,
  MapPin,
  Search,
  Hotel,
  PenLine,
  Navigation,
  Clock,
  CalendarDays,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

const PickupMap = dynamic(() => import("@/components/pickup-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[220px] rounded-xl border border-border bg-secondary/50 flex items-center justify-center">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
    </div>
  ),
});

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

const PICKUP_TIMES = [
  { id: 0, label: "Mañana", time: "8:00 AM", hour: 8 },
  { id: 1, label: "Media mañana", time: "11:00 AM", hour: 11 },
  { id: 2, label: "Tarde", time: "2:00 PM", hour: 14 },
];

function getBlockedTimeSlots(selectedDate: string): number[] {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  // Only block time slots if the selected date is today
  if (selectedDate !== today) return [];
  const currentHour = now.getHours();
  const blocked: number[] = [];
  for (const slot of PICKUP_TIMES) {
    if (currentHour >= slot.hour) {
      blocked.push(slot.id);
    }
  }
  return blocked;
}

function isTodayBlocked(): boolean {
  const now = new Date();
  return now.getHours() >= 14;
}

function getMinDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (isTodayBlocked()) d.setDate(d.getDate() + 1);
  return d;
}

function getMaxDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateDisplay(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

const PICKUP_HOTELS = [
  "SANCTUARY CAP CANA", "MARGARITA VILLE", "ANCORA", "FISHING LODGE",
  "TRS CAP CANA", "HYATT ZILARA & ZIVA", "SECRET CAP CANA",
  "FOUR POINTS BY SHERATON", "DREAMS FLORA (NATURA PARK)",
  "TORTUGA BAY", "WESTIN PUNTA CANA", "CLUB MED",
  "JEWEL PALM BEACH (DREAMS P.B.)", "SUNSCAPE COCO", "RADISSON BLU",
  "SERENADE", "CATALONIA", "WHALA URBAN",
  "AC BY MARRIOT", "KARIBO PUNTA CANA", "VIK ARENA",
  "BARCELO BAVARO PALACE", "BARCELO BAVARO BEACH",
  "OCEAN BLUE & SANDS", "LOPESAN", "MELIA",
  "PARADISUS CANA Y PALMA REAL", "DREAMS & SECRETS ROYAL BEACH",
  "COMPLEJO IBEROSTAR", "LOS CORALES", "DUCASSI", "TROPICANA",
  "WHALA BAVARO", "RIU PALACE PUNTA CANA", "IMPRESSIVE PUNTA CANA",
  "COMPLEJO RIU", "VISTA SOL", "COMPLEJO PALLADIUM",
  "PALLADIUM BAVARO", "COMPLEJO BAHIA", "OCCIDENTAL PUNTA CANA",
  "ROYALTON PUNTA CANA", "OCCIDENTAL CARIBE", "COMPLEJO MAJESTIC",
  "ROYALTON BAVARO", "BAVARO PRINCESS", "RIU REPUBLICA",
  "CARIBE DELUXE PRINCESS", "TROPICAL DELUXE PRINCESS",
  "PARADISUS PUNTA CANA", "PUNTA CANA PRINCESS",
  "HARD ROCK", "DREAMS MACAO", "EXCELLENCE PUNTA CANA",
  "SIRENIS", "FINEST PUNTA CANA", "EXCELLENCE EL CARMEN",
  "BREATHLESS", "DREAMS ONYX", "LIVE AQUA",
  "NICKELODEON", "ROYALTON CHIC PUNTA CANA", "OCEAN EL FARO",
];

export function CheckoutModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { items, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
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

  // Pickup location state
  const [pickupMode, setPickupMode] = useState<"hotel" | "custom">("hotel");
  const [pickupHotel, setPickupHotel] = useState("");
  const [pickupCustom, setPickupCustom] = useState("");
  const [pickupSearch, setPickupSearch] = useState("");
  const [isPickupDropdownOpen, setIsPickupDropdownOpen] = useState(false);
  const [pickupTimeSlot, setPickupTimeSlot] = useState<number | null>(null);
  const [pickupDate, setPickupDate] = useState("");
  const [blockedSlots, setBlockedSlots] = useState<number[]>([]);
  const pickupDropdownRef = useRef<HTMLDivElement>(null);

  const hasPrivateTransport = items.some((item) => item.id === "private-transport");

  // Recalculate blocked time slots when date changes
  useEffect(() => {
    if (pickupDate) {
      const blocked = getBlockedTimeSlots(pickupDate);
      setBlockedSlots(blocked);
      if (pickupTimeSlot !== null && blocked.includes(pickupTimeSlot)) {
        setPickupTimeSlot(null);
      }
    }
  }, [pickupDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredPickupHotels = useMemo(() => {
    if (!pickupSearch.trim()) return PICKUP_HOTELS;
    const q = pickupSearch.toLowerCase();
    return PICKUP_HOTELS.filter((h) => h.toLowerCase().includes(q));
  }, [pickupSearch]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickupDropdownRef.current && !pickupDropdownRef.current.contains(e.target as Node)) {
        setIsPickupDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
    if (validateStep1()) {
      if (hasPrivateTransport) {
        setStep(3);
      } else {
        setStep(2);
      }
    }
  }

  function handlePay() {
    if (!validateStep2()) return;
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setStep(4);
    }, 2000);
  }

  function handleFinish() {
    clearCart();
    setStep(1);
    setCustomer({ name: "", phone: "", email: "" });
    setCard({ number: "", name: "", expiry: "", cvc: "" });
    setPaymentOption("full");
    setPaymentMethod("card");
    setPickupMode("hotel");
    setPickupHotel("");
    setPickupCustom("");
    setPickupSearch("");
    setPickupTimeSlot(null);
    setPickupDate("");
    setErrors({});
    onClose();
  }

  function handlePickupConfirm() {
    const newErrors: Record<string, string> = {};
    if (pickupMode === "hotel" && !pickupHotel) {
      newErrors.pickup = "Selecciona tu hotel";
    }
    if (pickupMode === "custom" && !pickupCustom.trim()) {
      newErrors.pickup = "Selecciona tu ubicación en el mapa";
    }
    if (!pickupDate) {
      newErrors.pickupDate = "Selecciona la fecha del tour";
    }
    if (pickupTimeSlot === null) {
      newErrors.pickupTime = "Selecciona un horario de recogida";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setStep(3);
    }
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
          {step < 4 && (
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
                {!hasPrivateTransport && (
                  <>
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
                      {step > 2 ? <Check size={14} /> : "2"}
                    </div>
                  </>
                )}
                <div
                  className={`h-0.5 flex-1 rounded transition-colors ${
                    step >= 3 ? "bg-foreground" : "bg-secondary"
                  }`}
                />
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    step >= 3
                      ? "bg-foreground text-background"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {hasPrivateTransport ? "2" : "3"}
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground px-1">
                <span>Registro</span>
                {!hasPrivateTransport && <span>Recogida</span>}
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
                Continuar
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ===== STEP 2: Pickup Location (skipped if private-transport in cart) ===== */}
          {step === 2 && !hasPrivateTransport && (
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

              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-foreground/10">
                <MapPin size={24} className="text-foreground" />
              </div>
              <h2 className="text-xl font-title text-foreground mb-1 text-center">
                ¿Dónde te recogemos?
              </h2>
              <p className="text-sm text-muted-foreground mb-6 text-center">
                Indica el lugar, fecha y horario para tu aventura
              </p>

              {/* Toggle hotel / custom */}
              <div className="flex gap-2 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setPickupMode("hotel");
                    setPickupCustom("");
                    setPickupDate("");
                    setPickupTimeSlot(null);
                    setErrors({});
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-colors ${
                    pickupMode === "hotel"
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-foreground hover:bg-secondary"
                  }`}
                >
                  <Hotel size={16} />
                  Mi hotel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPickupMode("custom");
                    setPickupHotel("");
                    setPickupSearch("");
                    setPickupDate("");
                    setPickupTimeSlot(null);
                    setErrors({});
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-colors ${
                    pickupMode === "custom"
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-foreground hover:bg-secondary"
                  }`}
                >
                  <PenLine size={16} />
                  Otra ubicación
                </button>
              </div>

              {/* Hotel search */}
              {pickupMode === "hotel" && (
                <div className="mb-4" ref={pickupDropdownRef}>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Busca tu hotel
                  </label>
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type="text"
                      value={pickupSearch}
                      onChange={(e) => {
                        setPickupSearch(e.target.value);
                        setIsPickupDropdownOpen(true);
                        setPickupHotel("");
                        setPickupDate("");
                        setPickupTimeSlot(null);
                      }}
                      onFocus={() => setIsPickupDropdownOpen(true)}
                      placeholder="Ej: Barceló, Hard Rock, RIU..."
                      className={`w-full rounded-xl border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-foreground/20 ${
                        errors.pickup ? "border-red-500" : "border-border"
                      }`}
                    />
                  </div>
                  {isPickupDropdownOpen && (
                    <div className="mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-background shadow-lg">
                      {filteredPickupHotels.length === 0 ? (
                        <p className="p-3 text-sm text-muted-foreground text-center">
                          No se encontró el hotel
                        </p>
                      ) : (
                        filteredPickupHotels.map((hotel) => (
                          <button
                            key={hotel}
                            type="button"
                            onClick={() => {
                              setPickupHotel(hotel);
                              setPickupSearch(hotel);
                              setIsPickupDropdownOpen(false);
                              setErrors({});
                            }}
                            className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-secondary ${
                              pickupHotel === hotel
                                ? "bg-foreground/5 font-medium text-foreground"
                                : "text-foreground"
                            }`}
                          >
                            <Hotel size={14} className="text-muted-foreground shrink-0" />
                            {hotel}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  {pickupHotel && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-foreground/20 bg-foreground/5 px-3 py-2">
                      <Check size={14} className="text-green-500" />
                      <span className="text-sm text-foreground font-medium">{pickupHotel}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Custom location with map */}
              {pickupMode === "custom" && (
                <div className="mb-4">
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Selecciona tu ubicación en el mapa
                  </label>
                  <PickupMap
                    onLocationSelect={(_lat, _lng, address) => {
                      setPickupCustom(address);
                      setPickupDate("");
                      setPickupTimeSlot(null);
                      setErrors({});
                    }}
                    selectedAddress={pickupCustom}
                  />
                </div>
              )}

              {errors.pickup && (
                <p className="mb-4 text-xs text-red-500 text-center">{errors.pickup}</p>
              )}

              {/* === PROGRESSIVE: Date picker (appears after location selected) === */}
              {(pickupHotel || pickupCustom) && (
                <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="h-px bg-border mb-4" />
                  <label className="mb-3 flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <CalendarDays size={14} />
                    ¿Qué día deseas realizar el tour?
                  </label>
                  <div className={`flex justify-center rounded-xl border p-2 transition-colors ${
                    errors.pickupDate ? "border-red-500" : "border-border"
                  }`}>
                    <Calendar
                      mode="single"
                      selected={pickupDate ? new Date(pickupDate + "T12:00:00") : undefined}
                      onSelect={(date: Date | undefined) => {
                        if (date) {
                          const iso = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
                          setPickupDate(iso);
                        } else {
                          setPickupDate("");
                        }
                        setPickupTimeSlot(null);
                        setErrors({});
                      }}
                      disabled={[
                        { before: getMinDate() },
                        { after: getMaxDate() },
                      ]}
                      defaultMonth={getMinDate()}
                      className="w-full"
                    />
                  </div>
                  {pickupDate && (
                    <p className="mt-2 text-xs text-muted-foreground capitalize text-center">
                      {formatDateDisplay(pickupDate)}
                    </p>
                  )}
                  {errors.pickupDate && (
                    <p className="mt-1 text-xs text-red-500 text-center">{errors.pickupDate}</p>
                  )}
                </div>
              )}

              {/* === PROGRESSIVE: Time slot (appears after date selected) === */}
              {(pickupHotel || pickupCustom) && pickupDate && (
                <div className="mb-5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="h-px bg-border mb-4" />
                  <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Clock size={14} />
                    Horario de recogida
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PICKUP_TIMES.map((slot) => {
                      const isBlocked = blockedSlots.includes(slot.id);
                      const isSelected = pickupTimeSlot === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={isBlocked}
                          onClick={() => {
                            setPickupTimeSlot(slot.id);
                            setErrors({});
                          }}
                          className={`relative rounded-xl border py-3 px-2 text-center transition-colors ${
                            isBlocked
                              ? "border-border bg-secondary/50 text-muted-foreground/40 cursor-not-allowed line-through"
                              : isSelected
                              ? "border-foreground bg-foreground text-background"
                              : "border-border text-foreground hover:bg-secondary"
                          }`}
                        >
                          <p className="text-sm font-semibold">{slot.time}</p>
                          <p className={`text-[10px] mt-0.5 ${
                            isBlocked ? "text-muted-foreground/30" : isSelected ? "text-background/70" : "text-muted-foreground"
                          }`}>{slot.label}</p>
                          {isBlocked && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                              ✕
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {blockedSlots.length > 0 && (
                    <p className="mt-2 text-[11px] text-muted-foreground text-center">
                      Los horarios que ya pasaron no están disponibles
                    </p>
                  )}
                  {errors.pickupTime && (
                    <p className="mt-2 text-xs text-red-500 text-center">{errors.pickupTime}</p>
                  )}
                </div>
              )}

              {/* Confirm button */}
              <button
                type="button"
                onClick={handlePickupConfirm}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-semibold text-background transition-opacity hover:opacity-80"
              >
                Continuar al pago
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ===== STEP 3: Payment ===== */}
          {step === 3 && (
            <div className="px-8 pb-8 pt-4">
              <button
                type="button"
                onClick={() => {
                  if (hasPrivateTransport) {
                    setStep(1);
                  } else {
                    setStep(2);
                  }
                  setErrors({});
                }}
                className="mb-4 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronLeft size={14} />
                {hasPrivateTransport ? "Volver al registro" : "Volver a recogida"}
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
                        <CalendarIcon
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

          {/* ===== STEP 4: Confirmation ===== */}
          {step === 4 && (
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
                  {!hasPrivateTransport && (pickupHotel || pickupCustom) && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Recogida</span>
                        <span className="text-foreground text-right max-w-[60%]">
                          {pickupHotel || pickupCustom}
                        </span>
                      </div>
                      {pickupDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Fecha</span>
                          <span className="text-foreground capitalize">
                            {formatDateDisplay(pickupDate)}
                          </span>
                        </div>
                      )}
                      {pickupTimeSlot !== null && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Horario</span>
                          <span className="text-foreground">
                            {PICKUP_TIMES[pickupTimeSlot].time} ({PICKUP_TIMES[pickupTimeSlot].label})
                          </span>
                        </div>
                      )}
                    </>
                  )}
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
