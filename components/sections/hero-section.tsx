"use client";

import { type SyntheticEvent, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

const STORAGE_BUCKET = "portfolio-media";
const HERO_VIDEO_SRC = "/images/videos/video-grande.mp4";
const HERO_VIDEO_POSTER = "/images/foto-con-dimecion-arreglada/imagen-cuadrada-alta-calidad.webp";

function getStoragePublicUrl(storagePath: string) {
  const withoutLeadingSlash = storagePath.replace(/^\/+/, "");
  const normalizedPath = withoutLeadingSlash.startsWith(`${STORAGE_BUCKET}/`)
    ? withoutLeadingSlash.slice(STORAGE_BUCKET.length + 1)
    : withoutLeadingSlash;

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(normalizedPath);
  return data.publicUrl;
}

function handleVideoError(event: SyntheticEvent<HTMLVideoElement>) {
  const video = event.currentTarget;
  if (video.dataset.fallbackApplied === "true") return;

  video.dataset.fallbackApplied = "true";
  video.src = HERO_VIDEO_SRC;
  video.load();
}

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bucketVideoSrc = getStoragePublicUrl("videos/video-grande.mp4");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Some browsers delay autoplay on first paint; retry once video can play.
    const tryPlay = () => {
      video.muted = true;
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          // Keep silently failing; user can still interact and play manually.
        });
      }
    };

    tryPlay();
    video.addEventListener("canplay", tryPlay);
    return () => video.removeEventListener("canplay", tryPlay);
  }, []);

  return (
    <section className="relative h-screen overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        defaultMuted
        playsInline
        preload="metadata"
        poster={HERO_VIDEO_POSTER}
        className="absolute inset-0 h-full w-full object-cover"
        src={bucketVideoSrc}
        onError={handleVideoError}
      />
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 h-full w-full" />
    </section>
  );
}
