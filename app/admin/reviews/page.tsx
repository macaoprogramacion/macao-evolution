"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/admin/dashboard-layout";
import {
  AlertTriangle,
  MapPin,
  RefreshCcw,
  Star,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import type { ProductReview } from "@/lib/product-reviews";
import type { ChoferIncident } from "@/lib/chofer-incidents";

function StarDisplay({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs text-muted-foreground">Sin calificación</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-none text-muted-foreground/30"
          }`}
        />
      ))}
      <span className="ml-1 text-xs font-medium text-foreground">{rating}/5</span>
    </div>
  );
}

function ReviewsTab() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("product_reviews")
      .select("id, reservation_id, product_id, product_name, customer_name, rating, review_text, created_at")
      .order("created_at", { ascending: false });
    setReviews((data as ProductReview[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const products = Array.from(new Set(reviews.map((r) => r.product_name))).sort();

  const filtered = filter === "all" ? reviews : reviews.filter((r) => r.product_name === filter);

  const avgRating =
    reviews.filter((r) => r.rating).length > 0
      ? (
          reviews.filter((r) => r.rating).reduce((sum, r) => sum + (r.rating ?? 0), 0) /
          reviews.filter((r) => r.rating).length
        ).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total reseñas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{reviews.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Calificación promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{avgRating ?? "—"}</p>
              {avgRating && (
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(Number(avgRating))
                          ? "fill-amber-400 text-amber-400"
                          : "fill-none text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Productos con reseñas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{products.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter + refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === "all"
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground hover:border-foreground/30"
            }`}
          >
            Todos
          </button>
          {products.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setFilter(name)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === name
                  ? "bg-foreground text-background"
                  : "border border-border text-muted-foreground hover:border-foreground/30"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <RefreshCcw className="h-3 w-3" />
          Actualizar
        </button>
      </div>

      {/* Reviews list */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando reseñas…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay reseñas todavía.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">{review.customer_name}</span>
                    <Badge variant="secondary" className="text-[10px]">{review.product_name}</Badge>
                  </div>
                  <div className="mt-1">
                    <StarDisplay rating={review.rating} />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString("es-DO", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{review.review_text}</p>
              <p className="mt-2 text-[11px] text-muted-foreground/50">Reserva: {review.reservation_id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IncidentsTab() {
  const [incidents, setIncidents] = useState<ChoferIncident[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("chofer_incidents")
      .select("id, reservation_id, customer_name, customer_email, customer_phone, pickup_location, pickup_date, pickup_time, items_summary, reported_at")
      .order("reported_at", { ascending: false });
    setIncidents((data as ChoferIncident[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total incidentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{incidents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Último reporte</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-foreground">
              {incidents[0]
                ? new Date(incidents[0].reported_at).toLocaleDateString("es-DO", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <RefreshCcw className="h-3 w-3" />
          Actualizar
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando incidentes…</p>
      ) : incidents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay incidentes reportados.</p>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-semibold text-foreground">{incident.customer_name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(incident.reported_at).toLocaleDateString("es-DO", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Cliente</p>
                  <p className="text-foreground">{incident.customer_email}</p>
                  <p className="text-muted-foreground">{incident.customer_phone}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Recogida</p>
                  <p className="flex items-center gap-1.5 text-foreground">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {incident.pickup_location}
                  </p>
                  {incident.pickup_date && (
                    <p className="text-muted-foreground">{incident.pickup_date} · {incident.pickup_time}</p>
                  )}
                </div>
              </div>

              <div className="mt-2">
                <p className="text-xs text-muted-foreground">
                  <strong>Experiencias:</strong> {incident.items_summary}
                </p>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground/50">Reserva: {incident.reservation_id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [tab, setTab] = useState<"reviews" | "incidents">("reviews");

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reseñas e Incidentes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reseñas dejadas por clientes y reportes de choferes ausentes.
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "reviews" | "incidents")}>
          <TabsList>
            <TabsTrigger value="reviews">
              <Star className="mr-2 h-4 w-4" />
              Reseñas de clientes
            </TabsTrigger>
            <TabsTrigger value="incidents">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Incidentes de chofer
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === "reviews" ? <ReviewsTab /> : <IncidentsTab />}
      </div>
    </DashboardLayout>
  );
}
