"use client";

import { use, useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { getProductBySlug } from "@/lib/products";
import { useCart } from "@/context/cart-context";
import {
  ArrowLeft,
  Clock,
  Users,
  ShoppingCart,
  Check,
  ChevronLeft,
  ChevronRight,
  Shield,
  XCircle,
  CreditCard,
  Globe,
  MapPin,
  AlertTriangle,
} from "lucide-react";

function ProductDetailContent({
  slug,
}: {
  slug: string;
}) {
  const product = getProductBySlug(slug);
  const { addItem, hasServiceSelected, items } = useCart();
  const [currentImage, setCurrentImage] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Touch handling for gallery swipe
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!product) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentImage < product.gallery.length - 1) {
        setCurrentImage((p) => p + 1);
      } else if (diff < 0 && currentImage > 0) {
        setCurrentImage((p) => p - 1);
      }
    }
  };

  const nextImage = useCallback(() => {
    if (!product) return;
    setCurrentImage((p) => (p + 1) % product.gallery.length);
  }, [product]);

  const prevImage = useCallback(() => {
    if (!product) return;
    setCurrentImage((p) => (p - 1 + product.gallery.length) % product.gallery.length);
  }, [product]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [nextImage, prevImage]);

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">Product not found</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-foreground hover:opacity-70 transition-opacity"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const isAlreadyInCart = items.some((item) => item.id === product.id);

  const handleAddToCart = () => {
    if (isAlreadyInCart) return;
    addItem({
      id: product.id,
      name: product.title,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      type: "product",
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation bar */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-20">
          <div className="flex items-center justify-between h-14">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {product.title}
            </p>
            <div className="w-16" />
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl">
        {/* Hero: Gallery + Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-12">
          {/* Gallery */}
          <div className="relative">
            <div
              ref={galleryRef}
              className="relative aspect-[4/3] lg:aspect-[4/3] overflow-hidden bg-secondary/30"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {product.gallery.map((img, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    idx === currentImage ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.title} - ${idx + 1}`}
                    fill
                    className="object-cover"
                    priority={idx === 0}
                  />
                </div>
              ))}

              {/* Gallery navigation */}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-white transition-all opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
                style={{ opacity: currentImage > 0 ? 0.8 : 0 }}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-white transition-all"
                style={{
                  opacity:
                    currentImage < product.gallery.length - 1 ? 0.8 : 0,
                }}
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Dots indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {product.gallery.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImage(idx)}
                    className={`rounded-full transition-all duration-300 ${
                      idx === currentImage
                        ? "w-6 h-1.5 bg-white"
                        : "w-1.5 h-1.5 bg-white/40 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Thumbnail strip - Desktop */}
            <div className="hidden lg:flex gap-2 p-4">
              {product.gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImage(idx)}
                  className={`relative w-14 h-14 rounded-lg overflow-hidden transition-all duration-200 ${
                    idx === currentImage
                      ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                      : "opacity-50 hover:opacity-80"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="px-6 py-6 md:px-12 lg:px-0 lg:py-6 lg:pr-16">
            {/* Category tag */}
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
              {product.description}
            </p>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-medium tracking-tight text-foreground leading-[1.1] font-[family-name:var(--font-trenches)]">
              {product.title}
            </h1>

            {/* Metadata pills */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {product.duration}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-muted-foreground">
                <Users className="h-3 w-3" />
                {product.capacity}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-muted-foreground">
                <Globe className="h-3 w-3" />
                Multilingual
              </span>
            </div>

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl font-semibold text-foreground">
                ${product.price}
              </span>
              {product.originalPrice && (
                <span className="text-base text-muted-foreground line-through">
                  ${product.originalPrice}
                </span>
              )}
              <span className="text-xs text-muted-foreground">USD</span>
            </div>

            {/* Add to cart */}
            <div className="mt-4 space-y-2">
              {!hasServiceSelected && (
                <Link
                  href="/#products"
                  className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-600 dark:text-amber-400 transition-colors hover:bg-amber-500/10"
                >
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  Select a service type first (Collective or Private)
                </Link>
              )}
              <button
                onClick={handleAddToCart}
                disabled={!hasServiceSelected || isAlreadyInCart}
                className={`w-full flex items-center justify-center gap-2.5 rounded-full px-6 py-3 text-sm font-medium uppercase tracking-wider transition-all duration-300 ${
                  isAlreadyInCart || isAdded
                    ? "bg-green-500/10 text-green-600 border border-green-500/20"
                    : !hasServiceSelected
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-foreground text-background hover:opacity-90 active:scale-[0.98]"
                }`}
              >
                {isAlreadyInCart || isAdded ? (
                  <>
                    <Check className="h-4 w-4" />
                    Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </>
                )}
              </button>
            </div>

            {/* Highlights */}
            <div className="mt-5">
              <h3 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                Highlights
              </h3>
              <ul className="space-y-1">
                {product.highlights.map((h, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-sm text-foreground/80"
                  >
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-foreground/30 shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            {/* Thin separator */}
            <div className="h-px bg-border my-5" />

            {/* Quick policies */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2.5">
                <Shield className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Free Cancellation
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Up to 24h in advance
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CreditCard className="h-4 w-4 text-foreground/60 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Book Now, Pay Later
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Just $20 USD deposit
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content sections below */}
        <div className="px-6 md:px-12 lg:px-20">
          {/* Itinerary + General Information side by side */}
          <section className="py-16 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20">
              {/* Left: Itinerary */}
              <div>
                <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-foreground font-[family-name:var(--font-trenches)]">
                  Your Itinerary
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  A carefully crafted journey through the best of Macao
                </p>

                <div className="mt-10">
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

                    <div className="space-y-8">
                      {product.itinerary.map((stop, idx) => (
                        <div key={idx} className="relative pl-10">
                          {/* Timeline dot */}
                          <div className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2 border-foreground/20 bg-background" />

                          <div>
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                              <h3 className="text-base font-medium text-foreground">
                                {stop.title}
                              </h3>
                              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                                {stop.duration}
                              </span>
                            </div>
                            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                              {stop.description}
                            </p>
                            {stop.details && stop.details.length > 0 && (
                              <ul className="mt-2 space-y-1">
                                {stop.details.map((detail, dIdx) => (
                                  <li
                                    key={dIdx}
                                    className="flex items-start gap-2 text-sm text-muted-foreground"
                                  >
                                    <span className="mt-2 h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
                                    {detail}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: General Information */}
              <div>
                <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-foreground font-[family-name:var(--font-trenches)]">
                  General Information
                </h2>

                <div className="mt-10 space-y-8">
                  {/* Important */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <h3 className="text-sm font-medium text-foreground uppercase tracking-wider">
                        Very Important
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {product.generalInfo.minAge}
                    </p>
                  </div>

                  {/* Not Allowed */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <h3 className="text-sm font-medium text-foreground uppercase tracking-wider">
                        Not Allowed
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {product.generalInfo.notAllowed}
                    </p>
                  </div>

                  {/* Free Cancellation */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <h3 className="text-sm font-medium text-foreground uppercase tracking-wider">
                        Free Cancellation
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {product.generalInfo.freeCancellation}
                    </p>
                  </div>

                  {/* Book Now Pay Later */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-foreground/60" />
                      <h3 className="text-sm font-medium text-foreground uppercase tracking-wider">
                        Book Now, Pay Later
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {product.generalInfo.bookNowPayLater}
                    </p>
                  </div>

                  {/* Duration & Guide - side by side */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-foreground/60" />
                        <h3 className="text-sm font-medium text-foreground uppercase tracking-wider">
                          Duration
                        </h3>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {product.generalInfo.duration}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-foreground/60" />
                        <h3 className="text-sm font-medium text-foreground uppercase tracking-wider">
                          Guide
                        </h3>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {product.generalInfo.guide}
                      </p>
                    </div>
                  </div>

                  {/* Pickup Service */}
                  <div className="space-y-2 pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-foreground/60" />
                      <h3 className="text-sm font-medium text-foreground uppercase tracking-wider">
                        Pickup Service
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {product.generalInfo.pickupService}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sticky bottom bar - Mobile */}
        <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-background/80 backdrop-blur-xl border-t border-border/50 px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {product.description}
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-semibold text-foreground">
                ${product.price}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  ${product.originalPrice}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!hasServiceSelected || isAlreadyInCart}
            className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all ${
              isAlreadyInCart || isAdded
                ? "bg-green-500/10 text-green-600 border border-green-500/20"
                : !hasServiceSelected
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-foreground text-background hover:opacity-90 active:scale-[0.98]"
            }`}
          >
            {isAlreadyInCart || isAdded ? (
              <>
                <Check className="h-4 w-4" />
                <span className="hidden sm:inline">Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Add to Cart</span>
              </>
            )}
          </button>
        </div>

        {/* Bottom spacer for mobile sticky bar */}
        <div className="h-20 lg:hidden" />
      </div>
    </main>
  );
}

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);

  return (
    <ProductDetailContent slug={resolvedParams.slug} />
  );
}
