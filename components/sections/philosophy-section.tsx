"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
import { useCart } from "@/context/cart-context";
import { ShoppingCart, Check } from "lucide-react";

export function PhilosophySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [alpineTranslateX, setAlpineTranslateX] = useState(-100);
  const [forestTranslateX, setForestTranslateX] = useState(100);
  const [titleOpacity, setTitleOpacity] = useState(1);
  const rafRef = useRef<number | null>(null);
  const { addItem } = useCart();
  const [addedColectivo, setAddedColectivo] = useState(false);
  const [addedPrivado, setAddedPrivado] = useState(false);

  const handleAddColectivo = () => {
    addItem({
      id: "service-colectivo",
      name: "Servicio Colectivo",
      price: 0,
      image: "/images/service-section/servicio-colective.png",
      type: "service",
    });
    setAddedColectivo(true);
    setTimeout(() => setAddedColectivo(false), 1500);
  };

  const handleAddPrivado = () => {
    addItem({
      id: "service-privado",
      name: "Servicio Privado",
      price: 100,
      image: "/images/service-section/servicio-private.png",
      type: "service",
    });
    setAddedPrivado(true);
    setTimeout(() => setAddedPrivado(false), 1500);
  };

  const updateTransforms = useCallback(() => {
    if (!sectionRef.current) return;
    
    const rect = sectionRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const sectionHeight = sectionRef.current.offsetHeight;
    
    // Calculate progress based on scroll position
    const scrollableRange = sectionHeight - windowHeight;
    const scrolled = -rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / scrollableRange));
    
    // Alpine comes from left (-100% to 0%)
    setAlpineTranslateX((1 - progress) * -100);
    
    // Forest comes from right (100% to 0%)
    setForestTranslateX((1 - progress) * 100);
    
    // Title fades out as blocks come together
    setTitleOpacity(1 - progress);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Cancel any pending animation frame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      // Use requestAnimationFrame for smooth updates
      rafRef.current = requestAnimationFrame(updateTransforms);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateTransforms();
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [updateTransforms]);

  return (
    <section id="services" className="bg-background">
      {/* Scroll-Animated Product Grid */}
      <div ref={sectionRef} className="relative" style={{ height: "200vh" }}>
        <div className="sticky top-0 h-screen flex items-center justify-center">
          <div className="relative w-full">
            {/* Title - positioned behind the blocks */}
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
              style={{ opacity: titleOpacity }}
            >
              <h2 className="text-[7vw] font-medium leading-[0.95] tracking-tighter text-foreground md:text-[6vw] lg:text-[5vw] text-center px-6 font-title whitespace-nowrap">
                Choose One.
              </h2>
            </div>

            {/* Product Grid */}
            <div className="relative z-10 grid grid-cols-1 gap-4 px-6 md:grid-cols-2 md:px-12 lg:px-20">
              {/* Colectivo Image - comes from left */}
              <div 
                className="relative aspect-[4/3] overflow-hidden rounded-2xl cursor-pointer group/colectivo"
                style={{
                  transform: `translate3d(${alpineTranslateX}%, 0, 0)`,
                  WebkitTransform: `translate3d(${alpineTranslateX}%, 0, 0)`,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
                onClick={handleAddColectivo}
                title="Click para agregar al carrito"
              >
                <Image
                  src="/images/service-section/servicio-colective.png"
                  alt="Servicio colectivo"
                  fill
                  className="object-cover transition-transform duration-300 group-hover/colectivo:scale-105"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover/colectivo:bg-black/30 transition-all duration-300 flex items-center justify-center">
                  <div className={`rounded-full p-3 transition-all duration-300 ${addedColectivo ? 'bg-green-500 scale-100' : 'bg-white/80 scale-0 group-hover/colectivo:scale-100'}`}>
                    {addedColectivo ? <Check size={24} className="text-white" /> : <ShoppingCart size={24} className="text-foreground" />}
                  </div>
                </div>
                <div className="absolute bottom-6 left-6">
                  <span className="backdrop-blur-md px-4 py-2 text-sm font-medium rounded-full bg-[rgba(255,255,255,0.2)] text-white">
                    Colectivo — GRATIS
                  </span>
                </div>
              </div>

              {/* Privado Image - comes from right */}
              <div 
                className="relative aspect-[4/3] overflow-hidden rounded-2xl cursor-pointer group/privado"
                style={{
                  transform: `translate3d(${forestTranslateX}%, 0, 0)`,
                  WebkitTransform: `translate3d(${forestTranslateX}%, 0, 0)`,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
                onClick={handleAddPrivado}
                title="Click para agregar al carrito"
              >
                <Image
                  src="/images/service-section/servicio-private.png"
                  alt="Servicio privado"
                  fill
                  className="object-cover transition-transform duration-300 group-hover/privado:scale-105"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover/privado:bg-black/30 transition-all duration-300 flex items-center justify-center">
                  <div className={`rounded-full p-3 transition-all duration-300 ${addedPrivado ? 'bg-green-500 scale-100' : 'bg-white/80 scale-0 group-hover/privado:scale-100'}`}>
                    {addedPrivado ? <Check size={24} className="text-white" /> : <ShoppingCart size={24} className="text-foreground" />}
                  </div>
                </div>
                <div className="absolute bottom-6 left-6">
                  <span className="backdrop-blur-md px-4 py-2 text-sm font-medium rounded-full bg-[rgba(255,255,255,0.2)] text-white">
                    Privado — $100
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-6 py-20 md:px-12 md:py-28 lg:px-20 lg:py-36 lg:pb-14">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Which service should I choose?
          </p>
          <p className="mt-8 leading-relaxed text-muted-foreground text-3xl text-center">
            Explora los caminos de Macao en una caravana de buggies o eleva tu experiencia con nuestro servicio privado, que incluye guía exclusivo y más tiempo en cada parada.
          </p>
        </div>
      </div>
    </section>
  );
}
