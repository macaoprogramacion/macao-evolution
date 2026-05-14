export type PickupReservationCodePayload = {
  reservationId: string;
  customerName: string;
  hotel: string;
  pickupTime: string;
  agency: string;
  persons: number;
  room: string;
  serviceType: string;
};

const PREFIX = "MRC1:";

export function createPickupReservationCode(payload: PickupReservationCodePayload): string {
  const json = JSON.stringify(payload);
  return `${PREFIX}${btoa(json)}`;
}

export function parsePickupReservationCode(raw: string): PickupReservationCodePayload {
  const value = (raw || "").trim();
  if (!value.startsWith(PREFIX)) {
    throw new Error("Formato de codigo invalido. Debe iniciar con MRC1:");
  }

  const encoded = value.slice(PREFIX.length);
  const json = atob(encoded);
  const parsed = JSON.parse(json);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Codigo de reserva invalido");
  }

  const payload: PickupReservationCodePayload = {
    reservationId: String(parsed.reservationId || ""),
    customerName: String(parsed.customerName || ""),
    hotel: String(parsed.hotel || ""),
    pickupTime: String(parsed.pickupTime || ""),
    agency: String(parsed.agency || ""),
    persons: Number(parsed.persons || 0),
    room: String(parsed.room || ""),
    serviceType: String(parsed.serviceType || ""),
  };

  if (!payload.customerName || !payload.hotel || !payload.pickupTime) {
    throw new Error("Codigo incompleto: faltan datos de recogida");
  }

  return payload;
}
