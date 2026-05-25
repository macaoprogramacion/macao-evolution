"use client";

import Image from "next/image";
import { useMemo } from "react";

const heroLogoSrc = "/Logo PNG/MACAO LOGO_Mesa de trabajo 1.png";

const sideImages = [
  {
    src: "/images/hero-secction/hero-seccion (1).webp",
    alt: "Buggy tour en Punta Cana - aventura offroad",
    position: "left",
    span: 1,
  },
  {
    src: "/images/hero-secction/hero-seccion (2).webp",
    alt: "Excursion en buggy por la playa de Macao",
    position: "left",
    span: 1,
  },
  {
    src: "/images/hero-secction/hero-seccion (3).webp",
    alt: "Grupo disfrutando experiencia offroad Macao",
    position: "right",
    span: 1,
  },
  {
    src: "/images/hero-secction/hero-seccion (4).webp",
    alt: "Tour en ATV por las rutas de Punta Cana",
    position: "right",
    span: 1,
  },
];

export function HeroSection() {
  const leftImages = useMemo(() => sideImages.filter((img) => img.position === "left"), []);
  const rightImages = useMemo(() => sideImages.filter((img) => img.position === "right"), []);

  return (
    <section className="relative bg-background">
      <div className="h-screen overflow-hidden">
        <div className="flex h-full w-full items-center justify-center">
          <div
            className="relative flex h-full w-full items-stretch justify-center"
            style={{ gap: "16px", padding: "16px", paddingBottom: "24px" }}
          >
            <div
              className="hidden lg:flex flex-col"
              style={{ width: "22%", gap: "16px" }}
            >
              {leftImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative overflow-hidden rounded-2xl"
                  style={{ flex: img.span }}
                >
                  <Image
                    src={img.src || "/placeholder.svg"}
                    alt={img.alt}
                    fill
                    className="object-cover"
                    sizes="22vw"
                    quality={70}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>

            <div
              className="relative overflow-hidden rounded-2xl"
              style={{ width: "100%", height: "100%", flex: "0 0 auto" }}
            >
              <Image
                src="/images/foto-con-dimecion-arreglada/foto-principal..webp"
                alt="Buggy aventura en Punta Cana"
                fill
                className="object-cover"
                sizes="100vw"
                quality={75}
                priority
              />

              <div className="absolute inset-0 bg-black/40" />

              <div className="lg:hidden absolute inset-0 pointer-events-none">
                <Image
                  src={heroLogoSrc}
                  alt="MACAO Logo"
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>

              <div className="hidden lg:block absolute inset-0 pointer-events-none">
                <Image
                  src={heroLogoSrc}
                  alt="MACAO Logo"
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>
            </div>

            <div
              className="hidden lg:flex flex-col"
              style={{ width: "22%", gap: "16px" }}
            >
              {rightImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative overflow-hidden rounded-2xl"
                  style={{ flex: img.span }}
                >
                  <Image
                    src={img.src || "/placeholder.svg"}
                    alt={img.alt}
                    fill
                    className="object-cover"
                    sizes="22vw"
                    quality={70}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
