"use client";

import { type SyntheticEvent, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

const STORAGE_BUCKET = "portfolio-media";
const LOCAL_FALLBACK_VIDEO = "/images/videos/video-grande.mp4";

function getStoragePublicUrl(storagePath: string) {
  const withoutLeadingSlash = storagePath.replace(/^\/+/, "");
  const normalizedPath = withoutLeadingSlash.startsWith(`${STORAGE_BUCKET}/`)
    ? withoutLeadingSlash.slice(STORAGE_BUCKET.length + 1)
    : withoutLeadingSlash;

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(normalizedPath);
  return data.publicUrl;
}

function handleVideoError(event: SyntheticEvent<HTMLVideoElement>, fallbackSrc: string) {
  const video = event.currentTarget;
  if (video.dataset.fallbackApplied === "true") return;

  video.dataset.fallbackApplied = "true";
  video.src = fallbackSrc;
  video.load();
}

const specs = [
  { label: "Minimum Age", value: "4 y/o" },
  { label: "Pregnant Women", value: "NO" },
  { label: "Back Problems", value: "NO" },
  { label: "Pick Up Included?", value: "YES" },
];

export function EditorialSection() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const bucketVideoFallbackSrc = getStoragePublicUrl("videos/video-grande.mp4");

  useEffect(() => {
    const target = wrapperRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <section className="bg-background">
      {/* Specs Grid */}
      <div className="grid grid-cols-2 border-t border-border md:grid-cols-4">
        {specs.map((spec) => (
          <div
            key={spec.label}
            className="border-b border-r border-border p-8 text-center last:border-r-0 md:border-b-0"
          >
            <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
              {spec.label}
            </p>
            <p className="font-medium text-foreground text-4xl">
              {spec.value}
            </p>
          </div>
        ))}
      </div>

      {/* Full-width Video — edge to edge, no padding */}
      <div
        ref={wrapperRef}
        className="relative w-full aspect-[9/16] md:aspect-[16/9] lg:aspect-[21/9] cursor-pointer group/vid overflow-hidden"
        onClick={toggle}
      >
        <video
          ref={videoRef}
          loop
          muted
          playsInline
          preload="metadata"
          poster="/images/foto-con-dimecion-arreglada/imagen-cuadrada-alta-calidad.webp"
          className="absolute inset-0 h-full w-full object-cover"
          src={shouldLoad ? LOCAL_FALLBACK_VIDEO : undefined}
          onError={(event) => handleVideoError(event, bucketVideoFallbackSrc)}
          onEnded={() => setPlaying(false)}
        />
        {/* Play / Pause overlay */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            playing ? "opacity-0 group-hover/vid:opacity-100" : "opacity-100"
          }`}
        >
          <div className="rounded-full bg-black/50 p-5 backdrop-blur-sm">
            {playing ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-8 w-8">
                <rect x="5" y="3" width="4" height="18" rx="1" />
                <rect x="15" y="3" width="4" height="18" rx="1" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-8 w-8 translate-x-0.5">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
