"use client";

import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/context/cart-context";
import { ShoppingCart, Check } from "lucide-react";

export function PhilosophySection() {
  const { addItem, getConflictingService, replaceService } = useCart();
  const [addedHorseback, setAddedHorseback] = useState(false);
  const [addedDuneBuggy, setAddedDuneBuggy] = useState(false);

  const horsebackItem = {
    id: "service-horseback-ride",
    name: "Horseback Ride",
    price: 60,
    image: "/images/service-section/servicio-caballos.png",
    type: "service" as const,
  };

  const duneBuggyItem = {
    id: "service-dune-buggy",
    name: "Dune Buggy",
    price: 85,
    image: "/images/service-section/servicio-buggies.png",
    type: "service" as const,
  };

  const handleAddHorseback = () => {
    const conflict = getConflictingService("service-horseback-ride");
    if (conflict) {
      if (!confirm(`Ya tienes "${conflict.name}" en tu carrito. ¿Deseas cambiarlo por "Horseback Ride"?`)) return;
      replaceService(conflict.id, horsebackItem);
    } else {
      addItem(horsebackItem);
    }
    setAddedHorseback(true);
    setTimeout(() => setAddedHorseback(false), 1500);
  };

  const handleAddDuneBuggy = () => {
    const conflict = getConflictingService("service-dune-buggy");
    if (conflict) {
      if (!confirm(`Ya tienes "${conflict.name}" en tu carrito. ¿Deseas cambiarlo por "Dune Buggy"?`)) return;
      replaceService(conflict.id, duneBuggyItem);
    } else {
      addItem(duneBuggyItem);
    }
    setAddedDuneBuggy(true);
    setTimeout(() => setAddedDuneBuggy(false), 1500);
  };

  return (
    <section id="services" className="bg-background">
      <div className="px-6 py-20 text-center md:px-12 md:py-24 lg:px-20 lg:py-28">
        <h2 className="text-4xl font-medium leading-[0.95] tracking-tight text-foreground md:text-5xl lg:text-6xl font-title">
          Choose One.
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 pb-12 lg:grid-cols-2 lg:px-12 xl:px-20">
        <div
          className="relative aspect-[4/3] overflow-hidden rounded-2xl cursor-pointer group/horseback"
          onClick={handleAddHorseback}
          title="Click para agregar al carrito"
        >
                <Image
                  src="/images/service-section/servicio-caballos.png"
                  alt="Horseback Ride"
                  fill
                  className="object-cover transition-transform duration-300 group-hover/horseback:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  quality={75}
                  loading="lazy"
                />
          <div className="absolute inset-0 bg-black/0 group-hover/horseback:bg-black/30 transition-all duration-300 flex items-center justify-center">
            <div className={`rounded-full p-3 transition-all duration-300 ${addedHorseback ? 'bg-green-500 scale-100' : 'bg-white/80 scale-0 group-hover/horseback:scale-100'}`}>
              {addedHorseback ? <Check size={24} className="text-white" /> : <ShoppingCart size={24} className="text-foreground" />}
            </div>
          </div>
          <div className="absolute bottom-6 left-6">
            <span className="backdrop-blur-md px-5 py-2.5 text-base md:text-lg font-semibold rounded-full bg-[rgba(255,255,255,0.2)] text-white">
              Horseback Ride desde 60 USD
            </span>
          </div>
        </div>

        <div
          className="relative aspect-[4/3] overflow-hidden rounded-2xl cursor-pointer group/dune"
          onClick={handleAddDuneBuggy}
          title="Click para agregar al carrito"
        >
          <Image
            src="/images/service-section/servicio-buggies.png"
            alt="Dune Buggy"
            fill
            className="object-cover transition-transform duration-300 group-hover/dune:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
            quality={75}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover/dune:bg-black/30 transition-all duration-300 flex items-center justify-center">
            <div className={`rounded-full p-3 transition-all duration-300 ${addedDuneBuggy ? 'bg-green-500 scale-100' : 'bg-white/80 scale-0 group-hover/dune:scale-100'}`}>
              {addedDuneBuggy ? <Check size={24} className="text-white" /> : <ShoppingCart size={24} className="text-foreground" />}
            </div>
          </div>
          <div className="absolute bottom-6 left-6">
            <span className="backdrop-blur-md px-5 py-2.5 text-base md:text-lg font-semibold rounded-full bg-[rgba(255,255,255,0.2)] text-white">
              Dune Buggy desde - 85 USD
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 py-20 md:px-12 md:py-28 lg:px-20 lg:py-36 lg:pb-14">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Which service should I choose?
          </p>
          <p className="mt-8 leading-relaxed text-muted-foreground text-3xl text-center">
            Elige entre Horseback Ride o Dune Buggy para comenzar tu experiencia y luego selecciona el tour ideal para tu aventura.
          </p>
        </div>
      </div>
    </section>
  );
}
