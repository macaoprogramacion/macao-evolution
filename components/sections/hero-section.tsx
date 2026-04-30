"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const word = "MACAO";

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
  const sectionRef = useRef<HTMLElement>(null);
  const rafRef = useRef<number | null>(null);
  const isMobileRef = useRef(false);

  // DOM refs for direct manipulation (no React re-renders)
  const gridRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const leftCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const rightCardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const checkMobile = () => {
      isMobileRef.current = window.innerWidth < 768;
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const applyStyles = () => {
      if (!sectionRef.current) return;

      // â”€â”€ MOBILE: No animation at all â€” static hero image â”€â”€
      if (isMobileRef.current) return;

      // â”€â”€ DESKTOP: scroll-driven slide-in animation â”€â”€
      const rect = sectionRef.current.getBoundingClientRect();
      const scrollableHeight = sectionRef.current.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollableHeight));

      // Text fades out first
      const textOpacity = Math.max(0, 1 - (progress / 0.12));

      if (textRef.current) {
        textRef.current.style.opacity = `${textOpacity}`;
      }

      const ip = Math.max(0, Math.min(1, (progress - 0.08) / 0.92));

      const centerWidth = 100 - (ip * 58);
      const centerHeight = 100 - (ip * 30);
      const sideWidth = ip * 22;
      const sideOpacity = ip;
      const sideTranslateLeft = -100 + (ip * 100);
      const sideTranslateRight = 100 - (ip * 100);
      const borderRadius = ip * 24;
      const gap = ip * 16;
      const sideTranslateY = -(ip * 15);

      if (gridRef.current) {
        gridRef.current.style.gap = `${gap}px`;
        gridRef.current.style.padding = `${ip * 16}px`;
        gridRef.current.style.paddingBottom = `${60 + (ip * 40)}px`;
      }

      if (leftColRef.current) {
        leftColRef.current.style.width = `${sideWidth}%`;
        leftColRef.current.style.gap = `${gap}px`;
        leftColRef.current.style.transform = `translate3d(${sideTranslateLeft}%, ${sideTranslateY}%, 0)`;
        leftColRef.current.style.opacity = `${sideOpacity}`;
      }

      if (rightColRef.current) {
        rightColRef.current.style.width = `${sideWidth}%`;
        rightColRef.current.style.gap = `${gap}px`;
        rightColRef.current.style.transform = `translate3d(${sideTranslateRight}%, ${sideTranslateY}%, 0)`;
        rightColRef.current.style.opacity = `${sideOpacity}`;
      }

      if (centerRef.current) {
        centerRef.current.style.width = `${centerWidth}%`;
        centerRef.current.style.height = `${centerHeight}%`;
        centerRef.current.style.borderRadius = `${borderRadius}px`;
        centerRef.current.style.transform = 'none';
      }

      leftCardsRef.current.forEach((el) => {
        if (el) {
          el.style.borderRadius = `${borderRadius}px`;
          el.style.opacity = '1';
          el.style.transform = 'none';
        }
      });
      rightCardsRef.current.forEach((el) => {
        if (el) {
          el.style.borderRadius = `${borderRadius}px`;
          el.style.opacity = '1';
          el.style.transform = 'none';
        }
      });
    };

    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(applyStyles);
    };

    // Only add scroll listener on desktop
    if (!isMobileRef.current) {
      window.addEventListener("scroll", handleScroll, { passive: true });
    }
    applyStyles();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkMobile);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-background">
      {/* Sticky container for scroll animation */}
      <div className="md:sticky md:top-0 h-screen overflow-hidden">
        <div className="flex h-full w-full items-center justify-center">
          {/* Bento Grid Container */}
          <div
            ref={gridRef}
            className="relative flex h-full w-full items-stretch justify-center"
            style={{ gap: 0, padding: 0, paddingBottom: "60px" }}
          >

            {/* Left Column â€” hidden on mobile */}
            <div
              ref={leftColRef}
              className="hidden md:flex flex-col will-change-transform"
              style={{ width: "0%", gap: 0, transform: "translate3d(-100%, 0, 0)", opacity: 0 }}
            >
              {sideImages.filter(img => img.position === "left").map((img, idx) => (
                <div
                  key={idx}
                  ref={(el) => { leftCardsRef.current[idx] = el; }}
                  className="relative overflow-hidden will-change-transform"
                  style={{ flex: img.span, borderRadius: 0 }}
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

            {/* Main Hero Image - Center */}
            <div
              ref={centerRef}
              className="relative overflow-hidden will-change-transform"
              style={{ width: "100%", height: "100%", flex: "0 0 auto", borderRadius: 0 }}
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

              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-black/40" />

              {/* Overlay Text - Fades out first */}
              <div
                ref={textRef}
                className="absolute inset-0 flex items-center md:items-end justify-center overflow-hidden select-none"
                style={{ opacity: 1 }}
              >
                <h1 className="text-[20vw] md:text-[22vw] font-medium leading-[0.8] tracking-tighter text-white text-center font-title select-none pointer-events-none">
                  {word.split("").map((letter, index) => (
                    <span
                      key={index}
                      className="inline-block md:animate-[slideUp_0.8s_ease-out_forwards] md:opacity-0"
                      style={{
                        animationDelay: `${index * 0.08}s`,
                      }}
                    >
                      {letter}
                    </span>
                  ))}
                </h1>
              </div>

              {/* Mobile hint: scroll down */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:hidden pointer-events-none">
                <div className="flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 text-white/95 shadow-lg backdrop-blur-sm">
                  <span className="text-[11px] tracking-wide uppercase">Desliza abajo</span>
                  <span className="text-sm animate-bounce">↓</span>
                </div>
              </div>
            </div>

            {/* Right Column â€” hidden on mobile */}
            <div
              ref={rightColRef}
              className="hidden md:flex flex-col will-change-transform"
              style={{ width: "0%", gap: 0, transform: "translate3d(100%, 0, 0)", opacity: 0 }}
            >
              {sideImages.filter(img => img.position === "right").map((img, idx) => (
                <div
                  key={idx}
                  ref={(el) => { rightCardsRef.current[idx] = el; }}
                  className="relative overflow-hidden will-change-transform"
                  style={{ flex: img.span, borderRadius: 0 }}
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

      {/* Scroll space for desktop animation only â€” no extra scroll on mobile */}
      <div className="h-0 md:h-[200vh]" />
    </section>
  );
}
