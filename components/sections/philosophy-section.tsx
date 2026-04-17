"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
import { useCart } from "@/context/cart-context";
import { ShoppingCart, Check } from "lucide-react";

export function PhilosophySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const isMobileRef = useRef(false);
  const { addItem, getConflictingService, replaceService } = useCart();
  const [addedColectivo, setAddedColectivo] = useState(false);
  const [addedPrivado, setAddedPrivado] = useState(false);

  // DOM refs for direct manipulation
  const titleRef = useRef<HTMLDivElement>(null);
  const colectivoRef = useRef<HTMLDivElement>(null);
  const privadoRef = useRef<HTMLDivElement>(null);

  const colectivoItem = {
    id: "service-colectivo",
    name: "Servicio Colectivo",
    price: 0,
    image: "/images/service-section/servicio-colective.webp",
    type: "service" as const,
  };

  const privadoItem = {
    id: "service-privado",
    name: "Servicio Privado",
    price: 100,
    image: "/images/service-section/servicio-private.webp",
    type: "service" as const,
  };

  const handleAddColectivo = () => {
    const conflict = getConflictingService("service-colectivo");
    if (conflict) {
      if (!confirm(`Ya tienes "${conflict.name}" en tu carrito. ¿Deseas cambiarlo por "Servicio Colectivo"?`)) return;
      replaceService(conflict.id, colectivoItem);
    } else {
      addItem(colectivoItem);
    }
    setAddedColectivo(true);
    setTimeout(() => setAddedColectivo(false), 1500);
  };

  const handleAddPrivado = () => {
    const conflict = getConflictingService("service-privado");
    if (conflict) {
      if (!confirm(`Ya tienes "${conflict.name}" en tu carrito. ¿Deseas cambiarlo por "Servicio Privado"?`)) return;
      replaceService(conflict.id, privadoItem);
    } else {
      addItem(privadoItem);
    }
    setAddedPrivado(true);
    setTimeout(() => setAddedPrivado(false), 1500);
  };

  const updateTransforms = useCallback(() => {
    if (!sectionRef.current) return;
    
    const rect = sectionRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const sectionHeight = sectionRef.current.offsetHeight;
    
    const scrollableRange = sectionHeight - windowHeight;
    const scrolled = -rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / scrollableRange));
    
    // Apply directly to DOM — no re-renders
    if (colectivoRef.current) {
      colectivoRef.current.style.transform = `translate3d(${(1 - progress) * -100}%, 0, 0)`;
    }
    if (privadoRef.current) {
      privadoRef.current.style.transform = `translate3d(${(1 - progress) * 100}%, 0, 0)`;
    }
    if (titleRef.current) {
      titleRef.current.style.opacity = `${1 - progress}`;
    }
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      isMobileRef.current = window.innerWidth < 768;
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const handleScroll = () => {
      // Cancel any pending animation frame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      // Use requestAnimationFrame for smooth updates
      rafRef.current = requestAnimationFrame(updateTransforms);
    };

    // Only run scroll animation on desktop
    if (!isMobileRef.current) {
      window.addEventListener("scroll", handleScroll, { passive: true });
      updateTransforms();
    } else {
      // Mobile: show cards immediately (no animation)
      if (colectivoRef.current) {
        colectivoRef.current.style.transform = 'none';
      }
      if (privadoRef.current) {
        privadoRef.current.style.transform = 'none';
      }
      if (titleRef.current) {
        titleRef.current.style.display = 'none';
      }
    }
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkMobile);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [updateTransforms]);

  return (
    <section id="services" className="bg-background">
      {/* Scroll-Animated Product Grid — static on mobile, animated on desktop */}
      <div ref={sectionRef} className="relative md:h-[200vh]">
        <div className="md:sticky md:top-0 md:h-screen flex items-center justify-center py-10 md:py-0">
          <div className="relative w-full">
            {/* Title - positioned behind the blocks */}
            <div 
              ref={titleRef}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
              style={{ opacity: 1 }}
            >
              <h2 className="text-[7vw] font-medium leading-[0.95] tracking-tighter text-foreground md:text-[6vw] lg:text-[5vw] text-center px-6 font-title whitespace-nowrap">
                Choose One.
              </h2>
            </div>

            {/* Product Grid */}
            <div className="relative z-10 grid grid-cols-1 gap-4 px-6 md:grid-cols-2 md:px-12 lg:px-20">
              {/* Colectivo Image - comes from left */}
              <div 
                ref={colectivoRef}
                className="relative aspect-[4/3] overflow-hidden rounded-2xl cursor-pointer group/colectivo will-change-transform"
                style={{
                  transform: 'translate3d(-100%, 0, 0)',
                  backfaceVisibility: 'hidden',
                }}
                onClick={handleAddColectivo}
                title="Click para agregar al carrito"
              >
                <Image
                  src="/images/service-section/servicio-colective.webp"
                  alt="Servicio colectivo"
                  fill
                  className="object-cover transition-transform duration-300 group-hover/colectivo:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  quality={75}
                  loading="lazy"
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
                ref={privadoRef}
                className="relative aspect-[4/3] overflow-hidden rounded-2xl cursor-pointer group/privado will-change-transform"
                style={{
                  transform: 'translate3d(100%, 0, 0)',
                  backfaceVisibility: 'hidden',
                }}
                onClick={handleAddPrivado}
                title="Click para agregar al carrito"
              >
                <Image
                  src="/images/service-section/servicio-private.webp"
                  alt="Servicio privado"
                  fill
                  className="object-cover transition-transform duration-300 group-hover/privado:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  quality={75}
                  loading="lazy"
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
