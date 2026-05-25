import { supabase } from "@/lib/supabase";

export type PaymentOption = "full" | "partial";
export type PaymentMethod = "card" | "paypal";
export type PickupStatus = "pending" | "picked_up" | "driver_absent";

export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
}

export interface ReservationLineItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

export interface StoredCustomerReservation {
  id: string;
  createdAt: string;
  cancelledAt?: string;
  customer: CustomerInfo;
  items: ReservationLineItem[];
  totals: {
    totalPrice: number;
    totalPaid: number;
    remainingAmount: number;
    paymentOption: PaymentOption;
    paymentMethod: PaymentMethod;
  };
  pickup?: {
    mode: "hotel" | "custom";
    hotel?: string;
    custom?: string;
    date?: string;
    time?: string;
    point?: string;
  };
  customerActions?: {
    pickupStatus?: PickupStatus;
    pickupRespondedAt?: string;
    reviewedProductIds?: string[];
    notificationsSent?: {
      dayBefore?: string;   // ISO timestamp of when sent
      oneHour?: string;     // ISO timestamp of when sent
    };
  };
}

const NON_REVIEWABLE_ITEM_IDS = ["service-horseback-ride", "service-dune-buggy", "private-transport"];

export async function loadCustomerReservations(ownerEmail: string): Promise<StoredCustomerReservation[]> {
  const email = ownerEmail.trim().toLowerCase();
  if (!email) return [];

  const { data, error } = await supabase
    .from("customer_reservations_app")
    .select("payload")
    .eq("owner_email", email)
    .order("created_at", { ascending: false });

  if (error || !Array.isArray(data)) return [];

  return data
    .map((row) => row.payload as StoredCustomerReservation)
    .filter((value) => !!value?.id);
}

export async function saveCustomerReservation(ownerEmail: string, reservation: StoredCustomerReservation) {
  const email = ownerEmail.trim().toLowerCase();
  if (!email) return;

  const { error } = await supabase.from("customer_reservations_app").insert({
    owner_email: email,
    reservation_id: reservation.id,
    payload: reservation,
  });

  if (error) {
    console.error("Error saving customer reservation:", error);
  }
}

export async function updateCustomerReservation(
  ownerEmail: string,
  reservationId: string,
  updater: (reservation: StoredCustomerReservation) => StoredCustomerReservation,
) {
  const email = ownerEmail.trim().toLowerCase();
  if (!email) return;

  const { data, error } = await supabase
    .from("customer_reservations_app")
    .select("id, payload")
    .eq("owner_email", email)
    .eq("reservation_id", reservationId)
    .maybeSingle();

  if (error || !data?.id || !data.payload) return;

  const updatedPayload = updater(data.payload as StoredCustomerReservation);
  const { error: updateError } = await supabase
    .from("customer_reservations_app")
    .update({ payload: updatedPayload, updated_at: new Date().toISOString() })
    .eq("id", data.id);

  if (updateError) {
    console.error("Error updating customer reservation:", updateError);
  }
}

export async function cancelCustomerReservation(ownerEmail: string, reservationId: string) {
  await updateCustomerReservation(ownerEmail, reservationId, (r) => ({
    ...r,
    cancelledAt: new Date().toISOString(),
  }));
}

/** Returns true if the reservation can still be cancelled (>24 h before pickup). */
export function canCancelReservation(reservation: StoredCustomerReservation, now = new Date()) {
  if (reservation.cancelledAt) return false;
  const pickupAt = getReservationPickupDateTime(reservation);
  if (!pickupAt) return true; // no pickup date yet → still cancellable
  const deadline = new Date(pickupAt.getTime() - 24 * 60 * 60 * 1000);
  return now < deadline;
}

function parsePickupTime(timeLabel?: string) {
  if (!timeLabel) return null;

  const match = timeLabel.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase();

  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return { hours, minutes };
}

export function getReservationPickupDateTime(reservation: StoredCustomerReservation) {
  const pickupDate = reservation.pickup?.date;
  if (!pickupDate) return null;

  const parsedTime = parsePickupTime(reservation.pickup?.time);
  const pickupAt = new Date(`${pickupDate}T12:00:00`);
  if (Number.isNaN(pickupAt.getTime())) return null;

  pickupAt.setHours(parsedTime?.hours ?? 12, parsedTime?.minutes ?? 0, 0, 0);
  return pickupAt;
}

export function getReservationReviewReadyAt(reservation: StoredCustomerReservation) {
  const pickupAt = getReservationPickupDateTime(reservation);
  if (!pickupAt) return null;

  return new Date(pickupAt.getTime() + 4 * 60 * 60 * 1000);
}

export function getReviewableItems(reservation: StoredCustomerReservation) {
  return reservation.items.filter((item) => !NON_REVIEWABLE_ITEM_IDS.includes(item.id));
}

export function hasReviewedProduct(reservation: StoredCustomerReservation, productId: string) {
  return reservation.customerActions?.reviewedProductIds?.includes(productId) ?? false;
}

export function getReservationTimelineStatus(reservation: StoredCustomerReservation, now = new Date()) {
  const pickupAt = getReservationPickupDateTime(reservation);
  const reviewReadyAt = getReservationReviewReadyAt(reservation);
  const pickupStatus = reservation.customerActions?.pickupStatus ?? "pending";
  const reviewableItems = getReviewableItems(reservation);
  const reviewedCount = reviewableItems.filter((item) => hasReviewedProduct(reservation, item.id)).length;
  const allProductsReviewed = reviewableItems.length > 0 && reviewedCount === reviewableItems.length;

  if (reservation.cancelledAt) {
    return {
      code: "cancelled",
      label: "Reserva cancelada",
      description: "Esta reserva fue cancelada. Contáctanos si necesitas ayuda con el reembolso.",
      showPickupActions: false,
      showReviewPrompt: false,
      pickupAt,
      reviewReadyAt,
    };
  }

  if (!pickupAt) {
    return {
      code: "confirmed",
      label: "Reserva confirmada",
      description: "Tu reserva está guardada. Aquí verás novedades cuando se actualice el tour.",
      showPickupActions: false,
      showReviewPrompt: false,
      pickupAt: null as Date | null,
      reviewReadyAt: null as Date | null,
    };
  }

  const oneHourBeforePickup = new Date(pickupAt.getTime() - 60 * 60 * 1000);

  if (pickupStatus === "driver_absent") {
    return {
      code: "driver_absent",
      label: "Chofer no se presentó",
      description: "Reportaste que el chofer no llegó al punto de recogida. Nuestro equipo debe darte seguimiento.",
      showPickupActions: false,
      showReviewPrompt: false,
      pickupAt,
      reviewReadyAt,
    };
  }

  if (now < oneHourBeforePickup) {
    return {
      code: "scheduled",
      label: "Reserva programada",
      description: "Tu experiencia sigue programada. Volveremos a avisarte una hora antes de la recogida.",
      showPickupActions: false,
      showReviewPrompt: false,
      pickupAt,
      reviewReadyAt,
    };
  }

  if (now >= oneHourBeforePickup && now < pickupAt) {
    return {
      code: "pickup_soon",
      label: "Recogida próxima",
      description: "Falta menos de una hora para tu recogida. Prepárate y dirígete a tu punto de encuentro.",
      showPickupActions: false,
      showReviewPrompt: false,
      pickupAt,
      reviewReadyAt,
    };
  }

  if (pickupStatus === "picked_up" && reviewReadyAt && now < reviewReadyAt) {
    return {
      code: "in_experience",
      label: "Experiencia en curso",
      description: "Marcaste que ya fuiste recogido. Esperamos que estés disfrutando la aventura.",
      showPickupActions: false,
      showReviewPrompt: false,
      pickupAt,
      reviewReadyAt,
    };
  }

  if (now >= pickupAt && reviewReadyAt && now < reviewReadyAt && pickupStatus !== "picked_up") {
    return {
      code: "awaiting_pickup_confirmation",
      label: "Confirma tu recogida",
      description: "Ya llegó la hora de recogida. Indícanos si el chofer te recogió o si no se presentó.",
      showPickupActions: true,
      showReviewPrompt: false,
      pickupAt,
      reviewReadyAt,
    };
  }

  if (reviewReadyAt && now >= reviewReadyAt && !allProductsReviewed && reviewableItems.length > 0) {
    return {
      code: "review_pending",
      label: "Cuéntanos tu experiencia",
      description: "Tu tour ya debió haber terminado. Déjanos una reseña para ayudar a futuros clientes.",
      showPickupActions: false,
      showReviewPrompt: true,
      pickupAt,
      reviewReadyAt,
    };
  }

  return {
    code: "completed",
    label: "Experiencia completada",
    description: allProductsReviewed
      ? "Gracias por completar tu experiencia y compartir tu reseña."
      : "Tu experiencia se completó correctamente.",
    showPickupActions: false,
    showReviewPrompt: false,
    pickupAt,
    reviewReadyAt,
  };
}