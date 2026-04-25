"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CalendarDays, ChevronDown, ChevronLeft, Clock3, MapPin, ReceiptText, UserRound } from "lucide-react";

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  Clock3,
  MapPin,
  ReceiptText,
  Star,
  UserRound,
} from "lucide-react";

import {
  getReservationPickupDateTime,
  getReservationReviewReadyAt,
  getReservationTimelineStatus,
  getReviewableItems,
  hasReviewedProduct,
  loadCustomerReservations,
  updateCustomerReservation,
  type PickupStatus,
  type StoredCustomerReservation,
} from "@/lib/customer-reservations";
import { submitProductReview } from "@/lib/product-reviews";

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

export default function ReservasPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<StoredCustomerReservation[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, string>>({});
  const [submittingReviewKey, setSubmittingReviewKey] = useState<string | null>(null);

  const reloadReservations = () => {
    setReservations(loadCustomerReservations());
  };

  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem("macao-user") || "null") as { email?: string } | null;
      setCurrentUserEmail(session?.email?.trim().toLowerCase() || "");
    } catch {
      setCurrentUserEmail("");
    }

    reloadReservations();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  const myReservations = useMemo(() => {
    if (!currentUserEmail) return [];

    return reservations.filter(
      (reservation) => reservation.customer?.email?.trim().toLowerCase() === currentUserEmail,
    );
  }, [currentUserEmail, reservations]);

  const handlePickupStatus = (reservationId: string, pickupStatus: PickupStatus) => {
    updateCustomerReservation(reservationId, (reservation) => ({
      ...reservation,
      customerActions: {
        ...reservation.customerActions,
        pickupStatus,
        pickupRespondedAt: new Date().toISOString(),
      },
    }));

    reloadReservations();
  };

  const handleReviewSubmit = async (
    reservation: StoredCustomerReservation,
    productId: string,
    productName: string,
  ) => {
    const draftKey = `${reservation.id}:${productId}`;
    const draft = (reviewDrafts[draftKey] || "").trim();
    if (!draft) return;

    setSubmittingReviewKey(draftKey);

    try {
      await submitProductReview({
        reservationId: reservation.id,
        productId,
        productName,
        customerName: reservation.customer.name,
        reviewText: draft,
      });

      updateCustomerReservation(reservation.id, (currentReservation) => ({
        ...currentReservation,
        customerActions: {
          ...currentReservation.customerActions,
          reviewedProductIds: Array.from(
            new Set([...(currentReservation.customerActions?.reviewedProductIds || []), productId]),
          ),
        },
      }));

      setReviewDrafts((prev) => ({ ...prev, [draftKey]: "" }));
      reloadReservations();
    } catch (error) {
      console.error("Error saving review:", error);
    } finally {
      setSubmittingReviewKey(null);
    }
  };

  return (
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
            Aquí puedes ver tus experiencias, confirmar la recogida y dejar una reseña cuando termine el tour.
          </p>
        </div>

        {!currentUserEmail ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Inicia sesión para ver tus reservas.
          </div>
        ) : myReservations.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Aún no tienes reservas registradas con este correo.
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
                              <p className="mt-2 text-xs text-muted-foreground">
                                Recogida: {formatDateTime(pickupAt)}
                              </p>
                            )}
                            {reviewReadyAt && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Solicitud de reseña: {formatDateTime(reviewReadyAt)}
                              </p>
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
                            Sí, ya me recogieron
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePickupStatus(reservation.id, "driver_absent")}
                            className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10"
                          >
                            El chofer no se presentó
                          </button>
                        </div>
                      )}

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
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Información de reserva</p>

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
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Detalle de recogida
                              </p>
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
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Déjanos tu reseña</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Comparte cómo fue tu experiencia. La reseña se mostrará dentro del producto correspondiente.
                            </p>
                          </div>

                          {reviewableItems.map((item) => {
                            const draftKey = `${reservation.id}:${item.id}`;
                            const alreadyReviewed = hasReviewedProduct(reservation, item.id);

                            return (
                              <div key={draftKey} className="rounded-xl border border-border p-4">
                                <div className="mb-3 flex items-center gap-3">
                                  <div className="relative h-14 w-16 overflow-hidden rounded-md bg-muted">
                                    <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {alreadyReviewed ? "Reseña enviada" : "Cuéntanos cómo fue tu experiencia"}
                                    </p>
                                  </div>
                                </div>

                                {alreadyReviewed ? (
                                  <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600">
                                    <Star className="h-3.5 w-3.5" />
                                    Gracias por tu reseña
                                  </div>
                                ) : (
                                  <>
                                    <textarea
                                      value={reviewDrafts[draftKey] || ""}
                                      onChange={(event) =>
                                        setReviewDrafts((prev) => ({ ...prev, [draftKey]: event.target.value }))
                                      }
                                      placeholder="Cuéntanos cómo fue el tour, la atención y qué fue lo que más te gustó"
                                      className="min-h-28 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground/30"
                                    />
                                    <button
                                      type="button"
                                      disabled={submittingReviewKey === draftKey || !(reviewDrafts[draftKey] || "").trim()}
                                      onClick={() => handleReviewSubmit(reservation, item.id, item.name)}
                                      className="mt-3 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {submittingReviewKey === draftKey ? "Enviando..." : "Enviar reseña"}
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
  );
}
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
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Detalle de recogida
                              </p>
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
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
