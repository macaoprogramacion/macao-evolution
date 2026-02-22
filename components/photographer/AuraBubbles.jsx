import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useRef } from 'react';

function Bubble({ image, size, x, y, onComplete }) {
  // Random duration for how long the bubble stays visible (5-10 seconds)
  const stayDuration = 5 + Math.random() * 5;
  
  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 1, 1, 0],
        y: [0, -20, 0, 15, 0],
        x: [0, 10, -10, 5, 0],
      }}
      transition={{
        opacity: { 
          duration: stayDuration, 
          times: [0, 0.1, 0.85, 1],
          ease: 'easeInOut',
        },
        scale: { 
          duration: stayDuration, 
          times: [0, 0.1, 0.85, 1],
          ease: 'easeInOut',
        },
        y: {
          duration: stayDuration,
          ease: 'easeInOut',
        },
        x: {
          duration: stayDuration,
          ease: 'easeInOut',
        },
      }}
      onAnimationComplete={onComplete}
      whileHover={{ scale: 1.1 }}
    >
      {/* Bubble container with iridescent effect */}
      <div className="relative w-full h-full group">
        {/* Outer glow */}
        <div 
          className="absolute inset-0 rounded-full opacity-40"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,182,193,0.3) 50%, rgba(135,206,250,0.3) 100%)',
          }}
        />
        
        {/* Main bubble */}
        <div 
          className="absolute inset-1 rounded-full overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)',
            boxShadow: `
              inset 0 0 20px rgba(255,255,255,0.3),
              inset -5px -5px 20px rgba(255,182,193,0.2),
              inset 5px 5px 20px rgba(135,206,250,0.2),
              0 8px 32px rgba(0,0,0,0.1)
            `,
          }}
        >
          {/* Photo inside bubble */}
          {image && (
            <img
              src={image}
              alt=""
              className="w-full h-full object-cover rounded-full scale-90"
            />
          )}
        </div>

        {/* Rainbow reflection highlight */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 30% 50% at 25% 25%, rgba(255,255,255,0.6) 0%, transparent 50%),
              radial-gradient(ellipse 20% 30% at 70% 75%, rgba(255,182,193,0.3) 0%, transparent 50%),
              linear-gradient(135deg, transparent 40%, rgba(135,206,250,0.2) 50%, transparent 60%)
            `,
          }}
        />

        {/* Iridescent arc */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none opacity-40"
          style={{
            background: `
              conic-gradient(
                from 180deg,
                transparent 0deg,
                rgba(255,0,100,0.15) 60deg,
                rgba(255,165,0,0.15) 120deg,
                rgba(255,255,0,0.1) 180deg,
                rgba(0,255,0,0.1) 240deg,
                rgba(0,100,255,0.15) 300deg,
                transparent 360deg
              )
            `,
          }}
        />
      </div>
    </motion.div>
  );
}

// Define screen zones to distribute bubbles across different areas
const screenZones = [
  { xMin: 5, xMax: 30, yMin: 5, yMax: 35 },   // Top-left
  { xMin: 35, xMax: 65, yMin: 5, yMax: 30 },  // Top-center
  { xMin: 70, xMax: 90, yMin: 5, yMax: 35 },  // Top-right
  { xMin: 5, xMax: 25, yMin: 40, yMax: 60 },  // Middle-left
  { xMin: 75, xMax: 90, yMin: 40, yMax: 60 }, // Middle-right
  { xMin: 5, xMax: 30, yMin: 65, yMax: 85 },  // Bottom-left
  { xMin: 35, xMax: 65, yMin: 70, yMax: 85 }, // Bottom-center
  { xMin: 70, xMax: 90, yMin: 65, yMax: 85 }, // Bottom-right
];

let lastZoneIndex = -1;

// Helper to generate a random bubble in a different zone than the last one
const generateBubble = (id, images, minSize, maxSize) => {
  // Pick a zone different from the last used
  let zoneIndex;
  do {
    zoneIndex = Math.floor(Math.random() * screenZones.length);
  } while (zoneIndex === lastZoneIndex && screenZones.length > 1);
  lastZoneIndex = zoneIndex;
  
  const zone = screenZones[zoneIndex];
  const x = zone.xMin + Math.random() * (zone.xMax - zone.xMin);
  const y = zone.yMin + Math.random() * (zone.yMax - zone.yMin);
  
  return {
    id,
    image: images[Math.floor(Math.random() * images.length)] || null,
    size: minSize + Math.random() * (maxSize - minSize),
    x: `${x}%`,
    y: `${y}%`,
  };
};

export default function AuraBubbles({ 
  images = [], 
  count = 8,
  minSize = 80,
  maxSize = 200,
  minSizeDesktop = 140,
  maxSizeDesktop = 280,
  maxVisible = 2, // Maximum bubbles visible at once
}) {
  const [bubbles, setBubbles] = useState([]);
  const [nextId, setNextId] = useState(0);
  const [spawnedCount, setSpawnedCount] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect desktop screen size
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Calculate effective sizes based on screen
  const effectiveMinSize = isDesktop ? minSizeDesktop : minSize;
  const effectiveMaxSize = isDesktop ? maxSizeDesktop : maxSize;
  
  // Use refs to always have current size values in callbacks
  const sizesRef = useRef({ min: effectiveMinSize, max: effectiveMaxSize });
  useEffect(() => {
    sizesRef.current = { min: effectiveMinSize, max: effectiveMaxSize };
  }, [effectiveMinSize, effectiveMaxSize]);

  // Spawn bubbles one at a time with longer delays
  useEffect(() => {
    const spawnNextBubble = () => {
      setSpawnedCount(prev => {
        if (prev < count) {
          setNextId(currentId => {
            setBubbles(current => {
              // Only add if we're under the max visible limit
              if (current.length < maxVisible) {
                return [...current, generateBubble(currentId, images, sizesRef.current.min, sizesRef.current.max)];
              }
              return current;
            });
            return currentId + 1;
          });
          return prev + 1;
        }
        return prev;
      });
    };

    // Spawn first bubble immediately
    spawnNextBubble();
    
    // Then spawn more with staggered timing (2-4 seconds apart)
    const intervals = [];
    for (let i = 1; i < Math.min(count, maxVisible); i++) {
      const timeout = setTimeout(() => {
        spawnNextBubble();
      }, i * (2000 + Math.random() * 2000));
      intervals.push(timeout);
    }
    
    return () => {
      intervals.forEach(clearTimeout);
      setBubbles([]);
    };
  }, []);

  // When a bubble completes its animation, remove it and spawn a new one
  const handleBubbleComplete = useCallback((id) => {
    setBubbles(prev => prev.filter(b => b.id !== id));
    
    // Spawn a new bubble after a delay (1.5-3.5 seconds)
    setTimeout(() => {
      setNextId(prev => {
        const newId = prev + 1;
        setBubbles(current => {
          if (current.length < maxVisible) {
            return [...current, generateBubble(newId, images, sizesRef.current.min, sizesRef.current.max)];
          }
          return current;
        });
        return newId;
      });
    }, 1500 + Math.random() * 2000);
  }, [images, maxVisible]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <AnimatePresence>
        {bubbles.map((bubble) => (
          <Bubble 
            key={bubble.id} 
            {...bubble} 
            onComplete={() => handleBubbleComplete(bubble.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
