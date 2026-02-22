"use client"

import { motion, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import GallerySection from '@/components/photographer/GallerySection';

// Background image - buggy in mud action shot

// Product images

// Products data - Privado y Colectivo
const products = [
  { 
    id: 1, 
    name: 'Privado', 
    price: '$299', 
    image: '/photographer/photos/private-1.png',
    description: 'Experiencia exclusiva para ti y tu grupo'
  },
  { 
    id: 2, 
    name: 'Colectivo', 
    price: '$149', 
    image: '/photographer/photos/colective-2.png',
    description: 'Comparte la aventura con otros exploradores'
  },
];

// Scroll phases
const PHASE_HERO = 'hero';
const PHASE_WHITE_TRANSITION = 'white_transition';
const PHASE_WHITE_PINNED = 'white_pinned';
const PHASE_PRODUCTS = 'products';
const PHASE_ABOUT = 'about';
const PHASE_GALLERY = 'gallery';

// Product Card Component for the swipe section
function SwipeProductCard({ product, position, progress, isMobile }) {
  const isLeft = position === 'left';
  const isTop = position === 'left'; // In mobile: left=top, right=bottom
  
  // Desktop: Calculate x position based on progress (0 = outside, 1 = near center)
  const x = useTransform(
    progress,
    [0, 1],
    [isLeft ? '-120%' : '120%', isLeft ? '10%' : '-10%']
  );
  
  // Mobile: Calculate y position based on progress (0 = outside, 1 = near center)
  const y = useTransform(
    progress,
    [0, 1],
    [isTop ? '-120%' : '120%', isTop ? '5%' : '-5%']
  );
  
  // Mobile layout - cards stacked vertically, entering from top/bottom
  if (isMobile) {
    return (
      <motion.div
        style={{ y }}
        className={`absolute left-1/2 -translate-x-1/2 ${isTop ? 'top-[8%]' : 'bottom-[8%]'} w-[75%] max-w-[340px] z-20`}
      >
        <div className="relative overflow-hidden rounded-3xl shadow-2xl">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
            
            {/* Price badge overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="bg-white/20 backdrop-blur-md text-white px-5 py-2 rounded-full text-sm font-medium shadow-lg">
                <span className="block text-center">{product.name}</span>
                <span className="block text-center">{product.price}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
  
  // Desktop layout - cards side by side, entering from left/right
  return (
    <motion.div
      style={{ x }}
      className={`absolute ${isLeft ? 'left-12 lg:left-20' : 'right-12 lg:right-20'} top-1/2 -translate-y-1/2 w-[42%] max-w-[520px] z-20`}
    >
      <div className="relative overflow-hidden rounded-3xl shadow-2xl">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
          
          {/* Price badge overlay */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <div className="bg-white/20 backdrop-blur-md text-white px-8 py-3 rounded-full text-lg font-medium shadow-lg">
              {product.name} {product.price}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Navigation links
const navLinks = [
  { name: 'Tours', href: '#tours' },
  { name: 'Gallery', href: '/gallery' },
  { name: 'About Us', href: '#about' },
  { name: 'Contact', href: '#contact' },
];

export default function HeroLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const productsRef = useRef(null);
  const whiteOverlayRef = useRef(null);
  
  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Scroll-based animation states
  const [scrollPhase, setScrollPhase] = useState(PHASE_HERO);
  const [whiteProgress, setWhiteProgress] = useState(0); // 0 to 1 - how much white covers screen
  const [whiteSlideUp, setWhiteSlideUp] = useState(0); // 0 to 1 - how much white has slid up (0 = in place, 1 = fully up)
  const [aboutProgress, setAboutProgress] = useState(0); // 0 to 1 - progress through about section
  const [galleryProgress, setGalleryProgress] = useState(0); // 0 to 1 - transition from about to gallery
  
  // Motion value for swipe progress (0 to 1) - for products animation
  const swipeProgress = useMotionValue(0);
  const smoothProgress = useSpring(swipeProgress, { stiffness: 100, damping: 30 });
  
  // Track if products animation is complete
  const [swipeComplete, setSwipeComplete] = useState(false);
  
  // Touch tracking for mobile
  const touchStartY = useRef(0);
  const lastScrollY = useRef(0);
  const aboutRef = useRef(null);
  const galleryRef = useRef(null);
  
  // Handle scroll events - controls both white overlay and products
  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    
    // Phase 1: Hero to White transition (first viewport scroll)
    if (scrollY < viewportHeight) {
      setScrollPhase(PHASE_WHITE_TRANSITION);
      const progress = scrollY / viewportHeight;
      setWhiteProgress(progress);
      swipeProgress.set(0);
      setSwipeComplete(false);
    } 
    // Phase 2: White fully covers screen - pin and animate products
    else if (scrollY >= viewportHeight && !swipeComplete) {
      setScrollPhase(PHASE_WHITE_PINNED);
      setWhiteProgress(1);
      
      // Calculate products animation progress based on additional scroll
      const extraScroll = scrollY - viewportHeight;
      const productAnimationRange = viewportHeight; // One full viewport to complete product animation
      const productProgress = Math.min(1, extraScroll / productAnimationRange);
      
      swipeProgress.set(productProgress);
      
      if (productProgress >= 1) {
        setSwipeComplete(true);
        setScrollPhase(PHASE_PRODUCTS);
      }
    }
    // Phase 3: Products complete, transition to about section
    else if (swipeComplete) {
      const aboutStart = viewportHeight * 2; // After hero + products animation
      const aboutScrollRange = viewportHeight * 1.5; // 1.5 viewports for white to slide up
      const galleryStart = aboutStart + aboutScrollRange + viewportHeight; // After about is fully shown for a bit
      const galleryTransitionRange = viewportHeight * 0.8; // Transition from about to gallery
      
      if (scrollY >= galleryStart) {
        // Phase 4: Gallery - fade out about, show gallery
        const galleryScroll = scrollY - galleryStart;
        const gProgress = Math.min(1, galleryScroll / galleryTransitionRange);
        setGalleryProgress(gProgress);
        setWhiteSlideUp(1);
        setAboutProgress(1);
        setWhiteProgress(1);
        setScrollPhase(PHASE_GALLERY);
      } else if (scrollY >= aboutStart) {
        const aboutScroll = scrollY - aboutStart;
        // White slides up as we scroll
        const slideProgress = Math.min(1, aboutScroll / aboutScrollRange);
        setWhiteSlideUp(slideProgress);
        
        // About content animates after white starts sliding
        const contentProgress = Math.min(1, Math.max(0, (aboutScroll - viewportHeight * 0.3) / viewportHeight));
        setAboutProgress(contentProgress);
        
        setWhiteProgress(1); // Keep white fully "height" but sliding up
        setScrollPhase(PHASE_ABOUT);
        setGalleryProgress(0);
      } else {
        setScrollPhase(PHASE_PRODUCTS);
        setWhiteProgress(1);
        setWhiteSlideUp(0);
        setAboutProgress(0);
        setGalleryProgress(0);
      }
    }
    
    lastScrollY.current = scrollY;
  }, [swipeProgress, swipeComplete]);
  
  // Add scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);
  
  // Text opacity - fades as products come in
  const textOpacity = useTransform(smoothProgress, [0, 0.5, 1], [1, 0.3, 0.1]);
  
  // Scroll hint opacity - hides as soon as user starts scrolling
  const scrollHintOpacity = useTransform(smoothProgress, [0, 0.1], [1, 0]);

  return (
    <div ref={containerRef} className="relative">
      {/* Scroll spacer - gives us space to scroll through all phases */}
      <div className="h-[700vh]" />
      
      {/* Hero Section - Fixed Full Screen */}
      <div ref={heroRef} className="fixed inset-0 w-full h-screen overflow-hidden" style={{ zIndex: 1 }}>
      {/* Full-Screen Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(/photographer/photos/hero-bg.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Artistic blur overlay */}
        <div className="absolute inset-0 backdrop-blur-[2px]" />
        {/* Dark gradient overlay for contrast */}
        <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/10 to-black/40" />
      </div>

      {/* Main Glass Panel Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 md:p-8">
        <motion.div
          className="glass-panel w-full max-w-[95vw] md:max-w-[85vw] h-[90vh] md:h-[85vh] relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ 
            opacity: 1 - whiteProgress * 1.5, 
            scale: 1 - whiteProgress * 0.3,
          }}
          transition={{ 
            duration: 0.1, 
            ease: "linear" 
          }}
          style={{
            transformOrigin: 'center center',
          }}
        >
          {/* Inner glow effect */}
          <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
          
          {/* Navigation Bar */}
          <motion.nav
            className="absolute top-0 left-0 right-0 z-20 px-6 md:px-12 py-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="flex items-center justify-between">
              {/* Logo/Brand */}
              <motion.div 
                className="font-title text-2xl md:text-3xl text-white tracking-wider"
                whileHover={{ scale: 1.02 }}
              >
                MACAO
              </motion.div>

              {/* Desktop Navigation */}
              <ul className="hidden md:flex items-center gap-8 lg:gap-12">
                {navLinks.map((link, index) => (
                  <motion.li
                    key={link.name}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <a
                      href={link.href}
                      className="text-white/80 hover:text-white text-sm font-medium tracking-wide transition-colors duration-300 relative group"
                    >
                      {link.name}
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full" />
                    </a>
                  </motion.li>
                ))}
              </ul>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden text-white p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            {/* Mobile Navigation Menu */}
            <motion.div
              className={`md:hidden absolute top-full left-0 right-0 bg-black/40 backdrop-blur-lg border-t border-white/10 ${mobileMenuOpen ? 'block' : 'hidden'}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: mobileMenuOpen ? 1 : 0, height: mobileMenuOpen ? 'auto' : 0 }}
            >
              <ul className="flex flex-col p-6 gap-4">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-white/80 hover:text-white text-lg font-medium block py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.nav>

          {/* Hero Content - Centered */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 md:px-12 pt-20 text-center">
            {/* Main Title */}
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white uppercase tracking-tight leading-tight max-w-4xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Unleash Your{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-white via-red-400 to-red-500">
                Adventure
              </span>
              <br />
              in Macao
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="mt-4 md:mt-6 text-base md:text-lg lg:text-xl text-white/70 font-light tracking-wide max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              Explore Pristine Beaches & Rugged Trails
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="mt-6 md:mt-10"
            >
              <motion.button
                className="group relative px-6 py-3 md:px-8 md:py-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm md:text-base uppercase tracking-wider rounded-full transition-all duration-300 shadow-lg shadow-red-600/30 hover:shadow-red-600/50 flex items-center gap-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                Book Your Tour Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>

            {/* Optional: Stats or Trust Indicators */}
            <motion.div
              className="mt-8 md:mt-12 flex flex-wrap items-center justify-center gap-6 md:gap-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.6 }}
            >
              {[
                { value: '500+', label: 'Happy Riders' },
                { value: '4.9', label: 'Rating' },
                { value: '3hrs', label: 'Adventure' },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-white/50 uppercase tracking-wide">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Decorative Corner Elements */}
          <div className="absolute top-6 left-6 w-12 h-12 border-l-2 border-t-2 border-white/20 rounded-tl-2xl" />
          <div className="absolute top-6 right-6 w-12 h-12 border-r-2 border-t-2 border-white/20 rounded-tr-2xl" />
          <div className="absolute bottom-6 left-6 w-12 h-12 border-l-2 border-b-2 border-white/20 rounded-bl-2xl" />
          <div className="absolute bottom-6 right-6 w-12 h-12 border-r-2 border-b-2 border-white/20 rounded-br-2xl" />

          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-black/20 to-transparent pointer-events-none" />
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: whiteProgress < 0.3 ? 1 : 0, y: 0 }}
        transition={{ delay: 1.3, duration: 0.6 }}
      >
        <motion.div
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2"
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <motion.div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
        </motion.div>
      </motion.div>
      </div>
      {/* End Hero Section */}

      {/* White Overlay - rises from bottom to cover the hero, then slides up to reveal about */}
      <div 
        ref={whiteOverlayRef}
        className="fixed inset-x-0 bottom-0 bg-white transition-none"
        style={{ 
          zIndex: 5,
          height: `${whiteProgress * 100}%`,
          opacity: whiteProgress > 0 ? 1 : 0,
          transform: `translateY(-${whiteSlideUp * 100}%)`,
        }}
      />

      {/* Products Section - Fixed when white covers screen, slides up with white */}
      <section 
        ref={productsRef}
        id="tours" 
        className="fixed inset-0 w-full h-screen overflow-hidden transition-opacity duration-300"
        style={{ 
          zIndex: whiteProgress >= 1 ? 10 : -1,
          opacity: whiteProgress >= 1 && whiteSlideUp < 1 ? 1 : 0,
          pointerEvents: whiteProgress >= 1 && whiteSlideUp < 0.5 ? 'auto' : 'none',
          transform: `translateY(-${whiteSlideUp * 100}%)`,
        }}
      >
        {/* Full Screen White Panel */}
        <div className="absolute inset-0 overflow-hidden">
          {/* White/Light gray background */}
          <div className="absolute inset-0 bg-white" />
          
          {/* Background Text - "Privado o Colectivo" */}
          <motion.div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ opacity: textOpacity }}
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold text-gray-800 tracking-tight whitespace-nowrap">
              Privado o Colectivo.
            </h2>
          </motion.div>
          
          {/* Product Cards Container */}
          <div className="relative w-full h-full">
            {/* Left Product - Privado (Top on mobile) */}
            <SwipeProductCard 
              product={products[0]} 
              position="left" 
              progress={smoothProgress}
              isMobile={isMobile}
            />
            
            {/* Right Product - Colectivo (Bottom on mobile) */}
            <SwipeProductCard 
              product={products[1]} 
              position="right" 
              progress={smoothProgress}
              isMobile={isMobile}
            />
          </div>
          
          {/* Scroll hint - only show when progress is 0 */}
          <motion.div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-400 text-sm flex flex-col items-center gap-2"
            style={{ opacity: scrollHintOpacity }}
          >
            <span>Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* About Section - Transparent background showing hero image */}
      <section
        ref={aboutRef}
        className="fixed inset-0 w-full h-screen overflow-hidden"
        style={{
          zIndex: 3, // Behind white overlay (5) but visible as white slides up
          opacity: whiteSlideUp > 0 ? Math.max(0, 1 - galleryProgress * 2) : 0,
          pointerEvents: whiteSlideUp > 0.3 && galleryProgress < 0.3 ? 'auto' : 'none',
        }}
      >
        {/* Semi-transparent overlay for readability */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        
        {/* Content Container */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 md:px-12">
          
          {/* Main Title */}
          <motion.h2
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white text-center mb-8"
            initial={{ opacity: 0, y: 50 }}
            animate={{
              opacity: aboutProgress > 0.1 ? 1 : 0,
              y: aboutProgress > 0.1 ? 0 : 50,
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            La Aventura Te Espera
          </motion.h2>
          
          {/* Subtitle */}
          <motion.p
            className="text-lg md:text-xl text-white/80 text-center max-w-2xl mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{
              opacity: aboutProgress > 0.2 ? 1 : 0,
              y: aboutProgress > 0.2 ? 0 : 30,
            }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            Explora los paisajes más impresionantes de Macao en nuestros buggies de última generación
          </motion.p>
          
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl w-full">
            {/* Card 1 - Experience */}
            <motion.div
              className="glass-panel p-6 md:p-8 text-center pointer-events-auto"
              initial={{ opacity: 0, y: 60, scale: 0.9 }}
              animate={{
                opacity: aboutProgress > 0.3 ? 1 : 0,
                y: aboutProgress > 0.3 ? 0 : 60,
                scale: aboutProgress > 0.3 ? 1 : 0.9,
              }}
              transition={{ duration: 0.5, delay: 0, ease: "easeOut" }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Adrenalina Pura</h3>
              <p className="text-white/70 text-sm">Siente la emoción de conducir por terrenos extremos</p>
            </motion.div>
            
            {/* Card 2 - Safety */}
            <motion.div
              className="glass-panel p-6 md:p-8 text-center pointer-events-auto"
              initial={{ opacity: 0, y: 60, scale: 0.9 }}
              animate={{
                opacity: aboutProgress > 0.4 ? 1 : 0,
                y: aboutProgress > 0.4 ? 0 : 60,
                scale: aboutProgress > 0.4 ? 1 : 0.9,
              }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">100% Seguro</h3>
              <p className="text-white/70 text-sm">Equipos certificados y guías profesionales</p>
            </motion.div>
            
            {/* Card 3 - Nature */}
            <motion.div
              className="glass-panel p-6 md:p-8 text-center pointer-events-auto"
              initial={{ opacity: 0, y: 60, scale: 0.9 }}
              animate={{
                opacity: aboutProgress > 0.5 ? 1 : 0,
                y: aboutProgress > 0.5 ? 0 : 60,
                scale: aboutProgress > 0.5 ? 1 : 0.9,
              }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Naturaleza Virgen</h3>
              <p className="text-white/70 text-sm">Descubre playas secretas y selvas tropicales</p>
            </motion.div>
          </div>
          
          {/* CTA Button */}
          <motion.div
            className="mt-12 pointer-events-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{
              opacity: aboutProgress > 0.6 ? 1 : 0,
              y: aboutProgress > 0.6 ? 0 : 30,
            }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          >
            <motion.button
              className="group px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-lg uppercase tracking-wider rounded-full transition-all duration-300 shadow-lg shadow-red-600/30 hover:shadow-red-600/50 flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Reserva Ahora
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
          
          {/* Floating Stats */}
          <motion.div
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-8 md:gap-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: aboutProgress > 0.7 ? 1 : 0,
              y: aboutProgress > 0.7 ? 0 : 20,
            }}
            transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
          >
            <div className="text-center">
              <motion.div 
                className="text-3xl md:text-4xl font-bold text-white"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0 }}
              >
                1000+
              </motion.div>
              <div className="text-xs text-white/60 uppercase tracking-wide">Aventureros</div>
            </div>
            <div className="text-center">
              <motion.div 
                className="text-3xl md:text-4xl font-bold text-white"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
              >
                5★
              </motion.div>
              <div className="text-xs text-white/60 uppercase tracking-wide">Calificación</div>
            </div>
            <div className="text-center">
              <motion.div 
                className="text-3xl md:text-4xl font-bold text-white"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.6 }}
              >
                4hrs
              </motion.div>
              <div className="text-xs text-white/60 uppercase tracking-wide">De Aventura</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Gallery Section - Fixed, appears after about */}
      <section
        ref={galleryRef}
        className="fixed inset-0 w-full h-screen overflow-hidden"
        style={{
          zIndex: galleryProgress > 0 ? 15 : -1,
          opacity: galleryProgress,
          pointerEvents: galleryProgress > 0.3 ? 'auto' : 'none',
        }}
      >
        {/* Dark background */}
        <div className="absolute inset-0 bg-black" />
        
        {/* Gallery Content */}
        <div className="relative z-10 h-full flex items-center">
          <GallerySection isVisible={galleryProgress > 0.2} />
        </div>
      </section>
    </div>
  );
}
