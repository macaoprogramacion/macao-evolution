"use client";

const videos = [
  {
    id: 1,
    src: "/images/videos/lateral-izquierdo.mp4",
    name: "Macao Beach",
    description: "Vive la experiencia en los caminos de Macao",
  },
  {
    id: 2,
    src: "/images/videos/0211.mp4",
    name: "Horseback Riding",
    description: "Descubre los mejores paisajes en buggy",
  },
];

export function CollectionSection() {
  return (
    <section id="accessories" className="bg-background">
      {/* Section Title */}
      <div className="px-6 py-20 md:px-12 lg:px-20 md:py-10">
        <h2 className="text-3xl font-medium tracking-tight text-foreground md:text-4xl font-[family-name:var(--font-trenches)]">
          Discover Our Landscapes
        </h2>
      </div>

      {/* Videos Grid */}
      <div className="pb-24">
        {/* Mobile: Horizontal Carousel */}
        <div className="flex gap-6 overflow-x-auto px-6 pb-4 md:hidden snap-x snap-mandatory scrollbar-hide">
          {videos.map((video) => (
            <div key={video.id} className="group flex-shrink-0 w-[75vw] snap-center">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-secondary">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover"
                  src={video.src}
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

        {/* Desktop: Grid 2 columns */}
        <div className="hidden md:grid md:grid-cols-2 gap-8 md:px-12 lg:px-20">
          {videos.map((video) => (
            <div key={video.id} className="group">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-secondary">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover"
                  src={video.src}
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
      </div>
    </section>
  );
}
