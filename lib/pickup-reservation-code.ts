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
const SEPARATOR = "~";

function normalizeCodeInput(raw: string): string {
  return (raw || "")
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, "");
}

function toBase64UrlUtf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64UrlUtf8(value: string): string {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");

  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function fromBase64Utf8(value: string): string {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function safeDecodePart(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizePayload(parsed: Record<string, unknown>): PickupReservationCodePayload {
  return {
    reservationId: String(parsed.reservationId || ""),
    customerName: String(parsed.customerName || ""),
    hotel: String(parsed.hotel || ""),
    pickupTime: String(parsed.pickupTime || ""),
    agency: String(parsed.agency || ""),
    persons: Math.max(0, Number(parsed.persons || 0)),
    room: String(parsed.room || ""),
    serviceType: String(parsed.serviceType || ""),
  };
}

function validatePayload(payload: PickupReservationCodePayload): PickupReservationCodePayload {
  if (!payload.customerName || !payload.hotel || !payload.pickupTime) {
    throw new Error("Codigo incompleto: faltan datos de recogida");
  }

  return {
    ...payload,
    persons: payload.persons > 0 ? payload.persons : 1,
  };
}

export function createPickupReservationCode(payload: PickupReservationCodePayload): string {
  // Compact payload format: reservationId~customerName~hotel~pickupTime~agency~persons~room~serviceType
  const compact = [
    payload.reservationId || "",
    payload.customerName || "",
    payload.hotel || "",
    payload.pickupTime || "",
    payload.agency || "",
    String(Math.max(1, Number(payload.persons || 1))),
    payload.room || "",
    payload.serviceType || "",
  ]
    .map((part) => encodeURIComponent(part))
    .join(SEPARATOR);

  return `${PREFIX}${toBase64UrlUtf8(compact)}`;
}

export function parsePickupReservationCode(raw: string): PickupReservationCodePayload {
  const value = normalizeCodeInput(raw);
  if (!value.startsWith(PREFIX)) {
    if (!value.startsWith(PREFIX.slice(0, -1))) {
      throw new Error("Formato de codigo invalido. Debe iniciar con MRC1:");
    }
  }

  const encoded = value.startsWith(PREFIX) ? value.slice(PREFIX.length) : value.slice(PREFIX.length - 1);

  if (!encoded) {
    throw new Error("Formato de codigo invalido. Debe iniciar con MRC1:");
  }

  // V2 compact format
  try {
    const decoded = fromBase64UrlUtf8(encoded);
    const parts = decoded.split(SEPARATOR).map((part) => safeDecodePart(part));
    if (parts.length === 8) {
      const payload: PickupReservationCodePayload = {
        reservationId: parts[0] || "",
        customerName: parts[1] || "",
        hotel: parts[2] || "",
        pickupTime: parts[3] || "",
        agency: parts[4] || "",
        persons: Number(parts[5] || "0"),
        room: parts[6] || "",
        serviceType: parts[7] || "",
      };
      return validatePayload(payload);
    }
  } catch {
    // Fallback to legacy format below
  }

  // Legacy format (JSON encoded with base64)
  try {
    const json = encoded.includes("-") || encoded.includes("_") ? fromBase64UrlUtf8(encoded) : fromBase64Utf8(encoded);
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Codigo de reserva invalido");
    }

    return validatePayload(normalizePayload(parsed as Record<string, unknown>));
  } catch {
    throw new Error("Codigo de reserva invalido");
  }
}
