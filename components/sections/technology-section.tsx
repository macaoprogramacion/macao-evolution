"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

function ScrollRevealText({ text }: { text: string }) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Slower animation - more viewport range
      const startOffset = windowHeight * 0.9;
      const endOffset = windowHeight * 0.1;
      
      const totalDistance = startOffset - endOffset;
      const currentPosition = startOffset - rect.top;
      
      const newProgress = Math.max(0, Math.min(1, currentPosition / totalDistance));
      setProgress(newProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const words = text.split(" ");
  
  return (
    <p
      ref={containerRef}
      className="text-3xl font-semibold leading-snug md:text-4xl lg:text-5xl"
    >
      {words.map((word, index) => {
        const wordProgress = index / words.length;
        const isRevealed = progress > wordProgress;
        
        return (
          <span
            key={index}
            className="transition-colors duration-150"
            style={{
              color: isRevealed ? "var(--foreground)" : "#e4e4e7",
            }}
          >
            {word}{index < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </p>
  );
}

const sideImages = [
  {
    src: "/images/paradas/columna%20(1).png",
    alt: "Parada 1 de la excursión",
    position: "left",
    span: 1,
  },
  {
    src: "/images/paradas/columna%20(3).png",
    alt: "Parada 3 de la excursión",
    position: "left",
    span: 1,
  },
  {
    src: "/images/paradas/columna%20(2).png",
    alt: "Parada 2 de la excursión",
    position: "right",
    span: 1,
  },
  {
    src: "/images/paradas/columna%20(4).png",
    alt: "Parada 4 de la excursión",
    position: "right",
    span: 1,
  },
];

export function TechnologySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const textSectionRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [textProgress, setTextProgress] = useState(0);
  const isMobile = useIsMobile();
  
  const descriptionText = "Experience outdoor gear reimagined with cutting-edge technology. Alpine & Forest accessories combine ultra-lightweight materials, intelligent temperature control, and weather-resistant engineering to elevate every adventure. From mountain peaks to forest trails, your gear adapts to the conditions.";

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      const scrollableHeight = window.innerHeight * 2;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollableHeight));
      
      setScrollProgress(progress);

      // Text scroll progress
      if (textSectionRef.current) {
        const textRect = textSectionRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        const startOffset = windowHeight * 0.9;
        const endOffset = windowHeight * 0.1;
        
        const totalDistance = startOffset - endOffset;
        const currentPosition = startOffset - textRect.top;
        
        const newTextProgress = Math.max(0, Math.min(1, currentPosition / totalDistance));
        setTextProgress(newTextProgress);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Title fades out first (0 to 0.2)
  const titleOpacity = Math.max(0, 1 - (scrollProgress / 0.2));
  
  // Image transforms start after title fades (0.2 to 1)
  const imageProgress = Math.max(0, Math.min(1, (scrollProgress - 0.2) / 0.8));
  
  // Smooth interpolations — wider side images on mobile
  const centerWidth = isMobile
    ? 100 - (imageProgress * 96) // mobile: 100% to 4%
    : 100 - (imageProgress * 58); // desktop: 100% to 42%
  const centerHeight = 100 - (imageProgress * 30); // 100% to 70%
  const sideWidth = isMobile
    ? imageProgress * 48 // mobile: 0% to 48%
    : imageProgress * 22; // desktop: 0% to 22%
  const sideOpacity = imageProgress;
  const sideTranslateLeft = -100 + (imageProgress * 100); // -100% to 0%
  const sideTranslateRight = 100 - (imageProgress * 100); // 100% to 0%
  const borderRadius = imageProgress * 24; // 0px to 24px
  const gap = imageProgress * 16; // 0px to 16px

  // Calculate grayscale for text section based on textProgress
  const grayscaleAmount = Math.round((1 - textProgress) * 100);

  return (
    <section id="products" ref={sectionRef} className="relative bg-foreground">
      {/* Sticky container for scroll animation */}
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="flex h-full w-full items-center justify-center">
          {/* Bento Grid Container */}
          <div 
            className="relative flex h-full w-full items-stretch justify-center"
            style={{ gap: `${gap}px`, padding: `${imageProgress * 16}px` }}
          >
            
            {/* Left Column */}
            <div 
              className="flex flex-col will-change-transform"
              style={{
                width: `${sideWidth}%`,
                gap: `${gap}px`,
                transform: `translateX(${sideTranslateLeft}%)`,
                opacity: sideOpacity,
              }}
            >
              {sideImages.filter(img => img.position === "left").map((img, idx) => (
                <div 
                  key={idx} 
                  className="relative overflow-hidden will-change-transform"
                  style={{
                    flex: img.span,
                    borderRadius: `${borderRadius}px`,
                  }}
                >
                  <Image
                    src={img.src || "/placeholder.svg"}
                    alt={img.alt}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Main Center Image */}
            <div 
              className="relative overflow-hidden will-change-transform"
              style={{
                width: `${centerWidth}%`,
                height: "100%",
                flex: "0 0 auto",
                borderRadius: `${borderRadius}px`,
              }}
            >
              <Image
                src="/images/foto-con-dimecion-arreglada/imagen-cuadrada-alta-calidad.png"
                alt="Buggy aventura vista aérea"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-foreground/40" />
              
              {/* Title Text - Fades out word by word with blur */}
              <div 
                className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
              >
                <h2 className="max-w-3xl font-medium leading-tight tracking-tight text-white md:text-5xl lg:text-7xl text-5xl font-title">
                  {["Four", "Stops."].map((word, index) => {
                    // Each word fades out sequentially based on scrollProgress
                    const wordFadeStart = index * 0.07;
                    const wordFadeEnd = wordFadeStart + 0.07;
                    const wordProgress = Math.max(0, Math.min(1, (scrollProgress - wordFadeStart) / (wordFadeEnd - wordFadeStart)));
                    const wordOpacity = 1 - wordProgress;
                    const wordBlur = wordProgress * 10;
                    
                    return (
                      <span
                        key={index}
                        className="inline-block"
                        style={{
                          opacity: wordOpacity,
                          filter: `blur(${wordBlur}px)`,
                          transition: 'opacity 0.1s linear, filter 0.1s linear',
                          marginRight: index < 1 ? '0.3em' : '0',
                        }}
                      >
                        {word}
                        {index === 1 && <br />}
                      </span>
                    );
                  })}
                </h2>
              </div>
            </div>

            {/* Right Column */}
            <div 
              className="flex flex-col will-change-transform"
              style={{
                width: `${sideWidth}%`,
                gap: `${gap}px`,
                transform: `translateX(${sideTranslateRight}%)`,
                opacity: sideOpacity,
              }}
            >
              {sideImages.filter(img => img.position === "right").map((img, idx) => (
                <div 
                  key={idx} 
                  className="relative overflow-hidden will-change-transform"
                  style={{
                    flex: img.span,
                    borderRadius: `${borderRadius}px`,
                  }}
                >
                  <Image
                    src={img.src || "/placeholder.svg"}
                    alt={img.alt}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Scroll space to enable animation */}
      <div className="h-[200vh]" />

      {/* Itinerary Section */}
      <div 
        ref={textSectionRef}
        className="relative overflow-hidden bg-background px-6 py-24 md:px-12 md:py-32 lg:px-20 lg:py-40"
      >
        <div className="relative z-10 mx-auto max-w-5xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-medium tracking-tight text-foreground md:text-4xl lg:text-5xl font-title">
              Tour Itinerary
            </h2>
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-foreground" />
                <span className="text-sm text-muted-foreground">Collective: <strong className="text-foreground">20 min</strong> per stop</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-sm text-muted-foreground">Private: <strong className="text-foreground">35 min</strong> per stop</span>
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
