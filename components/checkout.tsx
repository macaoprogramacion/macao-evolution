"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useCart } from "@/context/cart-context";
import { products } from "@/lib/products";
import { supabase } from "@/lib/supabase";
import { getCustomerProfile, getCustomerById, upsertCustomerProfile } from "@/lib/customer-accounts";
import { saveCustomerReservation } from "@/lib/customer-reservations";
import { getCustomerSession } from "@/lib/customer-session";
import {
  X,
  CreditCard,
  User,
  Phone,
  Mail,
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
  Zap,
  ShoppingCart,
  Star,
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

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
const PAYPAL_OPTIONS = {
  clientId: PAYPAL_CLIENT_ID,
  currency: "USD",
  intent: "capture",
  enableFunding: "card",
  disableFunding: "paylater,venmo",
  locale: "es_DO",
};

const DEFAULT_TIMES = [
  { id: 0, label: "Mañana", time: "8:00 AM", hour: 8, minute: 0 },
  { id: 1, label: "Media mañana", time: "11:00 AM", hour: 11, minute: 0 },
  { id: 2, label: "Tarde", time: "2:00 PM", hour: 14, minute: 0 },
];

const RANCHO_LOCATION_URL = "https://maps.app.goo.gl/nmR4UFPbrDSDA1FF6";
const SELF_PICKUP_LABEL = "Llegar por mi cuenta";
const WEB_BOOKING_TAG = "[WEB_BOOKING]";

function getOperationTurnFromSlot(slotId: number | null) {
  if (slotId === 1) return "11 AM";
  if (slotId === 2) return "3 PM";
  return "8 AM";
}

interface HotelSchedule {
  turns: { id: number; label: string; time: string; hour: number; minute: number }[];
  pickup: string;
}

function makeSchedule(t1: string, t2: string, t3: string, pickup: string): HotelSchedule {
  function parse(t: string) {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return { hour: h, minute: m, time: `${h12}:${String(m).padStart(2, "0")} ${ampm}` };
  }
  const p1 = parse(t1), p2 = parse(t2), p3 = parse(t3);
  return {
    turns: [
      { id: 0, label: "Turno 1", ...p1 },
      { id: 1, label: "Turno 2", ...p2 },
      { id: 2, label: "Turno 3", ...p3 },
    ],
    pickup,
  };
}

const HOTEL_SCHEDULES: Record<string, HotelSchedule> = {
  // Uvero Alto
  "PLAYA PALMERA": makeSchedule("08:30", "11:30", "14:30", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "FINEST PUNTA CANA": makeSchedule("08:30", "11:30", "14:30", "LOBBY PRINCIPAL"),
  "EXCELLENCE EL CARMEN": makeSchedule("08:30", "11:30", "14:30", "LOBBY PRINCIPAL"),
  "BREATHLESS": makeSchedule("08:30", "11:30", "14:30", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "DREAMS ONYX": makeSchedule("08:30", "11:30", "14:30", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "LIVE AQUA": makeSchedule("08:30", "11:30", "14:30", "LOBBY PRINCIPAL"),
  "NICKELODEON": makeSchedule("08:30", "11:30", "14:30", "LOBBY PRINCIPAL"),
  "ROYALTON CHIC PUNTA CANA": makeSchedule("08:30", "11:30", "14:30", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "OCEAN EL FARO": makeSchedule("08:30", "11:30", "14:30", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "WYNDHAM ALLTRA PUNTA CANA": makeSchedule("08:30", "11:30", "14:30", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  // Arena Gorda - Bávaro
  "TROPICAL DELUXE PRINCESS": makeSchedule("08:15", "11:15", "14:15", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "WHALA URBAN": makeSchedule("07:20", "10:20", "13:20", "LOBBY PRINCIPAL"),
  "PARADISUS PUNTA CANA": makeSchedule("08:15", "11:15", "14:15", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "KARIBO PUNTA CANA": makeSchedule("07:20", "10:20", "13:20", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "PUNTA CANA PRINCESS": makeSchedule("07:25", "10:25", "13:25", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "VIK ARENA": makeSchedule("07:20", "10:20", "13:20", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "OCEAN BLUE & SANDS": makeSchedule("07:25", "10:25", "13:25", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "IBEROSTAR": makeSchedule("07:35", "10:35", "13:35", "PUERTA DE EMPLEADOS 2"),
  "COMPLEJO IBEROSTAR": makeSchedule("07:35", "10:35", "13:35", "PUERTA DE EMPLEADOS 2"),
  "RIU PALACE PUNTA CANA": makeSchedule("07:45", "10:45", "13:45", "LOBBY PRINCIPAL"),
  "COMPLEJO RIU": makeSchedule("07:50", "10:50", "13:50", "LOBBY PRINCIPAL"),
  "COMPLEJO BAHIA": makeSchedule("08:00", "11:00", "14:00", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "ROYALTON SPLASH": makeSchedule("08:05", "11:05", "14:05", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "ROYALTON PUNTA CANA": makeSchedule("08:05", "11:05", "14:05", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "OCCIDENTAL CARIBE": makeSchedule("08:05", "11:05", "14:05", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "RIU REPUBLICA": makeSchedule("08:10", "11:10", "14:10", "LOBBY PRINCIPAL"),
  "COMPLEJO MAJESTIC": makeSchedule("08:05", "11:05", "14:05", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "ROYALTON BAVARO": makeSchedule("08:05", "11:05", "14:05", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "CANA ROCK": makeSchedule("08:25", "11:10", "14:10", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "HARD ROCK": makeSchedule("08:25", "11:25", "14:25", "ESTATUA DE GUITARRA"),
  "DREAMS MACAO": makeSchedule("08:30", "11:30", "14:30", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "ZIVORY": makeSchedule("08:20", "11:20", "14:20", "LOBBY PRINCIPAL"),
  "ZOETRY": makeSchedule("08:20", "11:20", "14:20", "LOBBY PRINCIPAL"),
  "EXCELLENCE PUNTA CANA": makeSchedule("08:30", "11:30", "14:30", "LOBBY PRINCIPAL"),
  "SECRETS TIDES": makeSchedule("08:30", "11:30", "14:30", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "SIRENIS": makeSchedule("08:30", "11:30", "14:30", "FARMACIA DEL HOTEL - PUNTO DE ENCUENTRO"),
  // Bávaro - El Cortecito - Los Corales
  "LOPESAN": makeSchedule("07:30", "10:30", "13:30", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "MELIA": makeSchedule("07:35", "10:35", "13:35", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "PARADISUS CANA Y PALMA REAL": makeSchedule("07:35", "10:35", "13:35", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "DREAMS & SECRETS ROYAL BEACH": makeSchedule("07:35", "10:35", "13:35", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "PLAZA TURQUESA": makeSchedule("07:40", "10:40", "13:40", "ÁREA DE PARQUEO"),
  "LOS CORALES": makeSchedule("07:40", "10:40", "13:40", "PLAZA TURQUESA (BAM MARKET)"),
  "SOL CARIBE": makeSchedule("07:45", "09:45", "12:45", "PLAZA TURQUESA (BAM MARKET)"),
  "DUCASSI": makeSchedule("07:45", "10:45", "13:45", "PLAZA TURQUESA (BAM MARKET)"),
  "TROPICANA": makeSchedule("07:45", "10:45", "13:45", "PLAZA TURQUESA (BAM MARKET)"),
  "WHALA BAVARO": makeSchedule("07:45", "10:45", "13:45", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "HM BÁVARO": makeSchedule("07:45", "10:45", "13:45", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "IMPRESSIVE PUNTA CANA": makeSchedule("07:50", "10:50", "13:50", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "ART VILLA DOMINICANA": makeSchedule("07:50", "10:50", "13:50", "BAM MARKET"),
  "GREEN COAST AVENUE": makeSchedule("07:50", "10:50", "13:50", "LOBBY PRINCIPAL"),
  "GREEN COAST BEACH": makeSchedule("07:50", "10:50", "13:50", "LOBBY PRINCIPAL"),
  "VISTA SOL": makeSchedule("07:55", "10:55", "13:55", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "HOTEL 365": makeSchedule("07:55", "10:55", "13:55", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "COMPLEJO PALLADIUM": makeSchedule("08:00", "11:00", "14:00", "CASINO KVIAR"),
  "PALLADIUM BAVARO": makeSchedule("08:00", "11:00", "14:00", "PUNTO DE ENCUENTRO"),
  "OCCIDENTAL PUNTA CANA": makeSchedule("08:05", "11:05", "14:05", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "BAVARO PRINCESS": makeSchedule("08:10", "11:10", "14:10", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "FLAMBOYAN": makeSchedule("08:10", "11:10", "14:10", "LOBBY PRINCIPAL"),
  "G-44": makeSchedule("08:10", "11:10", "14:10", "ENTRADA"),
  "CARIBE DELUXE PRINCESS": makeSchedule("08:15", "11:15", "14:15", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  // Cap Cana y Verón
  "TORTUGA BAY": makeSchedule("06:50", "09:50", "12:50", "ESTACIÓN DE GASOLINA UNITED PETROLEUM"),
  "WESTIN PUNTA CANA": makeSchedule("06:50", "09:50", "12:50", "ESTACIÓN DE GASOLINA UNITED PETROLEUM"),
  "CLUB MED": makeSchedule("06:50", "09:50", "12:50", "ESTACIÓN DE GASOLINA UNITED PETROLEUM"),
  "SANCTUARY CAP CANA": makeSchedule("06:50", "09:50", "12:50", "ESTACIÓN DE GASOLINA UNITED PETROLEUM"),
  "DREAMS CAP CANA": makeSchedule("06:50", "09:50", "12:50", "ESTACIÓN DE GASOLINA UNITED PETROLEUM"),
  "ANCORA": makeSchedule("06:50", "09:50", "12:50", "ESTACIÓN DE GASOLINA UNITED PETROLEUM"),
  "FISHING LODGE": makeSchedule("06:50", "09:50", "12:50", "ESTACIÓN DE GASOLINA UNITED PETROLEUM"),
  "BAKOUR": makeSchedule("06:55", "09:55", "12:55", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "TRS CAP CANA": makeSchedule("06:50", "09:50", "12:50", "ESTACIÓN DE GASOLINA UNITED PETROLEUM"),
  "HYATT ZILARA & ZIVA": makeSchedule("06:50", "09:50", "12:50", "ESTACIÓN DE GASOLINA UNITED PETROLEUM"),
  "SECRET CAP CANA": makeSchedule("06:50", "09:50", "12:50", "ESTACIÓN DE GASOLINA UNITED PETROLEUM"),
  "FOUR POINTS BY SHERATON": makeSchedule("06:50", "09:50", "12:50", "ESTACIÓN DE GASOLINA UNITED PETROLEUM"),
  "DREAMS FLORA (NATURA PARK)": makeSchedule("06:55", "09:55", "12:55", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "JEWEL PALM BEACH (DREAMS P.B.)": makeSchedule("06:55", "09:55", "12:55", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "SUNSCAPE COCO": makeSchedule("07:00", "10:00", "13:00", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "RADISSON BLU": makeSchedule("07:00", "10:00", "13:00", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "SERENADE": makeSchedule("07:00", "10:00", "13:00", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "CATALONIA": makeSchedule("07:00", "10:00", "13:00", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "BOMBA TOTAL ENERGY DE COCO BONGO": makeSchedule("07:15", "10:15", "13:15", "ÁREA DE PARQUEO"),
  "VERON": makeSchedule("07:15", "10:15", "13:15", "ÁREA DE PARQUEO"),
  "AC BY MARRIOT": makeSchedule("07:20", "10:20", "13:20", "LOBBY PRINCIPAL"),
  "BARCELO BAVARO PALACE": makeSchedule("07:25", "10:25", "13:25", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "BARCELO BAVARO BEACH": makeSchedule("07:25", "10:25", "13:25", "AFUERA DEL RESORT - PUERTA PRINCIPAL"),
  "MARGARITA VILLE": makeSchedule("08:00", "11:00", "14:00", "LOBBY PRINCIPAL"),
};

const PICKUP_HOTELS = Object.keys(HOTEL_SCHEDULES).sort();

function getHotelTimes(hotel: string) {
  const schedule = HOTEL_SCHEDULES[hotel];
  return schedule ? schedule.turns : DEFAULT_TIMES;
}

function getHotelPickupPoint(hotel: string): string | null {
  return HOTEL_SCHEDULES[hotel]?.pickup ?? null;
}

function getBlockedTimeSlots(selectedDate: string, times: typeof DEFAULT_TIMES): number[] {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  if (selectedDate !== today) return [];
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const blocked: number[] = [];
  for (const slot of times) {
    if (currentHour > slot.hour || (currentHour === slot.hour && currentMinute >= slot.minute)) {
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

export function CheckoutModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { items, totalPrice, clearCart, addItem } = useCart();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: "",
    phone: "",
    email: "",
  });
  const [paymentOption, setPaymentOption] = useState<PaymentOption>("full");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerAccountId, setCustomerAccountId] = useState<string | null>(null);

  // Pickup location state
  const [pickupMode, setPickupMode] = useState<"hotel" | "custom" | "self">("hotel");
  const [pickupHotel, setPickupHotel] = useState("");
  const [pickupCustom, setPickupCustom] = useState("");
  const [pickupSearch, setPickupSearch] = useState("");
  const [isPickupDropdownOpen, setIsPickupDropdownOpen] = useState(false);
  const [pickupTimeSlot, setPickupTimeSlot] = useState<number | null>(null);
  const [pickupDate, setPickupDate] = useState("");

  async function copyToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textarea);
        return success;
      } catch {
        return false;
      }
    }
  }

  async function handleSelfPickupClick() {
    setPickupMode("self");
    setPickupHotel("");
    setPickupSearch("");
    setPickupCustom(RANCHO_LOCATION_URL);
    setPickupDate("");
    setPickupTimeSlot(null);
    setErrors({});

    const copied = await copyToClipboard(RANCHO_LOCATION_URL);
    if (copied) {
      setErrors({ pickup: "Ubicación del rancho copiada al portapapeles." });
    } else {
      setErrors({ pickup: "No se pudo copiar automáticamente. Copia este enlace: https://maps.app.goo.gl/nmR4UFPbrDSDA1FF6" });
    }
  }
  const [blockedSlots, setBlockedSlots] = useState<number[]>([]);
  const pickupDropdownRef = useRef<HTMLDivElement>(null);

  const hasPrivateTransport = items.some((item) => item.id === "private-transport");

  const activeTimes = pickupHotel ? getHotelTimes(pickupHotel) : DEFAULT_TIMES;
  const activePickupPoint = pickupHotel ? getHotelPickupPoint(pickupHotel) : null;

  // Recalculate blocked time slots when date or hotel changes
  useEffect(() => {
    if (pickupDate) {
      const times = pickupHotel ? getHotelTimes(pickupHotel) : DEFAULT_TIMES;
      const blocked = getBlockedTimeSlots(pickupDate, times);
      setBlockedSlots(blocked);
      if (pickupTimeSlot !== null && blocked.includes(pickupTimeSlot)) {
        setPickupTimeSlot(null);
      }
    }
  }, [pickupDate, pickupHotel]); // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => {
    let cancelled = false;

    async function preloadFromAccount() {
      if (!isOpen) return;
      const session = await getCustomerSession();
      if (!session || cancelled) return;

      setCustomerAccountId(session.id);

      const [account, profile] = await Promise.all([
        getCustomerById(session.id),
        getCustomerProfile(session.id),
      ]);
      if (cancelled) return;

      setCustomer((prev) => ({
        name: profile?.full_name || account?.name || session.name || prev.name,
        phone: profile?.phone || account?.phone || session.phone || prev.phone,
        email: account?.email || session.email || prev.email,
      }));

      if (profile?.last_payment_option) setPaymentOption(profile.last_payment_option);
      if (profile?.last_payment_method) setPaymentMethod(profile.last_payment_method);
      if (profile?.pickup_mode) setPickupMode(profile.pickup_mode);
      if (profile?.pickup_hotel) setPickupHotel(profile.pickup_hotel);
      if (profile?.pickup_custom) setPickupCustom(profile.pickup_custom);

      if (profile?.pickup_mode === "custom" && profile?.pickup_custom === RANCHO_LOCATION_URL) {
        setPickupMode("self");
      }
    }

    preloadFromAccount();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const depositAmount = Math.min(20, totalPrice);
  const remainingAmount = Math.max(totalPrice - depositAmount, 0);
  const amountToPay = paymentOption === "full" ? totalPrice : depositAmount;
  const pickupModeForStorage: "hotel" | "custom" = pickupMode === "hotel" ? "hotel" : "custom";
  const pickupCustomForStorage = pickupMode === "self" ? RANCHO_LOCATION_URL : pickupCustom;

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
    if (PAYPAL_CLIENT_ID) return true;
    const newErrors: Record<string, string> = {};
    newErrors.paypal = "Falta configurar PayPal. Define NEXT_PUBLIC_PAYPAL_CLIENT_ID.";
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

  async function finalizeReservation(finalPaymentMethod: PaymentMethod, paypalOrderId?: string) {
    if (!validateStep2()) return;

    setIsProcessing(true);
    try {
      const ownerEmail = customer.email.trim().toLowerCase();
      const reservationId = crypto.randomUUID();

      if (customerAccountId) {
        await upsertCustomerProfile({
          accountId: customerAccountId,
          fullName: customer.name,
          phone: customer.phone,
          paymentOption,
          paymentMethod: finalPaymentMethod,
          pickupMode: pickupModeForStorage,
          pickupHotel,
          pickupCustom: pickupCustomForStorage,
        });
      }

      if (ownerEmail) {
        await saveCustomerReservation(ownerEmail, {
          id: reservationId,
          createdAt: new Date().toISOString(),
          customer: {
            name: customer.name,
            phone: customer.phone,
            email: ownerEmail,
          },
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.image,
          })),
          totals: {
            totalPrice,
            totalPaid: amountToPay,
            remainingAmount: paymentOption === "partial" ? remainingAmount : 0,
            paymentOption,
            paymentMethod: finalPaymentMethod,
          },
          pickup: !hasPrivateTransport
            ? {
                mode: pickupModeForStorage,
                hotel: pickupHotel || undefined,
                custom: pickupCustomForStorage || undefined,
                date: pickupDate || undefined,
                time:
                  pickupTimeSlot !== null
                    ? `${activeTimes[pickupTimeSlot].time} (${activeTimes[pickupTimeSlot].label})`
                    : undefined,
                point: activePickupPoint || undefined,
              }
            : undefined,
          customerActions: {
            pickupStatus: "pending",
            reviewedProductIds: [],
            notificationsSent: {},
          },
        });
      }

      const primaryItem = items.find((item) => item.id !== "private-transport") || items[0];
      const operationPickupTime =
        pickupTimeSlot !== null
          ? `${activeTimes[pickupTimeSlot].time} (${activeTimes[pickupTimeSlot].label})`
          : "";
      const operationTimeslot = getOperationTurnFromSlot(pickupTimeSlot);
      const operationHotel = pickupHotel || (pickupMode === "self" ? "Llegada por cuenta propia" : "");
      const operationLocation =
        pickupMode === "self"
          ? RANCHO_LOCATION_URL
          : pickupMode === "custom"
          ? pickupCustomForStorage
          : "";

      try {
        const { error: operationInsertError } = await supabase.from("reservations").insert({
          customer_name: customer.name,
          phone: customer.phone || null,
          email: ownerEmail || null,
          hotel: operationHotel || null,
          location: operationLocation || null,
          timeslot: operationTimeslot,
          guests: Math.max(
            1,
            items
              .filter((item) => item.id !== "private-transport")
              .reduce((sum, item) => sum + Math.max(1, Number(item.quantity || 1)), 0),
          ),
          children: 0,
          pickup_time: operationPickupTime || null,
          pickup_point: activePickupPoint || "lobby",
          transport_type: hasPrivateTransport ? "self" : "included",
          experience: primaryItem?.name || "Reserva Web",
          channel: "website",
          channel_url: "web-checkout",
          channel_color: "#dc2626",
          date: pickupDate || new Date().toISOString().slice(0, 10),
          amount: totalPrice,
          status: "pending",
          notes: `${WEB_BOOKING_TAG} Reserva creada desde checkout web`,
        });

        if (operationInsertError) {
          console.error("Error creando reserva en operación:", operationInsertError);
        }
      } catch (operationInsertCrash) {
        console.error("Error inesperado insertando reserva en operación:", operationInsertCrash);
      }

      setStep(4);

      // Send confirmation email
      try {
        await fetch("/api/send-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer,
            items: items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
            totalPaid: amountToPay,
            totalPrice,
            paymentMethod: finalPaymentMethod,
            paymentOption,
            remainingAmount: paymentOption === "partial" ? remainingAmount : undefined,
            paypalOrderId,
            pickup: !hasPrivateTransport
              ? {
                  hotel: pickupHotel || undefined,
                  custom: pickupCustomForStorage || undefined,
                  date: pickupDate ? formatDateDisplay(pickupDate) : undefined,
                  time: pickupTimeSlot !== null ? `${activeTimes[pickupTimeSlot].time} (${activeTimes[pickupTimeSlot].label})` : undefined,
                  point: activePickupPoint || undefined,
                }
              : undefined,
          }),
        });
      } catch {
        // Email sending failed silently — reservation is still confirmed
      }

      setErrors({});
    } catch (error) {
      console.error("Error finalizando reserva:", error);
      setErrors({ paypal: "No pudimos completar tu pago. Intenta nuevamente." });
    } finally {
      setIsProcessing(false);
    }
  }

  async function createPayPalOrder() {
    if (!validateStep2()) {
      throw new Error("PayPal no configurado");
    }

    const response = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amountToPay,
        currency: "USD",
        description: `Reserva Macao Evolution (${paymentOption === "full" ? "pago completo" : "reserva $20"})`,
      }),
    });

    const payload = await response.json();
    if (!response.ok || !payload?.id) {
      throw new Error(payload?.error || "No se pudo crear la orden en PayPal");
    }

    return payload.id as string;
  }

  async function capturePayPalOrder(orderId: string, method: PaymentMethod) {
    const response = await fetch("/api/paypal/capture-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error || "No se pudo capturar el pago");
    }

    await finalizeReservation(method, payload?.orderId || orderId);
  }

  function handleFinish() {
    clearCart();
    setStep(1);
    setCustomer({ name: "", phone: "", email: "" });
    setPaymentOption("full");
    setPaymentMethod("card");
    setPickupMode("hotel");
    setPickupHotel("");
    setPickupCustom("");
    setPickupSearch("");
    setPickupTimeSlot(null);
    setPickupDate("");
    setErrors({});
    setCustomerAccountId(null);
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
                <span>Datos</span>
                {!hasPrivateTransport && <span>Recogida</span>}
                <span>Pago</span>
              </div>
            </div>
          )}

          {/* ===== STEP 1: Registration ===== */}
          {step === 1 && (
            <div className="px-8 pb-8 pt-4">
              <h2 className="text-xl font-title text-foreground mb-1">
                Tus datos
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Completa tu información para continuar
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
                ¿Donde te recogemos?
              </h2>
              <p className="text-sm text-muted-foreground mb-6 text-center">
                Indica el lugar, fecha y horario para tu aventura
              </p>

              {/* Toggle hotel / custom */}
              <div className="grid grid-cols-3 gap-2 mb-5">
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
                <button
                  type="button"
                  onClick={() => {
                    void handleSelfPickupClick();
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-colors ${
                    pickupMode === "self"
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-foreground hover:bg-secondary"
                  }`}
                >
                  <Navigation size={16} />
                  Llegar por mi cuenta
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
                              setPickupTimeSlot(null);
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
                  {pickupHotel && activePickupPoint && (
                    <div className="mt-2 flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3 py-2">
                      <Navigation size={13} className="text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400">Punto de recogida</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">{activePickupPoint}</p>
                      </div>
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
                <p className={`mb-4 text-xs text-center ${pickupMode === "self" ? "text-green-600" : "text-red-500"}`}>{errors.pickup}</p>
              )}

              {/* === PROGRESSIVE: Date picker (appears after location selected) === */}
              {(pickupHotel || pickupCustom || pickupMode === "self") && (
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
              {(pickupHotel || pickupCustom || pickupMode === "self") && pickupDate && (
                <div className="mb-5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="h-px bg-border mb-4" />
                  <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Clock size={14} />
                    Horario de recogida
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {activeTimes.map((slot) => {
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

              {/* Payment option: Full vs $20 */}
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
                      Reserva con $20
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
                <div className="rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm text-foreground text-center">
                  PayPal (cuenta o tarjeta)
                </div>
              </div>

              <div className="mb-6 rounded-xl border border-border bg-secondary/50 p-5">
                {!PAYPAL_CLIENT_ID ? (
                  <p className="text-sm text-red-500">
                    Falta configurar PayPal. Define NEXT_PUBLIC_PAYPAL_CLIENT_ID para habilitar los pagos.
                  </p>
                ) : (
                  <PayPalScriptProvider options={PAYPAL_OPTIONS}>
                    <p className="mb-3 text-xs text-muted-foreground text-center">
                      Paga con tu cuenta PayPal o con tarjeta sin crear cuenta.
                    </p>
                    <PayPalButtons
                      style={{ layout: "vertical", shape: "pill", label: "pay" }}
                      disabled={isProcessing}
                      forceReRender={[amountToPay]}
                      createOrder={async () => createPayPalOrder()}
                      onApprove={async (data) => {
                        if (!data.orderID) throw new Error("Orden de PayPal inválida");
                        await capturePayPalOrder(data.orderID, "paypal");
                      }}
                      onError={(error) => {
                        console.error("PayPal checkout error:", error);
                        setErrors({ paypal: "No se pudo completar el pago. Intenta de nuevo." });
                      }}
                    />
                  </PayPalScriptProvider>
                )}

                {errors.paypal && (
                  <p className="mt-3 text-xs text-red-500 text-center">{errors.paypal}</p>
                )}
              </div>

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
                        Depósito ($20)
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

              {/* Upsell / Recommendations */}
              <ConfirmationUpsell
                hasPrivateTransport={hasPrivateTransport}
                cartItems={items}
                addItem={addItem}
              />

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
                    <span className="text-foreground">PayPal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Artículos</span>
                    <span className="text-foreground">{items.length}</span>
                  </div>
                  {!hasPrivateTransport && (pickupHotel || pickupCustom || pickupMode === "self") && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Recogida</span>
                        <span className="text-foreground text-right max-w-[60%]">
                          {pickupMode === "self" ? SELF_PICKUP_LABEL : (pickupHotel || pickupCustom)}
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
                            {activeTimes[pickupTimeSlot].time} ({activeTimes[pickupTimeSlot].label})
                          </span>
                        </div>
                      )}
                      {activePickupPoint && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Punto</span>
                          <span className="text-foreground text-right max-w-[60%] text-xs">
                            {activePickupPoint}
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

/* ─── Upsell / Recommendations after confirmation ─── */

function hashSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function ConfirmationUpsell({
  hasPrivateTransport,
  cartItems,
  addItem,
}: {
  hasPrivateTransport: boolean;
  cartItems: { id: string; name: string }[];
  addItem: (item: { id: string; name: string; price: number; originalPrice?: number; image: string; type: "service" | "product" }) => void;
}) {
  const [added, setAdded] = useState(false);
  const [addingFlashOffer, setAddingFlashOffer] = useState(false);

  const cartSignature = useMemo(
    () => cartItems.map((i) => i.id).sort().join("|"),
    [cartItems]
  );

  const recommendations = useMemo(() => {
    const cartIds = new Set(cartItems.map((i) => i.id));
    const available = products.filter((p) => !cartIds.has(p.id));
    if (available.length <= 2) return available;

    // Deterministic ranking prevents UI from changing on every keystroke.
    const seed = hashSeed(cartSignature || "default");
    return [...available]
      .map((p, index) => ({
        product: p,
        score: hashSeed(`${seed}-${p.id}-${index}`),
      }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 2)
      .map((entry) => entry.product);
  }, [cartItems, cartSignature]);

  // Get the main activity name (the service, not products/transport)
  const mainActivity = cartItems.find(
    (i) => i.id === "service-horseback-ride" || i.id === "service-dune-buggy"
  )?.name || "esta experiencia";

  const hasTransportInCart = cartItems.some((item) => item.id === "private-transport");
  const shouldShowFlashOffer = !hasPrivateTransport && !hasTransportInCart && !added;
  const shouldShowFlashSuccess = !hasPrivateTransport && (hasTransportInCart || added);

  // If no private transport → flash offer
  if (shouldShowFlashOffer) {
    const originalPrice = 75;
    const discountedPrice = originalPrice * 0.8;

    return (
      <div className="mb-6 rounded-xl border-2 border-amber-400/60 bg-amber-50/80 dark:bg-amber-950/20 p-4 text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-amber-400 text-amber-950 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
          <Zap size={10} className="inline mr-1" />
          Oferta flash
        </div>
        <div className="flex gap-3 items-start mt-2">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
            <Image
              src="/images/service-section/private-transportation.webp"
              alt="Transporte Privado"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Transporte Privado</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ida y vuelta desde tu hotel directo a la aventura
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground line-through">${originalPrice.toFixed(2)}</span>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">${discountedPrice.toFixed(2)}</span>
              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-200/50 dark:bg-amber-800/30 px-1.5 py-0.5 rounded-full">FLASH</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (addingFlashOffer || hasTransportInCart) return;
            setAddingFlashOffer(true);
            try {
              addItem({
                id: "private-transport",
                name: "Private Transport — Oferta Flash",
                price: discountedPrice,
                originalPrice,
                image: "/images/service-section/private-transportation.webp",
                type: "service",
              });
              setAdded(true);
            } finally {
              setAddingFlashOffer(false);
            }
          }}
          disabled={addingFlashOffer}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 hover:bg-amber-600 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          <ShoppingCart size={14} />
          {addingFlashOffer ? "Agregando..." : "Agregar a mi reserva"}
        </button>
      </div>
    );
  }

  // If added the flash offer, show success
  if (shouldShowFlashSuccess) {
    return (
      <div className="mb-6 rounded-xl border border-green-300/50 bg-green-50/80 dark:bg-green-950/20 p-4 text-center">
        <Check size={20} className="mx-auto text-green-500 mb-1" />
        <p className="text-sm font-medium text-green-700 dark:text-green-400">
          Transporte privado agregado con oferta flash
        </p>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="mb-6 text-left">
      <div className="flex items-center gap-2 mb-3">
        <Star size={14} className="text-amber-500" />
        <p className="text-xs font-medium text-muted-foreground">
          Clientes que compraron <span className="text-foreground font-semibold">{mainActivity}</span> también reservaron
        </p>
      </div>
      <div className="space-y-2">
        {recommendations.map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3"
          >
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
              <Image
                src={product.image}
                alt={product.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{product.title}</p>
              <p className="text-xs text-muted-foreground">${product.price.toFixed(2)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                addItem({
                  id: product.id,
                  name: product.title,
                  price: product.price,
                  originalPrice: product.originalPrice,
                  image: product.image,
                  type: "product",
                });
              }}
              className="flex-shrink-0 rounded-full bg-foreground/10 hover:bg-foreground/20 p-2 transition-colors"
            >
              <ShoppingCart size={14} className="text-foreground" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
