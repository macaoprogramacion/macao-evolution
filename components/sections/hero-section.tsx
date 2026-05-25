"use client";

const HERO_VIDEO_SRC = "/images/videos/video-grande.mp4";
const HERO_VIDEO_POSTER = "/images/foto-con-dimecion-arreglada/imagen-cuadrada-alta-calidad.webp";

export function HeroSection() {
  return (
    <section className="relative h-screen overflow-hidden bg-black">
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster={HERO_VIDEO_POSTER}
        className="absolute inset-0 h-full w-full object-cover"
        src={HERO_VIDEO_SRC}
      />
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 h-full w-full" />
    </section>
  );
}
