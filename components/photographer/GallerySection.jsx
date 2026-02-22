import { motion, useAnimationControls } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const galleryPhotos = Array.from({ length: 11 }, (_, i) => `/photographer/photos/bubble-photos (${i + 1}).png`);

// Duplicate for infinite scroll effect
const infinitePhotos = [...galleryPhotos, ...galleryPhotos];

export default function GallerySection({ isVisible = true }) {
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef(null);
  const scrollSpeed = 0.5; // pixels per frame

  // Auto-scroll animation
  useEffect(() => {
    if (!isVisible || isPaused || isDragging) return;

    const container = scrollRef.current;
    if (!container) return;

    const animate = () => {
      if (container) {
        container.scrollLeft += scrollSpeed;

        // Reset scroll position for infinite loop
        const halfWidth = container.scrollWidth / 2;
        if (container.scrollLeft >= halfWidth) {
          container.scrollLeft -= halfWidth;
        }
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, isPaused, isDragging]);

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Navigation arrows
  const scrollByAmount = (direction) => {
    const container = scrollRef.current;
    if (!container) return;
    const cardWidth = window.innerWidth < 768 ? 280 : 420;
    container.scrollBy({
      left: direction * (cardWidth + 24),
      behavior: 'smooth',
    });
  };

  return (
    <div className="w-full py-16 md:py-24 relative">
      {/* Section Header */}
      <motion.div
        className="text-center mb-12 md:mb-16 px-6"
        initial={{ opacity: 0, y: 30 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
          Nuestra Galería
        </h2>
        <p className="text-white/60 text-base md:text-lg max-w-xl mx-auto">
          Momentos capturados en la aventura
        </p>
      </motion.div>

      {/* Gallery Container */}
      <div
        className="relative group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => { setIsPaused(false); setIsDragging(false); }}
      >
        {/* Navigation Arrows */}
        <motion.button
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white/20"
          onClick={() => scrollByAmount(-1)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft size={24} />
        </motion.button>

        <motion.button
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white/20"
          onClick={() => scrollByAmount(1)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronRight size={24} />
        </motion.button>

        {/* Gradient Fades on edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-linear-to-r from-black/90 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-linear-to-l from-black/90 to-transparent z-10 pointer-events-none" />

        {/* Scrollable Track */}
        <div
          ref={scrollRef}
          className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide px-8 md:px-16 py-4 cursor-grab active:cursor-grabbing"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {infinitePhotos.map((photo, index) => (
            <GalleryCard
              key={index}
              photo={photo}
              index={index}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Individual Gallery Card
function GalleryCard({ photo, index, isVisible }) {
  const [isHovered, setIsHovered] = useState(false);

  // Alternate between landscape and portrait-ish aspect ratios
  const isWide = index % 3 !== 1;

  return (
    <motion.div
      className="shrink-0 relative overflow-hidden"
      style={{
        width: isWide ? 'clamp(280px, 35vw, 520px)' : 'clamp(220px, 25vw, 380px)',
        height: 'clamp(280px, 35vh, 420px)',
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.5) }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card with rounded corners */}
      <motion.div
        className="w-full h-full rounded-3xl overflow-hidden relative"
        animate={{
          scale: isHovered ? 1.03 : 1,
        }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Photo */}
        <img
          src={photo}
          alt={`Gallery photo ${index + 1}`}
          className="w-full h-full object-cover select-none pointer-events-none"
          draggable={false}
        />

        {/* Subtle dark overlay on hover */}
        <motion.div
          className="absolute inset-0 bg-black/0"
          animate={{ backgroundColor: isHovered ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0)' }}
          transition={{ duration: 0.3 }}
        />

        {/* Subtle border glow */}
        <div className="absolute inset-0 rounded-3xl border border-white/10 pointer-events-none" />
      </motion.div>
    </motion.div>
  );
}
