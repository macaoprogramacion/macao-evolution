"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Phone } from 'lucide-react'
import AuraBubbles from '@/components/photographer/AuraBubbles'
import GlassCard from '@/components/photographer/ui/GlassCard'
import GlassButton from '@/components/photographer/ui/GlassButton'
import GlassInput from '@/components/photographer/ui/GlassInput'
import Image from 'next/image'

const backgroundImages = Array.from({ length: 11 }, (_, i) => `/photographer/branding/photos/bg-4k (${i + 1}).png`)
const bubbleImages = Array.from({ length: 11 }, (_, i) => `/photographer/photos/bubble-photos (${i + 1}).png`)

export default function PhotographerLandingPage() {
  const [phone, setPhone] = useState('')
  const [currentBgIndex, setCurrentBgIndex] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleAccess = () => {
    if (phone.length >= 7) {
      router.push(`/photographer/gallery?phone=${phone}`)
    }
  }

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
            style={{ opacity: index === currentBgIndex ? 1 : 0 }}
          />
        ))}
        <div className="absolute inset-0 z-10 bg-black/30 backdrop-blur-sm" />
      </div>

      {/* Aura Bubbles */}
      <AuraBubbles images={bubbleImages} count={8} minSize={100} maxSize={220} maxVisible={2} />
      <div className="hidden md:block">
        <AuraBubbles images={bubbleImages} count={4} minSize={80} maxSize={160} maxVisible={1} />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen px-4">
        <motion.div
          className="absolute top-2 left-0 right-0 flex justify-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <img src="/photographer/branding/macao-logo.png" alt="Macao Offroad Experience" className="w-48 md:w-64 h-auto" />
        </motion.div>

        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center">
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
                  <GlassButton variant="primary" onClick={handleAccess}>
                    Acceder
                  </GlassButton>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
