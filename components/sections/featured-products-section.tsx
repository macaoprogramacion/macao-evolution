"use client";

import { FadeImage } from "@/components/fade-image";
import { useCart } from "@/context/cart-context";
import { ShoppingCart, Check, ArrowRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { products as fallbackProducts, fetchProducts, type Product } from "@/lib/products";

export function FeaturedProductsSection() {
  const { addItem } = useCart();
  const [addedId, setAddedId] = useState<string | null>(null);
  const [productList, setProductList] = useState<Product[]>(fallbackProducts);

  // Fetch products from Supabase on mount
  useEffect(() => {
    fetchProducts().then((data) => {
      if (data.length > 0) {
        const merged = [...data];
        for (const fallback of fallbackProducts) {
          if (!merged.some((p) => p.slug === fallback.slug)) {
            merged.push(fallback);
          }
        }
        setProductList(merged);
      }
    });
  }, []);

  const handleAddProduct = (feature: Product) => {
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
        <h2 className="text-3xl font-medium tracking-tight text-foreground md:text-4xl lg:text-5xl font-title select-none">
          Choose Your Experience
        </h2>
        <p className="mx-auto mt-6 max-w-md text-sm text-muted-foreground">
          with our premium services
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-2 gap-4 px-6 pb-20 md:px-12 lg:px-20">
        {productList.map((feature) => {
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
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                quality={75}
                loading="lazy"
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
                className="inline-flex items-center gap-1.5 mt-3 text-xs uppercase tracking-[0.15em] text-red-600 hover:text-red-700 transition-colors group/link"
              >
                View Details
                <ArrowRight className="h-3 w-3 text-red-600 transition-transform group-hover/link:translate-x-0.5" />
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
