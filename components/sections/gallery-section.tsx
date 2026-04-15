"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";

export function GallerySection() {
  const galleryRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sectionHeight, setSectionHeight] = useState("100vh");
  const rafRef = useRef<number | null>(null);
  const isMobileRef = useRef(false);

  // DOM ref for direct transform manipulation (desktop only)
  const transformRef = useRef<HTMLDivElement>(null);

  const images = [
    { src: "/images/gallery-section/gallery (1).webp", alt: "GalerÃ­a Macao 1" },
    { src: "/images/gallery-section/gallery (2).webp", alt: "GalerÃ­a Macao 2" },
    { src: "/images/gallery-section/gallery (3).webp", alt: "GalerÃ­a Macao 3" },
    { src: "/images/gallery-section/gallery (4).webp", alt: "GalerÃ­a Macao 4" },
    { src: "/images/gallery-section/gallery (5).webp", alt: "GalerÃ­a Macao 5" },
    { src: "/images/gallery-section/gallery (6).webp", alt: "GalerÃ­a Macao 6" },
    { src: "/images/gallery-section/gallery (7).webp", alt: "GalerÃ­a Macao 7" },
    { src: "/images/gallery-section/gallery (8).webp", alt: "GalerÃ­a Macao 8" },
    { src: "/images/gallery-section/gallery (9).webp", alt: "GalerÃ­a Macao 9" },
    { src: "/images/gallery-section/gallery (10).webp", alt: "GalerÃ­a Macao 10" },
    { src: "/images/gallery-section/gallery (11).webp", alt: "GalerÃ­a Macao 11" },
    { src: "/images/gallery-section/gallery (12).webp", alt: "GalerÃ­a Macao 12" },
    { src: "/images/gallery-section/gallery (13).webp", alt: "GalerÃ­a Macao 13" },
    { src: "/images/gallery-section/gallery (14).webp", alt: "GalerÃ­a Macao 14" },
    { src: "/images/gallery-section/gallery (15).webp", alt: "GalerÃ­a Macao 15" },
  ];

  // Calculate section height (desktop only)
  useEffect(() => {
    const checkMobile = () => {
      isMobileRef.current = window.innerWidth < 768;
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const calculateHeight = () => {
      if (!containerRef.current || isMobileRef.current) {
        setSectionHeight("auto");
        return;
      }
      const containerWidth = containerRef.current.scrollWidth;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const totalHeight = viewportHeight + (containerWidth - viewportWidth);
      setSectionHeight(`${totalHeight}px`);
    };

    const timer = setTimeout(calculateHeight, 100);
    window.addEventListener("resize", calculateHeight);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculateHeight);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const updateTransform = useCallback(() => {
    if (!galleryRef.current || !containerRef.current || !transformRef.current) return;
    
    const rect = galleryRef.current.getBoundingClientRect();
    const containerWidth = containerRef.current.scrollWidth;
    const viewportWidth = window.innerWidth;
    const totalScrollDistance = containerWidth - viewportWidth;
    const scrolled = Math.max(0, -rect.top);
    const progress = Math.min(1, scrolled / totalScrollDistance);
    const translateX = progress * -totalScrollDistance;
    
    transformRef.current.style.transform = `translate3d(${translateX}px, 0, 0)`;
  }, []);

  useEffect(() => {
    if (isMobileRef.current) return; // No scroll animation on mobile

    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateTransform);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateTransform();
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [updateTransform]);

  return (
    <section 
      id="gallery"
      ref={galleryRef}
      className="relative bg-background"
      style={{ height: sectionHeight }}
    >
      {/* â”€â”€ MOBILE: native horizontal scroll â”€â”€ */}
      <div className="md:hidden overflow-x-auto scrollbar-hide py-6">
        <div className="flex gap-4 px-6" style={{ width: 'max-content' }}>
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

      {/* â”€â”€ DESKTOP: scroll-hijack horizontal â”€â”€ */}
      <div className="hidden md:block sticky top-0 h-screen overflow-hidden">
        <div className="flex h-full items-center">
          <div 
            ref={(el) => {
              containerRef.current = el;
              transformRef.current = el;
            }}
            className="flex gap-6 px-6"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              willChange: 'transform',
            }}
          >
            {images.map((image, index) => (
              <div
                key={index}
                className="relative h-[70vh] w-[60vw] flex-shrink-0 overflow-hidden rounded-2xl lg:w-[45vw]"
                style={{
                  transform: 'translateZ(0)',
                  WebkitTransform: 'translateZ(0)',
                }}
              >
                <Image
                  src={image.src || "/placeholder.svg"}
                  alt={image.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 60vw, 45vw"
                  quality={75}
                  priority={index < 2}
                  loading={index < 2 ? undefined : "lazy"}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
