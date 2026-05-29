"use client";

import { useEffect } from "react";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/sections/hero-section";
import { PhilosophySection } from "@/components/sections/philosophy-section";
import { FeaturedProductsSection } from "@/components/sections/featured-products-section";
import { TechnologySection } from "@/components/sections/technology-section";
import { GallerySection } from "@/components/sections/gallery-section";
import { CollectionSection } from "@/components/sections/collection-section";
import { EditorialSection } from "@/components/sections/editorial-section";
import { TestimonialsText, TestimonialsImage } from "@/components/sections/testimonials-section";
import { TransportSection } from "@/components/sections/transport-section";
import { FooterSection } from "@/components/sections/footer-section";

export default function Home() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      const blockedWithCtrl = ["c", "x", "s", "u", "p", "i", "j"];

      if ((isCtrlOrCmd && blockedWithCtrl.includes(key)) || key === "f12") {
        event.preventDefault();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const blockEvent = (event: React.SyntheticEvent) => {
    event.preventDefault();
  };

  return (
    <main
      className="min-h-screen bg-background select-none"
      onContextMenu={blockEvent}
      onCopy={blockEvent}
      onCut={blockEvent}
      onDragStart={blockEvent}
      onSelectStart={blockEvent}
    >
      <Header />
      <HeroSection />
      <PhilosophySection />
      <FeaturedProductsSection />
      <TechnologySection />
      <GallerySection />
      <CollectionSection />
      <EditorialSection />
      <TestimonialsText />
      <TransportSection />
      <TestimonialsImage />
      <FooterSection />
    </main>
  );
}
