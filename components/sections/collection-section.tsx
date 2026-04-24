"use client";

import { type SyntheticEvent, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

const STORAGE_BUCKET = "portfolio-media";

function getStoragePublicUrl(storagePath: string) {
  const trimmedPath = storagePath.trim();

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

const localFeaturedFallbackVideo = "/images/videos/video-grande.mp4";

const fallbackVideos = [
  {
    id: "macao-beach",
    src: getStoragePublicUrl("homepage-videos/lateral-izquierdo.mp4"),
    name: "Macao Beach",
    description: "Vive la experiencia en los caminos de Macao",
  },
  {
    id: "horseback-riding",
    src: getStoragePublicUrl("homepage-videos/lateral-derecho.mp4"),
    name: "Horseback Riding",
    description: "Descubre los mejores paisajes en buggy",
  },
];

const fallbackFeaturedVideo = {
  src: getStoragePublicUrl("homepage-videos/video-grande.mp4"),
  name: "Adventure Experience",
};

type HomepageMediaRow = {
  slot: string;
  title: string;
  description: string | null;
  storage_path: string;
};

function handleVideoError(event: SyntheticEvent<HTMLVideoElement>, fallbackSrc: string) {
  const video = event.currentTarget;
  if (video.dataset.fallbackApplied === "true") return;

  video.dataset.fallbackApplied = "true";
  video.src = fallbackSrc;
  video.load();
}

export function CollectionSection() {
  const [videos, setVideos] = useState(fallbackVideos);
  const [featuredVideo, setFeaturedVideo] = useState(fallbackFeaturedVideo);

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
        };
      });

      const featuredRow = bySlot.get("featured-large");

      setVideos(lateralVideos);

      if (featuredRow?.storage_path) {
        setFeaturedVideo({
          src: getStoragePublicUrl(featuredRow.storage_path),
          name: featuredRow.title || fallbackFeaturedVideo.name,
        });
      }
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
            {videos.map((video) => (
              <div key={video.id} className="group flex-shrink-0 w-[75vw] snap-center">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-secondary">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    className="absolute inset-0 h-full w-full object-cover"
                    src={video.src}
                    onError={(event) => handleVideoError(event, localFallbackVideos[0].id === video.id ? localFallbackVideos[0].src : localFallbackVideos[1].src)}
                  />
                </div>
                <div className="py-6">
                  <h3 className="text-lg font-medium leading-snug text-foreground">
                    {video.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          <div className="group">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-secondary">
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover"
                src={featuredVideo.src}
                onError={(event) => handleVideoError(event, localFeaturedFallbackVideo)}
              />
            </div>
          </div>
        </div>

        {/* Desktop: Grid 2 columns */}
        <div className="hidden md:flex md:flex-col gap-8 md:px-12 lg:px-20">
          <div className="grid md:grid-cols-2 gap-8">
            {videos.map((video) => (
              <div key={video.id} className="group">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-secondary">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    className="absolute inset-0 h-full w-full object-cover"
                    src={video.src}
                    onError={(event) => handleVideoError(event, localFallbackVideos[0].id === video.id ? localFallbackVideos[0].src : localFallbackVideos[1].src)}
                  />
                </div>
                <div className="py-6">
                  <h3 className="text-lg font-medium leading-snug text-foreground">
                    {video.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          <div className="group">
            <div className="relative aspect-[21/9] overflow-hidden rounded-2xl bg-secondary">
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover"
                src={featuredVideo.src}
                onError={(event) => handleVideoError(event, localFeaturedFallbackVideo)}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
