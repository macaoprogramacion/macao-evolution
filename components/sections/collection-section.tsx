"use client";

import { type SyntheticEvent, useEffect, useRef, useState } from "react";

import { supabase } from "@/lib/supabase";

const STORAGE_BUCKET = "portfolio-media";

function normalizeHomepageVideoPath(storagePath: string) {
  const trimmed = storagePath.trim();
  if (!trimmed) return trimmed;

  // Backward compatibility: media was moved from homepage-videos/ to videos/
  if (trimmed.startsWith("homepage-videos/")) {
    return trimmed.replace("homepage-videos/", "videos/");
  }

  return trimmed;
}

function getStoragePublicUrl(storagePath: string) {
  const trimmedPath = normalizeHomepageVideoPath(storagePath);

  if (/^https?:\/\//i.test(trimmedPath)) {
    return trimmedPath;
  }

  const withoutLeadingSlash = trimmedPath.replace(/^\/+/, "");
  const normalizedPath = withoutLeadingSlash.startsWith(`${STORAGE_BUCKET}/`)
    ? withoutLeadingSlash.slice(STORAGE_BUCKET.length + 1)
    : withoutLeadingSlash;

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(normalizedPath);
  return data.publicUrl;
}

const localFallbackVideos = [
  {
    id: "macao-beach",
    src: "/images/videos/lateral-izquierdo.mp4",
  },
  {
    id: "horseback-riding",
    src: "/images/videos/lateral-derecho.mp4",
  },
];

const fallbackVideos = [
  {
    id: "macao-beach",
    src: "/images/videos/lateral-izquierdo.mp4",
    name: "Macao Beach",
    description: "Vive la experiencia en los caminos de Macao",
    poster: "/images/gallery-section/gallery (1).webp",
  },
  {
    id: "horseback-riding",
    src: "/images/videos/lateral-derecho.mp4",
    name: "Horseback Riding",
    description: "Descubre los mejores paisajes en buggy",
    poster: "/images/productos/horseback-full-main.webp",
  },
];

type HomepageMediaRow = {
  slot: string;
  title: string;
  description: string | null;
  storage_path: string;
  thumbnail_path?: string | null;
};

function handleVideoError(event: SyntheticEvent<HTMLVideoElement>, fallbackSrc: string) {
  const video = event.currentTarget;
  if (video.dataset.fallbackApplied === "true") return;

  video.dataset.fallbackApplied = "true";
  video.src = fallbackSrc;
  video.load();
}

function VideoCard({
  src,
  fallbackSrc,
  poster,
  className = "",
}: {
  src: string;
  fallbackSrc: string;
  poster?: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pendingPlay, setPendingPlay] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);

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

  const requestPlay = () => {
    const v = videoRef.current;
    if (!v) return;

    const tryPlay = () => {
      const playPromise = v.play();
      if (playPromise && typeof playPromise.then === "function") {
        playPromise
          .then(() => {
            setPendingPlay(false);
          })
          .catch(() => {
            setPendingPlay(true);
          });
      }
    };

    if (v.readyState >= 2) {
      tryPlay();
      return;
    }

    setPendingPlay(true);
    const onCanPlay = () => {
      v.removeEventListener("canplay", onCanPlay);
      tryPlay();
    };
    v.addEventListener("canplay", onCanPlay);
  };

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      requestPlay();
    } else {
      v.pause();
      setPendingPlay(false);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative overflow-hidden rounded-2xl bg-secondary cursor-pointer group/vid ${className}`}
      onClick={toggle}
    >
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover"
        src={shouldLoad ? src : undefined}
        poster={poster}
        onError={(e) => handleVideoError(e, fallbackSrc)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onCanPlay={() => {
          if (pendingPlay) {
            requestPlay();
          }
        }}
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
            /* Pause icon */
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-8 w-8">
              <rect x="5" y="3" width="4" height="18" rx="1" />
              <rect x="15" y="3" width="4" height="18" rx="1" />
            </svg>
          ) : (
            /* Play icon */
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-8 w-8 translate-x-0.5">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

export function CollectionSection() {
  const [videos, setVideos] = useState(fallbackVideos);

  useEffect(() => {
    let active = true;

    async function loadHomepageMedia() {
      const { data, error } = await supabase
        .from("homepage_media")
        .select("slot, title, description, storage_path")
        .eq("active", true)
        .order("sort_order", { ascending: true });

      if (error || !data || !active) {
        if (error) {
          console.error("Error loading homepage media:", error);
        }
        return;
      }

      const rows = data as HomepageMediaRow[];
      const bySlot = new Map(rows.map((row) => [row.slot, row]));

      const lateralVideos = fallbackVideos.map((video) => {
        const row = bySlot.get(video.id);
        if (!row?.storage_path) return video;

        return {
          ...video,
          src: getStoragePublicUrl(row.storage_path),
          name: row.title || video.name,
          description: row.description || video.description,
          poster: row.thumbnail_path ? getStoragePublicUrl(row.thumbnail_path) : video.poster,
        };
      });

      setVideos(lateralVideos);
    }

    loadHomepageMedia();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section id="accessories" className="bg-background">
      {/* Section Title */}
      <div className="px-6 py-20 md:px-12 lg:px-20 md:py-10">
        <h2 className="text-3xl font-medium tracking-tight text-foreground md:text-4xl font-title select-none">
          Discover Our Landscapes
        </h2>
      </div>

      {/* Videos Grid */}
      <div className="pb-24">
        {/* Mobile: Horizontal Carousel */}
        <div className="space-y-8 px-6 md:hidden">
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {videos.map((video, idx) => (
              <div key={video.id} className="flex-shrink-0 w-[75vw] snap-center">
                <VideoCard
                  src={video.src}
                  fallbackSrc={localFallbackVideos[idx]?.src ?? localFallbackVideos[0].src}
                  poster={video.poster}
                  className="aspect-[4/3]"
                />
                <div className="py-6">
                  <h3 className="text-lg font-medium leading-snug text-foreground">{video.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: Grid 2 columns */}
        <div className="hidden md:flex md:flex-col gap-8 md:px-12 lg:px-20">
          <div className="grid md:grid-cols-2 gap-8">
            {videos.map((video, idx) => (
              <div key={video.id}>
                <VideoCard
                  src={video.src}
                  fallbackSrc={localFallbackVideos[idx]?.src ?? localFallbackVideos[0].src}
                  poster={video.poster}
                  className="aspect-[4/3]"
                />
                <div className="py-6">
                  <h3 className="text-lg font-medium leading-snug text-foreground">{video.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
