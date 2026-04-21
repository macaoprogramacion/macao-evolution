"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { CalendarDays, ChevronDown, Clock3, MapPin, ReceiptText, UserRound } from "lucide-react";

type Reservation = {
  id: string;
  createdAt: string;
  customer: { name: string; phone: string; email: string };
  items: { id: string; name: string; quantity: number; price: number; image: string }[];
  totals: {
    totalPrice: number;
    totalPaid: number;
    remainingAmount: number;
    paymentOption: "full" | "partial";
    paymentMethod: "card" | "paypal";
  };
  pickup?: {
    mode: "hotel" | "custom";
    hotel?: string;
    custom?: string;
    date?: string;
    time?: string;
    point?: string;
  };
};

const RESERVATION_KEY = "macao-customer-reservations";

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

export default function ReservasPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem("macao-user") || "null") as { email?: string } | null;
      const email = session?.email?.trim().toLowerCase() || "";
      setCurrentUserEmail(email);

      const stored = JSON.parse(localStorage.getItem(RESERVATION_KEY) || "[]") as Reservation[];
      setReservations(Array.isArray(stored) ? stored : []);
    } catch {
      setReservations([]);
      setCurrentUserEmail("");
    }
  }, []);

  const myReservations = useMemo(() => {
    if (!currentUserEmail) return [];
    return reservations.filter(
      (reservation) => reservation.customer?.email?.trim().toLowerCase() === currentUserEmail
    );
  }, [reservations, currentUserEmail]);

  return (
    <main className="min-h-screen bg-background px-4 pb-16 pt-28 md:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-title text-foreground">Mis reservas</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Aqui puedes ver las experiencias que reservaste y consultar la informacion de recogida y pago.
          </p>
        </div>

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
                        {formatMoney(reservation.totals.totalPaid)}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-border px-5 py-4">
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
