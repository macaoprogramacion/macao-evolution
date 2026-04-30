"use client";

import { useRef, useState } from "react";

const specs = [
  { label: "Minimum Age", value: "4 y/o" },
  { label: "Pregnant Women", value: "NO" },
  { label: "Back Problems", value: "NO" },
  { label: "Pick Up Included?", value: "YES" },
];

export function EditorialSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

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
          src="/images/videos/video-grande.mp4"
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
