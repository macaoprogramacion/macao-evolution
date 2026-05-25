"use client";

import Image from "next/image";
import { useMemo } from "react";

export function GallerySection() {
  const images = useMemo(() => [
    { src: "/images/gallery-section/gallery (1).webp", alt: "GalerÃ­a Macao 1" },
    { src: "/images/gallery-section/gallery (2).webp", alt: "GalerÃ­a Macao 2" },
    { src: "/images/gallery-section/gallery (3).webp", alt: "GalerÃ­a Macao 3" },
    { src: "/images/gallery-section/gallery (4).webp", alt: "GalerÃ­a Macao 4" },
    { src: "/images/gallery-section/gallery (5).webp", alt: "GalerÃ­a Macao 5" },
  ], []);

  return (
    <section id="gallery" className="bg-background px-6 pb-20 md:px-12 lg:px-20">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-medium tracking-tight text-foreground md:text-4xl lg:text-5xl font-title">
          Gallery
        </h2>
      </div>
      <div className="md:hidden overflow-x-auto scrollbar-hide py-2">
        <div className="flex gap-4" style={{ width: "max-content" }}>
          {images.map((image, index) => (
            <div
              key={index}
              className="relative h-[60vh] w-[80vw] flex-shrink-0 overflow-hidden rounded-2xl"
            >
              <Image
                src={image.src || "/placeholder.svg"}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="80vw"
                quality={75}
                priority={index < 2}
                loading={index < 2 ? undefined : "lazy"}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="hidden md:grid grid-cols-2 gap-6 lg:grid-cols-3">
        {images.map((image, index) => (
          <div
            key={index}
            className="relative h-[52vh] overflow-hidden rounded-2xl"
          >
            <Image
              src={image.src || "/placeholder.svg"}
              alt={image.alt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 50vw, 33vw"
              quality={75}
              priority={index < 2}
              loading={index < 2 ? undefined : "lazy"}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
