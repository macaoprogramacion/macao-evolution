"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  AlertCircle,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  Clock3,
  Download,
  MapPin,
  ReceiptText,
  Star,
  UserRound,
  X,
} from "lucide-react";

import {
  getReservationPickupDateTime,
  getReservationReviewReadyAt,
  getReservationTimelineStatus,
  getReviewableItems,
  hasReviewedProduct,
  loadCustomerReservations,
  updateCustomerReservation,
  cancelCustomerReservation,
  canCancelReservation,
  type PickupStatus,
  type StoredCustomerReservation,
} from "@/lib/customer-reservations";
import { submitProductReview } from "@/lib/product-reviews";
import { reportChoferIncident } from "@/lib/chofer-incidents";
import { getCustomerSession } from "@/lib/customer-session";
import { createPickupReservationCode } from "@/lib/pickup-reservation-code";

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-DO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(value: Date | null) {
  if (!value) return "Pendiente";
  return value.toLocaleString("es-DO", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildCustomerConfirmationNumber(reservation: StoredCustomerReservation) {
  const cleanId = String(reservation.id || "").replace(/-/g, "").toUpperCase();
  return `MC-${cleanId.slice(0, 10)}`;
}

function buildCustomerValidationCode(reservation: StoredCustomerReservation) {
  const totalPeople = reservation.items.reduce((sum, item) => sum + item.quantity, 0);
  return createPickupReservationCode({
    reservationId: reservation.id,
    customerName: reservation.customer.name,
    hotel: reservation.pickup?.hotel || reservation.pickup?.custom || "pendiente",
    pickupTime: reservation.pickup?.time || "pendiente",
    agency: "website",
    persons: totalPeople,
    room: "",
    serviceType: reservation.items.map((item) => item.name).join(", "),
  });
}

function buildTicketHTML(reservation: StoredCustomerReservation): string {
  const confirmationNumber = buildCustomerConfirmationNumber(reservation);
  const validationCode = buildCustomerValidationCode(reservation);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${encodeURIComponent(validationCode)}`;

  const itemRows = reservation.items
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">${formatMoney(item.price)}</td>
        <td style="text-align:right">${formatMoney(item.price * item.quantity)}</td>
      </tr>`,
    )
    .join("");

  const pickupSection = reservation.pickup
    ? `<div class="section">
        <div class="section-title">Detalle de Recogida</div>
        <table class="info-table">
          <tr><td class="label">Lugar</td><td>${reservation.pickup.hotel || reservation.pickup.custom || "Pendiente"}</td></tr>
          ${reservation.pickup.point ? `<tr><td class="label">Punto</td><td>${reservation.pickup.point}</td></tr>` : ""}
          ${reservation.pickup.date ? `<tr><td class="label">Fecha</td><td>${formatDate(reservation.pickup.date)}</td></tr>` : ""}
          ${reservation.pickup.time ? `<tr><td class="label">Hora</td><td>${reservation.pickup.time}</td></tr>` : ""}
        </table>
      </div>`
    : "";

  const pendingRow =
    reservation.totals.remainingAmount > 0
      ? `<tr class="pending"><td class="label">Saldo pendiente</td><td style="text-align:right">${formatMoney(reservation.totals.remainingAmount)}</td></tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ticket de Reserva ${reservation.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 13px;
      color: #111;
      background: #fff;
      padding: 32px;
      max-width: 680px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: 20px;
      border-bottom: 2px solid #111;
      margin-bottom: 24px;
    }
    .brand { font-size: 22px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
    .brand-sub { font-size: 11px; color: #555; margin-top: 3px; }
    .ticket-meta { text-align: right; }
    .ticket-meta .ticket-id { font-size: 11px; color: #555; }
    .ticket-meta .ticket-date { font-size: 12px; margin-top: 4px; }
    .badge {
      display: inline-block;
      background: #111;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 4px;
      margin-bottom: 6px;
    }
    .section { margin-bottom: 20px; }
    .section-title {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #555;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e5e5e5;
    }
    .info-table { width: 100%; border-collapse: collapse; }
    .info-table td { padding: 4px 0; vertical-align: top; }
    .info-table .label { color: #555; width: 130px; }
    .items-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    .items-table thead tr { border-bottom: 1px solid #e5e5e5; }
    .items-table th {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #555;
      padding: 4px 6px 6px 6px;
      text-align: left;
    }
    .items-table th:not(:first-child) { text-align: center; }
    .items-table th:last-child { text-align: right; }
    .items-table td { padding: 6px 6px; border-bottom: 1px solid #f0f0f0; }
    .totals-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    .totals-table td { padding: 5px 0; }
    .totals-table .label { color: #555; }
    .totals-table .total-row td { font-size: 15px; font-weight: 700; padding-top: 10px; border-top: 2px solid #111; }
    .totals-table .pending { color: #b45309; }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e5e5e5;
      text-align: center;
      font-size: 11px;
      color: #888;
    }
    .footer strong { color: #111; }
    .qr-note {
      text-align: center;
      font-size: 11px;
      color: #888;
      margin-top: 12px;
      padding: 10px;
      border: 1px dashed #ddd;
      border-radius: 6px;
    }
    .confirm-number {
      margin-top: 8px;
      text-align: center;
      font-size: 12px;
      color: #374151;
    }
    .confirm-number strong {
      color: #111;
      font-size: 16px;
      letter-spacing: 1px;
    }
    .qr-wrap {
      margin-top: 10px;
      padding: 10px;
      border: 1px dashed #ddd;
      border-radius: 8px;
      text-align: center;
    }
    .qr-wrap img {
      width: 130px;
      height: 130px;
      object-fit: contain;
    }
    .qr-wrap p {
      margin-top: 6px;
      font-size: 10px;
      color: #777;
      word-break: break-all;
    }
    @media print {
      body { padding: 16px; }
      @page { margin: 12mm 14mm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Macao Memories</div>
      <div class="brand-sub">www.jonathanarache.com</div>
    </div>
    <div class="ticket-meta">
      <div class="badge">Ticket de Reserva</div>
      <div class="ticket-id">ID: ${reservation.id}</div>
      <div class="ticket-id">Confirmación: ${confirmationNumber}</div>
      <div class="ticket-date">Emitido: ${formatDate(reservation.createdAt)}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Datos del Cliente</div>
    <table class="info-table">
      <tr><td class="label">Nombre</td><td>${reservation.customer.name}</td></tr>
      <tr><td class="label">Email</td><td>${reservation.customer.email}</td></tr>
      <tr><td class="label">Teléfono</td><td>${reservation.customer.phone}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Experiencias Reservadas</div>
    <table class="items-table">
      <thead>
        <tr>
          <th>Descripción</th>
          <th>Cant.</th>
          <th>Precio unit.</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Resumen de Pago</div>
    <table class="totals-table">
      <tr><td class="label">Total de la reserva</td><td style="text-align:right">${formatMoney(reservation.totals.totalPrice)}</td></tr>
      <tr><td class="label">Monto pagado</td><td style="text-align:right">${formatMoney(reservation.totals.totalPaid)}</td></tr>
      ${pendingRow}
      <tr class="total-row"><td>Total</td><td style="text-align:right">${formatMoney(reservation.totals.totalPrice)}</td></tr>
    </table>
  </div>

  ${pickupSection}

  <div class="qr-note">
    Presenta este ticket al llegar al punto de recogida.<br/>
    <strong>Macao Evolution</strong> — Punta Cana, República Dominicana
  </div>

  <div class="confirm-number">Número de confirmación: <strong>${confirmationNumber}</strong></div>

  <div class="qr-wrap">
    <img src="${qrUrl}" alt="QR de validación" />
    <p>${validationCode}</p>
  </div>

  <div class="footer">
    Generado por <strong>www.jonathanarache.com</strong> &nbsp;·&nbsp; Macao Memories &copy; ${new Date().getFullYear()}
  </div>
</body>
</html>`;
}

function buildInvoiceHTML(reservation: StoredCustomerReservation): string {
  const confirmationNumber = buildCustomerConfirmationNumber(reservation);
  const invoiceNumber = `FAC-${String(reservation.id).replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  const lines = reservation.items
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">${formatMoney(item.price)}</td>
        <td style="text-align:right">${formatMoney(item.price * item.quantity)}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Factura ${invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #111; padding: 28px; max-width: 760px; margin: 0 auto; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #111; padding-bottom:12px; margin-bottom:18px; }
    .brand { font-size:22px; font-weight:800; letter-spacing:.04em; }
    .meta { text-align:right; font-size:12px; color:#444; }
    .block { margin-bottom:14px; }
    .title { font-size:11px; text-transform:uppercase; letter-spacing:.08em; color:#666; margin-bottom:6px; }
    table { width:100%; border-collapse:collapse; }
    th, td { border-bottom:1px solid #e5e5e5; padding:8px 6px; font-size:13px; }
    th { text-transform:uppercase; font-size:10px; letter-spacing:.06em; color:#666; text-align:left; }
    .totals td { border:none; padding:5px 0; }
    .final td { border-top:2px solid #111; font-weight:700; font-size:15px; }
    .note { margin-top:18px; font-size:11px; color:#666; text-align:center; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">MACAO OFFROAD EXPERIENCE</div>
      <div style="font-size:12px;color:#666;">Factura para cliente</div>
    </div>
    <div class="meta">
      <div><strong>Factura:</strong> ${invoiceNumber}</div>
      <div><strong>Confirmación:</strong> ${confirmationNumber}</div>
      <div><strong>Fecha:</strong> ${formatDate(reservation.createdAt)}</div>
    </div>
  </div>

  <div class="block">
    <div class="title">Cliente</div>
    <div>${reservation.customer.name}</div>
    <div style="font-size:12px;color:#666;">${reservation.customer.email} · ${reservation.customer.phone}</div>
  </div>

  <div class="block">
    <div class="title">Detalle</div>
    <table>
      <thead>
        <tr>
          <th>Descripción</th>
          <th style="text-align:center">Cant.</th>
          <th style="text-align:right">Precio</th>
          <th style="text-align:right">Subtotal</th>
        </tr>
      </thead>
      <tbody>${lines}</tbody>
    </table>
  </div>

  <table class="totals">
    <tr><td>Total reserva</td><td style="text-align:right">${formatMoney(reservation.totals.totalPrice)}</td></tr>
    <tr><td>Pagado</td><td style="text-align:right">${formatMoney(reservation.totals.totalPaid)}</td></tr>
    ${reservation.totals.remainingAmount > 0 ? `<tr><td>Pendiente</td><td style="text-align:right">${formatMoney(reservation.totals.remainingAmount)}</td></tr>` : ""}
    <tr class="final"><td>Total</td><td style="text-align:right">${formatMoney(reservation.totals.totalPrice)}</td></tr>
  </table>

  <div class="note">Gracias por reservar con Macao Evolution.</div>
</body>
</html>`;
}

function StarPicker({ value, onChange }: { value: number; onChange: (rating: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110 focus:outline-none"
          aria-label={`${star} estrellas`}
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              star <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "fill-none text-muted-foreground/40"
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">
          {["", "Pesimo", "Malo", "Regular", "Bueno", "Excelente"][value]}
        </span>
      )}
    </div>
  );
}

interface InPageNotification {
  id: string;
  title: string;
  message: string;
  variant: "info" | "warning";
}

function NotificationBanner({ notification, onDismiss }: { notification: InPageNotification; onDismiss: (id: string) => void }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-5 py-4 shadow-sm ${
        notification.variant === "warning"
          ? "border-amber-500/20 bg-amber-500/5"
          : "border-blue-500/20 bg-blue-500/5"
      }`}
    >
      <Bell
        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
          notification.variant === "warning" ? "text-amber-500" : "text-blue-500"
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{notification.title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{notification.message}</p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(notification.id)}
        className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function ReservasPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<StoredCustomerReservation[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, string>>({});
  const [ratingDrafts, setRatingDrafts] = useState<Record<string, number>>({});
  const [submittingReviewKey, setSubmittingReviewKey] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<InPageNotification[]>([]);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const sentEmailsThisSession = useRef(new Set<string>());

  const reloadReservations = useCallback(() => {
    if (!currentUserEmail) {
      setReservations([]);
      return;
    }
    loadCustomerReservations(currentUserEmail).then((rows) => setReservations(rows));
  }, [currentUserEmail]);

  useEffect(() => {
    getCustomerSession().then((session) => {
      setCurrentUserEmail(session?.email?.trim().toLowerCase() || "");
    });
  }, [reloadReservations]);

  useEffect(() => {
    reloadReservations();
  }, [reloadReservations]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  const myReservations = useMemo(() => {
    if (!currentUserEmail) return [];
    return reservations.filter(
      (r) => r.customer?.email?.trim().toLowerCase() === currentUserEmail,
    );
  }, [currentUserEmail, reservations]);

  const sendPickupReminder = useCallback(
    async (reservation: StoredCustomerReservation, type: "day_before" | "one_hour") => {
      const sessionKey = `${reservation.id}:${type}`;
      if (sentEmailsThisSession.current.has(sessionKey)) return;
      const alreadySent =
        type === "one_hour"
          ? reservation.customerActions?.notificationsSent?.oneHour
          : reservation.customerActions?.notificationsSent?.dayBefore;
      if (alreadySent) return;

      sentEmailsThisSession.current.add(sessionKey);

      await updateCustomerReservation(currentUserEmail, reservation.id, (r) => ({
        ...r,
        customerActions: {
          ...r.customerActions,
          notificationsSent: {
            ...r.customerActions?.notificationsSent,
            ...(type === "one_hour"
              ? { oneHour: new Date().toISOString() }
              : { dayBefore: new Date().toISOString() }),
          },
        },
      }));

      const isOneHour = type === "one_hour";
      const notifId = `${reservation.id}:${type}:${Date.now()}`;
      setNotifications((prev) => [
        {
          id: notifId,
          title: isOneHour ? "Tu recogida es en menos de 1 hora!" : "Manana es tu experiencia",
          message: isOneHour
            ? "Preparate y dirigete a tu punto de encuentro. Tambien te enviamos un correo recordatorio."
            : "Manana es el gran dia. Revisa los detalles de tu recogida y alistarte.",
          variant: "warning",
        },
        ...prev,
      ]);

      try {
        await fetch("/api/send-pickup-reminder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            customer: { name: reservation.customer.name, email: reservation.customer.email },
            pickup: reservation.pickup ?? {},
            items: reservation.items.map((i) => ({ name: i.name, quantity: i.quantity })),
            reservationId: reservation.id,
          }),
        });
      } catch (err) {
        console.error("Error sending reminder email:", err);
      }

      reloadReservations();
    },
    [currentUserEmail, reloadReservations],
  );

  useEffect(() => {
    for (const reservation of myReservations) {
      if (reservation.customerActions?.pickupStatus && reservation.customerActions.pickupStatus !== "pending") continue;
      const pickupAt = getReservationPickupDateTime(reservation);
      if (!pickupAt) continue;

      const nowMs = now.getTime();
      const pickupMs = pickupAt.getTime();
      const oneHourBeforeMs = pickupMs - 60 * 60 * 1000;

      const dayBeforeStart = new Date(pickupAt);
      dayBeforeStart.setDate(dayBeforeStart.getDate() - 1);
      dayBeforeStart.setHours(8, 0, 0, 0);
      const dayBeforeEnd = new Date(pickupAt);
      dayBeforeEnd.setDate(dayBeforeEnd.getDate() - 1);
      dayBeforeEnd.setHours(22, 0, 0, 0);

      if (nowMs >= oneHourBeforeMs && nowMs < pickupMs) {
        sendPickupReminder(reservation, "one_hour");
      }
      if (nowMs >= dayBeforeStart.getTime() && nowMs <= dayBeforeEnd.getTime()) {
        sendPickupReminder(reservation, "day_before");
      }
    }
  }, [now, myReservations, sendPickupReminder]);

  const handlePickupStatus = async (reservationId: string, pickupStatus: PickupStatus) => {
    await updateCustomerReservation(currentUserEmail, reservationId, (r) => ({
      ...r,
      customerActions: {
        ...r.customerActions,
        pickupStatus,
        pickupRespondedAt: new Date().toISOString(),
      },
    }));

    if (pickupStatus === "driver_absent") {
      const reservation = (await loadCustomerReservations(currentUserEmail)).find((r) => r.id === reservationId);
      if (reservation) {
        await reportChoferIncident({
          reservationId: reservation.id,
          customerName: reservation.customer.name,
          customerEmail: reservation.customer.email,
          customerPhone: reservation.customer.phone,
          pickupLocation: reservation.pickup?.hotel || reservation.pickup?.custom || "No especificada",
          pickupDate: reservation.pickup?.date || "",
          pickupTime: reservation.pickup?.time || "",
          itemsSummary: reservation.items.map((i) => `${i.quantity}x ${i.name}`).join(", "),
        });

        setNotifications((prev) => [
          {
            id: `incident:${reservationId}:${Date.now()}`,
            title: "Incidente reportado",
            message: "Hemos registrado que el chofer no se presento. Nuestro equipo revisara el caso y te contactara.",
            variant: "info",
          },
          ...prev,
        ]);
      }
    }

    reloadReservations();
  };

  const handleReviewSubmit = async (
    reservation: StoredCustomerReservation,
    productId: string,
    productName: string,
  ) => {
    const draftKey = `${reservation.id}:${productId}`;
    const draft = (reviewDrafts[draftKey] || "").trim();
    const rating = ratingDrafts[draftKey] || 0;
    if (!draft || rating === 0) return;

    setSubmittingReviewKey(draftKey);
    try {
      await submitProductReview({
        reservationId: reservation.id,
        productId,
        productName,
        customerName: reservation.customer.name,
        rating,
        reviewText: draft,
      });

      await updateCustomerReservation(currentUserEmail, reservation.id, (r) => ({
        ...r,
        customerActions: {
          ...r.customerActions,
          reviewedProductIds: Array.from(
            new Set([...(r.customerActions?.reviewedProductIds || []), productId]),
          ),
        },
      }));

      setReviewDrafts((prev) => ({ ...prev, [draftKey]: "" }));
      setRatingDrafts((prev) => ({ ...prev, [draftKey]: 0 }));
      reloadReservations();
    } catch (error) {
      console.error("Error saving review:", error);
    } finally {
      setSubmittingReviewKey(null);
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleCancelReservation = async () => {
    if (!cancelConfirmId || !currentUserEmail) return;
    setIsCancelling(true);
    await cancelCustomerReservation(currentUserEmail, cancelConfirmId);
    setCancelConfirmId(null);
    setIsCancelling(false);
    setNotifications((prev) => [
      {
        id: `cancel:${cancelConfirmId}:${Date.now()}`,
        title: "Reserva cancelada",
        message: "Tu reserva ha sido cancelada. Contáctanos si necesitas ayuda con el reembolso.",
        variant: "info",
      },
      ...prev,
    ]);
    reloadReservations();
  };

  const handleTicketDownload = (reservation: StoredCustomerReservation) => {
    const html = buildTicketHTML(reservation);
    const win = window.open("", "_blank", "width=780,height=900");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 400);
  };

  const handleInvoicePrint = (reservation: StoredCustomerReservation) => {
    const html = buildInvoiceHTML(reservation);
    const win = window.open("", "_blank", "width=820,height=900");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 400);
  };

  return (
    <>
    <main className="min-h-screen bg-background px-4 pb-16 pt-28 md:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver
          </button>
          <h1 className="text-3xl font-title text-foreground">Mis reservas</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Aqui puedes ver tus experiencias, confirmar la recogida y dejar una resena cuando termine el tour.
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="mb-6 space-y-3">
            {notifications.map((notification) => (
              <NotificationBanner
                key={notification.id}
                notification={notification}
                onDismiss={dismissNotification}
              />
            ))}
          </div>
        )}

        {!currentUserEmail ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Inicia sesion para ver tus reservas.
          </div>
        ) : myReservations.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Aun no tienes reservas registradas con este correo.
          </div>
        ) : (
          <div className="space-y-4">
            {myReservations.map((reservation) => {
              const isOpen = expandedId === reservation.id;
              const timeline = getReservationTimelineStatus(reservation, now);
              const pickupAt = getReservationPickupDateTime(reservation);
              const reviewReadyAt = getReservationReviewReadyAt(reservation);
              const reviewableItems = getReviewableItems(reservation);

              return (
                <article key={reservation.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : reservation.id)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-secondary/40"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">Reserva {reservation.id}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {reservation.items.reduce((sum, item) => sum + item.quantity, 0)} experiencia(s) · {formatDate(reservation.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
                        {timeline.label}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-border px-5 py-4">
                      <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">{timeline.label}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{timeline.description}</p>
                            {pickupAt && (
                              <p className="mt-2 text-xs text-muted-foreground">Recogida: {formatDateTime(pickupAt)}</p>
                            )}
                            {reviewReadyAt && (
                              <p className="mt-1 text-xs text-muted-foreground">Solicitud de resena: {formatDateTime(reviewReadyAt)}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {timeline.showPickupActions && (
                        <div className="mb-4 grid gap-3 md:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => handlePickupStatus(reservation.id, "picked_up")}
                            className="rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background transition-opacity hover:opacity-85"
                          >
                            Si, ya me recogieron
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePickupStatus(reservation.id, "driver_absent")}
                            className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10"
                          >
                            El chofer no se presento
                          </button>
                        </div>
                      )}

                      <div className="mb-4 grid gap-3 md:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => handleTicketDownload(reservation)}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary/60"
                        >
                          <Download className="h-4 w-4" />
                          Descargar ticket
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInvoicePrint(reservation)}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary/60"
                        >
                          <ReceiptText className="h-4 w-4" />
                          Imprimir factura
                        </button>
                      </div>
                      <div className="mb-4 grid gap-3 md:grid-cols-2">
                        {canCancelReservation(reservation, now) && (
                          <button
                            type="button"
                            onClick={() => setCancelConfirmId(reservation.id)}
                            className="w-full rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10"
                          >
                            Cancelar reserva
                          </button>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <section className="space-y-3 rounded-xl border border-border bg-background p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Experiencias reservadas</p>
                          {reservation.items.map((item) => (
                            <div key={`${reservation.id}-${item.id}`} className="flex items-center gap-3 rounded-lg border border-border p-2">
                              <div className="relative h-14 w-20 overflow-hidden rounded-md bg-muted">
                                <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Cantidad: {item.quantity} · {formatMoney(item.price * item.quantity)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </section>

                        <section className="space-y-3 rounded-xl border border-border bg-background p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Informacion de reserva</p>
                          <div className="flex items-start gap-2 text-sm text-foreground">
                            <UserRound className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{reservation.customer.name}</p>
                              <p className="text-xs text-muted-foreground">{reservation.customer.email}</p>
                              <p className="text-xs text-muted-foreground">{reservation.customer.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 text-sm text-foreground">
                            <ReceiptText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div>
                              <p>Total: {formatMoney(reservation.totals.totalPrice)}</p>
                              <p>Pagado: {formatMoney(reservation.totals.totalPaid)}</p>
                              {reservation.totals.remainingAmount > 0 && (
                                <p className="text-amber-600">Pendiente: {formatMoney(reservation.totals.remainingAmount)}</p>
                              )}
                            </div>
                          </div>
                          {reservation.pickup && (
                            <div className="rounded-lg border border-border p-3">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Detalle de recogida</p>
                              <div className="space-y-1 text-sm text-foreground">
                                <p className="flex items-center gap-2">
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                  {reservation.pickup.hotel || reservation.pickup.custom || "Pendiente"}
                                </p>
                                {reservation.pickup.point && (
                                  <p className="text-xs text-muted-foreground">Punto: {reservation.pickup.point}</p>
                                )}
                                {reservation.pickup.date && (
                                  <p className="flex items-center gap-2">
                                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                                    {formatDate(reservation.pickup.date)}
                                  </p>
                                )}
                                {reservation.pickup.time && (
                                  <p className="flex items-center gap-2">
                                    <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                                    {reservation.pickup.time}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </section>
                      </div>

                      {timeline.showReviewPrompt && reviewableItems.length > 0 && (
                        <div className="mt-4 space-y-4 rounded-xl border border-border bg-background p-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dejanos tu resena</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Comparte como fue tu experiencia. La resena se mostrara dentro del producto correspondiente.
                            </p>
                          </div>
                          {reviewableItems.map((item) => {
                            const draftKey = `${reservation.id}:${item.id}`;
                            const alreadyReviewed = hasReviewedProduct(reservation, item.id);
                            const currentRating = ratingDrafts[draftKey] || 0;
                            const currentText = reviewDrafts[draftKey] || "";
                            const canSubmit = currentRating > 0 && currentText.trim().length > 0;

                            return (
                              <div key={draftKey} className="rounded-xl border border-border p-4">
                                <div className="mb-3 flex items-center gap-3">
                                  <div className="relative h-14 w-16 overflow-hidden rounded-md bg-muted">
                                    <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {alreadyReviewed ? "Resena enviada" : "Cuentanos como fue tu experiencia"}
                                    </p>
                                  </div>
                                </div>

                                {alreadyReviewed ? (
                                  <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600">
                                    <Star className="h-3.5 w-3.5 fill-green-500 text-green-500" />
                                    Gracias por tu resena
                                  </div>
                                ) : (
                                  <>
                                    <div className="mb-3">
                                      <p className="mb-1.5 text-xs text-muted-foreground">Calificacion</p>
                                      <StarPicker
                                        value={currentRating}
                                        onChange={(r) => setRatingDrafts((prev) => ({ ...prev, [draftKey]: r }))}
                                      />
                                    </div>
                                    <textarea
                                      value={currentText}
                                      onChange={(event) =>
                                        setReviewDrafts((prev) => ({ ...prev, [draftKey]: event.target.value }))
                                      }
                                      placeholder="Cuentanos como fue el tour, la atencion y que fue lo que mas te gusto"
                                      className="min-h-28 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground/30"
                                    />
                                    <button
                                      type="button"
                                      disabled={submittingReviewKey === draftKey || !canSubmit}
                                      onClick={() => handleReviewSubmit(reservation, item.id, item.name)}
                                      className="mt-3 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {submittingReviewKey === draftKey ? "Enviando..." : "Enviar resena"}
                                    </button>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>

    {/* Diálogo de confirmación de cancelación */}
    {cancelConfirmId && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
              <X className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-base font-semibold text-foreground">¿Cancelar reserva?</h2>
          </div>
          <p className="mb-6 text-sm text-muted-foreground">
            Esta acción no se puede deshacer. Si pagaste, contáctanos para gestionar el reembolso.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCancelConfirmId(null)}
              disabled={isCancelling}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={handleCancelReservation}
              disabled={isCancelling}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isCancelling ? "Cancelando…" : "Sí, cancelar"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
