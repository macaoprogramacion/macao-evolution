"use client";

import { type SyntheticEvent, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

const STORAGE_BUCKET = "portfolio-media";
const HERO_VIDEO_SRC = "/images/videos/Macao-Rancho-index.mp4";
const HERO_CANDIDATE_SOURCES_MOBILE = [
  HERO_VIDEO_SRC,
  "/images/videos/macao-rancho-mobile.mp4",
  "/images/videos/macao-rancho-720.mp4",
  "/images/videos/macao-rancho.mp4",
];
const HERO_CANDIDATE_SOURCES_DESKTOP = [
  HERO_VIDEO_SRC,
  "/images/videos/macao-rancho-1080.mp4",
  "/images/videos/macao-rancho-720.mp4",
  "/images/videos/macao-rancho.mp4",
];

function getStoragePublicUrl(storagePath: string) {
  const withoutLeadingSlash = storagePath.replace(/^\/+/, "");
  const normalizedPath = withoutLeadingSlash.startsWith(`${STORAGE_BUCKET}/`)
    ? withoutLeadingSlash.slice(STORAGE_BUCKET.length + 1)
    : withoutLeadingSlash;

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(normalizedPath);
  return data.publicUrl;
}

async function pickFirstExistingSource(candidates: string[]) {
  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, { method: "HEAD", cache: "no-store" });
      if (response.ok) return candidate;
    } catch {
      // Ignore and continue with next candidate.
    }
  }
  return HERO_VIDEO_SRC;
}

function handleVideoError(event: SyntheticEvent<HTMLVideoElement>, fallbackSrc: string) {
  const video = event.currentTarget;
  if (video.dataset.fallbackApplied === "true") return;

  video.dataset.fallbackApplied = "true";
  video.src = fallbackSrc;
  video.load();
}

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [resolvedSrc, setResolvedSrc] = useState<string>(HERO_VIDEO_SRC);
  const [shouldLoad, setShouldLoad] = useState(false);
  const bucketVideoFallbackSrc = getStoragePublicUrl("videos/Macao-Rancho-index.mp4");

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const candidates = mobile ? HERO_CANDIDATE_SOURCES_MOBILE : HERO_CANDIDATE_SOURCES_DESKTOP;

    let active = true;
    pickFirstExistingSource(candidates).then((src) => {
      if (!active) return;
      setResolvedSrc(src);
    });

    // Defer actual loading to improve first paint.
    const timeoutId = window.setTimeout(() => {
      if (!active) return;
      setShouldLoad(true);
    }, 100);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, []);

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
  }, [shouldLoad, resolvedSrc]);

  return (
    <section className="relative h-screen overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        defaultMuted
        playsInline
        preload="none"
        poster="/images/foto-con-dimecion-arreglada/imagen-cuadrada-alta-calidad.webp"
        className="absolute inset-0 h-full w-full object-cover"
        src={shouldLoad ? resolvedSrc : undefined}
        onError={(event) => handleVideoError(event, bucketVideoFallbackSrc)}
      />
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 h-full w-full" />
    </section>
  );
}
