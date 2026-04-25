import { supabase } from "@/lib/supabase";

export interface ChoferIncident {
  id: number;
  reservation_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  pickup_location: string;
  pickup_date: string;
  pickup_time: string;
  items_summary: string;
  reported_at: string;
}

export async function reportChoferIncident(input: {
  reservationId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupLocation: string;
  pickupDate: string;
  pickupTime: string;
  itemsSummary: string;
}) {
  const { data, error } = await supabase
    .from("chofer_incidents")
    .insert({
      reservation_id: input.reservationId,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      pickup_location: input.pickupLocation,
      pickup_date: input.pickupDate,
      pickup_time: input.pickupTime,
      items_summary: input.itemsSummary,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error reporting chofer incident:", error);
    // Don't throw — allow the UI state update to proceed even if persistence fails.
  }

  return data;
}

export async function fetchChoferIncidents() {
  const { data, error } = await supabase
    .from("chofer_incidents")
    .select("id, reservation_id, customer_name, customer_email, customer_phone, pickup_location, pickup_date, pickup_time, items_summary, reported_at")
    .order("reported_at", { ascending: false });

  if (error || !data) {
    console.error("Error fetching chofer incidents:", error);
    return [] as ChoferIncident[];
  }

  return data as ChoferIncident[];
}
