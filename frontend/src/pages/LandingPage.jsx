import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone } from 'lucide-react';
import AuraBubbles from '../components/AuraBubbles';
import { GlassCard, GlassButton, GlassInput } from '../components/ui';
import macaoLogo from '../assets/branding/macao-logo.png';

// Import background images statically (handling spaces in filenames)
import bg1 from '../assets/branding/photos/bg-4k (1).png';
import bg2 from '../assets/branding/photos/bg-4k (2).png';
import bg3 from '../assets/branding/photos/bg-4k (3).png';
import bg4 from '../assets/branding/photos/bg-4k (4).png';
import bg5 from '../assets/branding/photos/bg-4k (5).png';
import bg6 from '../assets/branding/photos/bg-4k (6).png';
import bg7 from '../assets/branding/photos/bg-4k (7).png';
import bg8 from '../assets/branding/photos/bg-4k (8).png';
import bg9 from '../assets/branding/photos/bg-4k (9).png';
import bg10 from '../assets/branding/photos/bg-4k (10).png';
import bg11 from '../assets/branding/photos/bg-4k (11).png';

// Import bubble photos
import bubble1 from '../assets/photos/bubble-photos (1).png';
import bubble2 from '../assets/photos/bubble-photos (2).png';
import bubble3 from '../assets/photos/bubble-photos (3).png';
import bubble4 from '../assets/photos/bubble-photos (4).png';
import bubble5 from '../assets/photos/bubble-photos (5).png';
import bubble6 from '../assets/photos/bubble-photos (6).png';
import bubble7 from '../assets/photos/bubble-photos (7).png';
import bubble8 from '../assets/photos/bubble-photos (8).png';
import bubble9 from '../assets/photos/bubble-photos (9).png';
import bubble10 from '../assets/photos/bubble-photos (10).png';
import bubble11 from '../assets/photos/bubble-photos (11).png';

const backgroundImages = [bg1, bg2, bg3, bg4, bg5, bg6, bg7, bg8, bg9, bg10, bg11];
const bubbleImages = [bubble1, bubble2, bubble3, bubble4, bubble5, bubble6, bubble7, bubble8, bubble9, bubble10, bubble11];

console.log('Background images loaded:', backgroundImages.length, backgroundImages);

export default function LandingPage() {
  const [phone, setPhone] = useState('');
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const navigate = useNavigate();

  // Background slideshow effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAccess = () => {
    if (phone.length >= 7) {
      navigate(`/gallery/${phone}`);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Background Slideshow */}
      <div className="fixed inset-0 z-0">
        {backgroundImages.map((bg, index) => (
          <img
            key={index}
            src={bg}
            alt={`Background ${index + 1}`}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
            style={{
              opacity: index === currentBgIndex ? 1 : 0,
            }}
          />
        ))}
        {/* Overlay with blur effect for better readability */}
        <div 
          className="absolute inset-0 z-10 bg-black/30 backdrop-blur-sm"
        />
      </div>
      
      {/* Aura Bubbles - max 2 visible at a time */}
      <AuraBubbles 
        images={bubbleImages} 
        count={8} 
        minSize={100} 
        maxSize={220}
        maxVisible={2}
      />

      {/* Desktop-only extra bubbles - 1 more for larger screens */}
      <div className="hidden md:block">
        <AuraBubbles 
          images={bubbleImages} 
          count={4} 
          minSize={80} 
          maxSize={160}
          maxVisible={1}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen px-4">
        {/* Macao Logo - Fixed at top center */}
        <motion.div
          className="absolute top-2 left-0 right-0 flex justify-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <img src={macaoLogo} alt="Macao Offroad Experience" className="w-48 md:w-64 h-auto" />
        </motion.div>

        {/* Center content - truly centered */}
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center">
            {/* Title with glass effect */}
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <GlassCard className="px-8 py-4 mb-6" hover={false}>
                <h1 className="font-title text-3xl md:text-5xl tracking-wide text-white text-center">
                  Obtener mis fotos
                </h1>
              </GlassCard>
            </motion.div>

            {/* Login form */}
            <motion.div
              className="w-full max-w-md"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <GlassCard className="p-2" hover={false}>
                <div className="flex gap-2">
                  <GlassInput
                    type="tel"
                    placeholder="Número de teléfono"
                    icon={Phone}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1"
                  />
                  <GlassButton 
                    variant="primary"
                    onClick={handleAccess}
                  >
                    Acceder
                  </GlassButton>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
