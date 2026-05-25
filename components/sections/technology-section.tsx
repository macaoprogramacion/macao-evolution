"use client";

import Image from "next/image";

const sideImages = [
  {
    src: "/images/paradas/columna (2).webp",
    alt: "Typical House",
  },
  {
    src: "/images/paradas/columna (3).webp",
    alt: "Taino Cave",
  },
  {
    src: "/images/paradas/columna (4).webp",
    alt: "Macao Beach",
  },
];

export function TechnologySection() {
  return (
    <section className="relative bg-foreground">
      <div className="relative overflow-hidden px-6 py-20 md:px-12 lg:px-20">
        <div className="grid grid-cols-1 gap-4 place-items-center md:grid-cols-3 md:place-items-stretch">
          {sideImages.map((img, idx) => (
            <div key={idx} className="relative w-full max-w-[320px] overflow-hidden rounded-2xl aspect-[9/16] md:max-w-none">
              <Image
                src={img.src || "/placeholder.svg"}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 80vw, 33vw"
                quality={88}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden bg-background px-6 py-24 md:px-12 md:py-32 lg:px-20 lg:py-40">
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-medium tracking-tight text-foreground md:text-4xl lg:text-5xl font-title">
              Tour Itinerary
            </h2>
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-foreground" />
                <span className="text-sm text-muted-foreground">Horseback Ride: <strong className="text-foreground">20 min</strong> per stop</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-sm text-muted-foreground">Dune Buggy: <strong className="text-foreground">35 min</strong> per stop</span>
              </div>
            </div>
          </div>

          {/* Itinerary Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Elite Couple Experience", stops: ["Typical Dominican House", "Indigenous Cave", "Macao Beach"] },
              { name: "Elite Family Experience", stops: ["Typical Dominican House", "Indigenous Cave", "Macao Beach"] },
              { name: "APEX PREDACTOR", stops: ["Typical Dominican House", "Indigenous Cave", "Macao Beach"] },
              { name: "PREDATORY FAMILY EXPERIENCE", stops: ["Typical Dominican House", "Indigenous Cave", "Macao Beach"] },
              { name: "FLINTSTONE ERA", stops: ["Typical Dominican House", "Indigenous Cave", "Macao Beach"] },
              { name: "THE FLINTSTONES FAMILY", stops: ["Typical Dominican House", "Indigenous Cave", "Macao Beach"] },
              { name: "ATV QUAD EXPERIENCE", stops: ["Typical Dominican House", "Indigenous Cave", "Macao Beach"] },
              { name: "THE COMBINED", stops: ["Horseback Riding (15 min)", "Typical Dominican House", "Indigenous Cave", "Macao Beach"] },
              { name: "FULL RIDE EXPERIENCE", stops: ["Typical Dominican House", "Macao Beach"] },
            ].map((product) => (
              <div key={product.name} className="rounded-2xl border border-border p-5 hover:bg-secondary/30 transition-colors">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
                  {product.name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.stops.map((stop, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-600"
                    >
                      <span className="text-[10px] font-bold text-red-400">{idx + 1}</span>
                      {stop}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
