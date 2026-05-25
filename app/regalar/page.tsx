"use client";

import { useMemo, useState, useEffect } from "react";
import { Gift, UserRound, Mail, Phone, Sparkles, Loader2 } from "lucide-react";

import { Header } from "@/components/header";
import { FooterSection } from "@/components/sections/footer-section";
import { useCart } from "@/context/cart-context";
import { fetchProducts, products as fallbackProducts, type Product } from "@/lib/products";
import { getCustomerSession } from "@/lib/customer-session";
import { saveGiftDraft } from "@/lib/customer-checkout-draft";

type GiftService = "service-horseback-ride" | "service-dune-buggy" | "private-transport";

const SERVICE_OPTIONS: {
  id: GiftService;
  label: string;
  subtitle: string;
  price: number;
  image: string;
  name: string;
}[] = [
  {
    id: "service-horseback-ride",
    label: "Horseback Ride",
    subtitle: "Ideal para disfrutar una ruta guiada",
    price: 0,
    image: "/images/service-section/servicio-caballos.png",
    name: "Horseback Ride",
  },
  {
    id: "service-dune-buggy",
    label: "Dune Buggy",
    subtitle: "Experiencia off-road para tu grupo",
    price: 100,
    image: "/images/service-section/servicio-buggies.png",
    name: "Dune Buggy",
  },
  {
    id: "private-transport",
    label: "Private Transport",
    subtitle: "Transporte puerta a puerta",
    price: 75,
    image: "/images/service-section/private-transportation.webp",
    name: "Private Transport",
  },
];

export default function RegalarPage() {
  const { clearCart, addItem } = useCart();

  const [productList, setProductList] = useState<Product[]>(fallbackProducts);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverEmail, setReceiverEmail] = useState("");
  const [selectedService, setSelectedService] = useState<GiftService>("service-horseback-ride");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;

    fetchProducts()
      .then((data) => {
        if (!mounted) return;
        if (data.length > 0) {
          const merged = [...data];
          for (const fallback of fallbackProducts) {
            if (!merged.some((item) => item.slug === fallback.slug)) {
              merged.push(fallback);
            }
          }
          setProductList(merged);
        }
      })
      .finally(() => {
        if (mounted) setLoadingProducts(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedProductId && productList.length > 0) {
      setSelectedProductId(productList[0].id);
    }
  }, [productList, selectedProductId]);

  const selectedProduct = useMemo(
    () => productList.find((product) => product.id === selectedProductId),
    [productList, selectedProductId]
  );

  const selectedServiceData = useMemo(
    () => SERVICE_OPTIONS.find((service) => service.id === selectedService),
    [selectedService]
  );

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    if (!receiverName.trim()) nextErrors.receiverName = "Escribe el nombre del destinatario";

    if (!receiverPhone.trim()) nextErrors.receiverPhone = "Escribe el teléfono del destinatario";
    else if (!/^[\d\s\-+()]{7,20}$/.test(receiverPhone)) nextErrors.receiverPhone = "Teléfono inválido";

    if (!receiverEmail.trim()) nextErrors.receiverEmail = "Escribe el email del destinatario";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receiverEmail)) nextErrors.receiverEmail = "Email inválido";

    if (!selectedProduct) nextErrors.product = "Selecciona una experiencia";
    if (!selectedServiceData) nextErrors.service = "Selecciona un servicio";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleGiftCheckout() {
    if (!validateForm() || !selectedProduct || !selectedServiceData) return;

    setIsSubmitting(true);

    try {
      clearCart();

      addItem({
        id: selectedServiceData.id,
        name: selectedServiceData.name,
        price: selectedServiceData.price,
        image: selectedServiceData.image,
        type: "service",
      });

      addItem({
        id: selectedProduct.id,
        name: selectedProduct.title,
        price: selectedProduct.price,
        originalPrice: selectedProduct.originalPrice,
        image: selectedProduct.image,
        type: "product",
      });

      const session = await getCustomerSession();
      if (session?.email) {
        await saveGiftDraft(session.email, {
          receiverName: receiverName.trim(),
          receiverPhone: receiverPhone.trim(),
          receiverEmail: receiverEmail.trim(),
        });
      }

      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("macao-open-checkout"));
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="px-6 pt-28 pb-8 md:px-12 md:pt-32 lg:px-20">
        <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-secondary/30 p-6 md:p-8">
          <p className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-red-600">
            <Gift size={14} />
            Regalar experiencia
          </p>
          <h1 className="mt-4 font-title text-3xl md:text-5xl">Regala una aventura en Macao</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            Completa los datos de la persona que recibirá el regalo, elige servicio y experiencia, y te llevamos directo al checkout.
          </p>
        </div>
      </section>

      <section className="px-6 pb-16 md:px-12 md:pb-20 lg:px-20">
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background p-6 md:p-7">
            <h2 className="text-lg font-semibold">Datos del destinatario</h2>
            <p className="mt-1 text-sm text-muted-foreground">Estos datos se precargan en checkout.</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Nombre completo</label>
                <div className="relative">
                  <UserRound size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={receiverName}
                    onChange={(event) => setReceiverName(event.target.value)}
                    placeholder="Ej. Maria Lopez"
                    className={`w-full rounded-xl border bg-background py-3 pl-10 pr-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-foreground/20 ${errors.receiverName ? "border-red-500" : "border-border"}`}
                  />
                </div>
                {errors.receiverName ? <p className="mt-1 text-xs text-red-500">{errors.receiverName}</p> : null}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Teléfono</label>
                <div className="relative">
                  <Phone size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={receiverPhone}
                    onChange={(event) => setReceiverPhone(event.target.value)}
                    placeholder="Ej. +1 809 555 1234"
                    className={`w-full rounded-xl border bg-background py-3 pl-10 pr-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-foreground/20 ${errors.receiverPhone ? "border-red-500" : "border-border"}`}
                  />
                </div>
                {errors.receiverPhone ? <p className="mt-1 text-xs text-red-500">{errors.receiverPhone}</p> : null}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={receiverEmail}
                    onChange={(event) => setReceiverEmail(event.target.value)}
                    placeholder="Ej. persona@email.com"
                    className={`w-full rounded-xl border bg-background py-3 pl-10 pr-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-foreground/20 ${errors.receiverEmail ? "border-red-500" : "border-border"}`}
                  />
                </div>
                {errors.receiverEmail ? <p className="mt-1 text-xs text-red-500">{errors.receiverEmail}</p> : null}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-6 md:p-7">
            <h2 className="text-lg font-semibold">Configura el regalo</h2>
            <p className="mt-1 text-sm text-muted-foreground">Selecciona servicio y experiencia.</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Servicio</label>
                <select
                  value={selectedService}
                  onChange={(event) => setSelectedService(event.target.value as GiftService)}
                  className={`w-full rounded-xl border bg-background px-3 py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-foreground/20 ${errors.service ? "border-red-500" : "border-border"}`}
                >
                  {SERVICE_OPTIONS.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.label} {service.price > 0 ? `- $${service.price}` : "- Gratis"}
                    </option>
                  ))}
                </select>
                {errors.service ? <p className="mt-1 text-xs text-red-500">{errors.service}</p> : null}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Experiencia</label>
                <select
                  value={selectedProductId}
                  onChange={(event) => setSelectedProductId(event.target.value)}
                  disabled={loadingProducts || productList.length === 0}
                  className={`w-full rounded-xl border bg-background px-3 py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-foreground/20 ${errors.product ? "border-red-500" : "border-border"}`}
                >
                  {productList.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title} - ${product.price}
                    </option>
                  ))}
                </select>
                {errors.product ? <p className="mt-1 text-xs text-red-500">{errors.product}</p> : null}
              </div>

              <div className="rounded-xl border border-border bg-secondary/40 p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Resumen</p>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="flex items-center justify-between"><span>Servicio</span><span className="font-medium">{selectedServiceData?.label ?? "-"}</span></p>
                  <p className="flex items-center justify-between"><span>Experiencia</span><span className="font-medium">{selectedProduct?.title ?? "-"}</span></p>
                  <p className="flex items-center justify-between"><span>Total estimado</span><span className="font-semibold">${((selectedServiceData?.price ?? 0) + (selectedProduct?.price ?? 0)).toFixed(2)}</span></p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGiftCheckout}
                disabled={isSubmitting || loadingProducts || productList.length === 0}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {isSubmitting ? "Abriendo checkout..." : "Continuar al checkout"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <FooterSection />
    </main>
  );
}
