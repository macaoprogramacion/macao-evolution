"use client";

import { FadeImage } from "@/components/fade-image";
import { useCart } from "@/context/cart-context";
import { ShoppingCart, Check, AlertCircle, ArrowRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { products } from "@/lib/products";

export function FeaturedProductsSection() {
  const { addItem, hasServiceSelected } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);
  const [showServiceWarning, setShowServiceWarning] = useState(false);

  // Auto-hide warning when service is selected
  useEffect(() => {
    if (hasServiceSelected) {
      setShowServiceWarning(false);
    }
  }, [hasServiceSelected]);

  const handleAddProduct = (feature: typeof products[0]) => {
    // Check if a service is selected first
    if (!hasServiceSelected) {
      // Scroll to service section
      const serviceSection = document.getElementById("services");
      if (serviceSection) {
        serviceSection.scrollIntoView({ behavior: "smooth" });
      }
      // Show subtle toast message
      toast("Selecciona un tipo de servicio primero", {
        description: "Debes elegir entre Colectivo o Privado antes de seleccionar un buggy.",
        icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
        duration: 4000,
        position: "top-center",
      });
      setShowServiceWarning(true);
      return;
    }

    const id = feature.id;
    addItem({
      id,
      name: feature.title,
      price: feature.price,
      originalPrice: feature.originalPrice,
      image: feature.image,
      type: "product",
    });
    setAddedId(id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <section id="products" className="bg-background">
      {/* Section Title */}
      <div className="px-6 py-20 text-center md:px-12 md:py-28 lg:px-20 lg:py-32 lg:pb-20">
        <h2 className="text-3xl font-medium tracking-tight text-foreground md:text-4xl lg:text-5xl font-title">
          Choose Your Experience
        </h2>
        <p className="mx-auto mt-6 max-w-md text-sm text-muted-foreground">
          with our premium services
        </p>
      </div>

      {/* Service Warning Banner */}
      {showServiceWarning && !hasServiceSelected && (
        <div className="mx-6 mb-6 md:mx-12 lg:mx-20 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Primero selecciona un tipo de servicio (Colectivo o Privado) para poder elegir tu buggy.
            </p>
          </div>
        </div>
      )}

      {/* Features Grid */}
      <div className={`grid grid-cols-1 gap-4 px-6 pb-20 md:grid-cols-3 md:px-12 lg:px-20 transition-opacity duration-300 ${!hasServiceSelected ? 'opacity-60' : 'opacity-100'}`}>
        {products.map((feature) => {
          const productId = feature.id;
          const isAdded = addedId === productId;
          return (
          <div key={feature.title} className="group">
            {/* Image - Click to add to cart */}
            <div
              className="relative aspect-[4/3] overflow-hidden rounded-2xl cursor-pointer"
              onClick={() => handleAddProduct(feature)}
              title="Click para agregar al carrito"
            >
              <FadeImage
                src={feature.image || "/placeholder.svg"}
                alt={feature.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Hover overlay with cart icon */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                <div className={`rounded-full p-3 transition-all duration-300 ${isAdded ? 'bg-green-500 scale-100' : 'bg-white/80 scale-0 group-hover:scale-100'}`}>
                  {isAdded ? <Check size={24} className="text-white" /> : <ShoppingCart size={24} className="text-foreground" />}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="py-6">
              <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
                {feature.description}
              </p>
              <h3 className="text-foreground text-xl font-semibold">
                {feature.title}
              </h3>
              <Link
                href={`/product/${feature.slug}`}
                className="inline-flex items-center gap-1.5 mt-3 text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors group/link"
              >
                View Details
                <ArrowRight className="h-3 w-3 transition-transform group-hover/link:translate-x-0.5" />
              </Link>
            </div>
          </div>
          );
        })}
      </div>

      {/* CTA Link */}
      <div className="flex justify-center px-6 pb-28 md:px-12 lg:px-20">
        
      </div>
    </section>
  );
}
