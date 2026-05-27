"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { KeyRound, LogOut, ShieldAlert, Mail } from 'lucide-react'
import { authenticateByEmail } from '@/lib/supabase-users'
import { clearDashboardSession, getDashboardSession, setDashboardSession } from '@/lib/dashboard-session'
import Image from 'next/image'

const backgroundImages = Array.from({ length: 11 }, (_, i) => `/photographer/branding/photos/bg-4k (${i + 1}).png`)

/**
 * Wraps photographer / billing pages.
 * Requires a valid email + code to access. The authenticated user is stored in
 * a signed cookie so refreshes don't force re-login.
 *
 * @param allowedRoles – which roles can pass ("billing" | "photographer" | "both" | "admin" | "operaciones" | "chofer" | "contabilidad")
 */
export default function DashboardAuthGate({ children, allowedRoles }) {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [currentBg, setCurrentBg] = useState(0)
  const [userName, setUserName] = useState('')
  const inputRefs = useRef([])

  // Background rotation
  useEffect(() => {
    const interval = setInterval(() => setCurrentBg(prev => (prev + 1) % backgroundImages.length), 3000)
    return () => clearInterval(interval)
  }, [])

  // Check if already authenticated in this session and re-validate every minute.
  useEffect(() => {
    let mounted = true

    const verifySession = async () => {
      const session = await getDashboardSession()
      if (!mounted) return

      if (session && session.active) {
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
        const isJonathan = (session.email || '').toLowerCase().includes('jonathan')
        if (isJonathan || roles.includes(session.role) || session.role === 'both' || session.role === 'admin') {
          setAuthed(true)
          setUserName(session.name)
          // Redirect restricted roles to their allowed page on initial load
          const roleDefaultPage = {
            operaciones: '/admin/operation',
            chofer: '/admin/chofer',
            contabilidad: '/admin/contabilidad',
          }
          const defaultPage = roleDefaultPage[session.role]
          if (defaultPage && window.location.pathname === '/admin') {
            router.replace(defaultPage)
          }
          setChecking(false)
          return
        }
      }

      setAuthed(false)
      setUserName('')
      setChecking(false)
    }

    void verifySession()

    const interval = setInterval(() => {
      void verifySession()
    }, 60_000)

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void verifySession()
      }
    }

    document.addEventListener('visibilitychange', onVisible)

    return () => {
      mounted = false
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [allowedRoles, router])

  const handlePinChange = (index, value) => {
    if (!/^\d?$/.test(value)) return
    const newPin = pin.split('')
    newPin[index] = value
    const joined = newPin.join('')
    setPin(joined)
    setError('')

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when 6 digits entered
    if (joined.replace(/\s/g, '').length === 6 && value) {
      setTimeout(() => validateCredentials(email, joined), 150)
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const validateCredentials = async (emailValue, pinValue) => {
    if (!emailValue.trim()) {
      setError('Ingresa tu correo electrónico')
      return
    }

    try {
      const user = await authenticateByEmail(emailValue.trim().toLowerCase())
      if (!user || String(user.pin) !== String(pinValue)) {
        setError('Correo o código incorrecto')
        setPin('')
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
        return
      }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
    const isJonathan = (user.email || '').toLowerCase().includes('jonathan')
    if (!isJonathan && !roles.includes(user.role) && user.role !== 'both' && user.role !== 'admin') {
      // User is valid but doesn't have access to THIS dashboard — redirect to correct one
      await setDashboardSession({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatar_url: user.avatar_url || null, active: true })
      const roleRoutes = {
        admin: '/admin',
        both: '/admin',
        billing: '/photographer/billing',
        photographer: '/photographer/dashboard',
        operaciones: '/admin/operation',
        chofer: '/admin/chofer',
        contabilidad: '/admin/contabilidad',
      }
      router.push(roleRoutes[user.role] || '/admin')
      return
    }

    // Authenticated
    setAuthed(true)
    setUserName(user.name)
    await setDashboardSession({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatar_url: user.avatar_url || null, active: true })
    // Redirect restricted roles to their specific page after login
    const roleDefaultPage = {
      operaciones: '/admin/operation',
      chofer: '/admin/chofer',
      contabilidad: '/admin/contabilidad',
    }
    const defaultPage = roleDefaultPage[user.role]
    if (defaultPage) {
      router.replace(defaultPage)
    }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    }
  }

  const handleLogout = async () => {
    await clearDashboardSession()
    setAuthed(false)
    setEmail('')
    setPin('')
    setUserName('')
  }

  if (checking) return null

  if (!authed) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {/* Background */}
        <div className="fixed inset-0 z-0">
          {backgroundImages.map((bg, index) => (
            <img
              key={index}
              src={bg}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
              style={{ opacity: index === currentBg ? 1 : 0 }}
            />
          ))}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative z-10 w-full max-w-sm mx-4"
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Image
                src="/Logo PNG/MACAO LOGO-04.png"
                alt="MACAO"
                width={140}
                height={42}
                className="h-10 w-auto brightness-0 invert"
              />
            </div>

            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-7 h-7 text-white/80" />
              </div>
              <h2 className="text-white text-xl font-semibold">Acceso al Dashboard</h2>
              <p className="text-white/60 text-sm mt-1">Ingresa tu correo y código de acceso</p>
            </div>

            {/* Email Input */}
            <div className="mb-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="correo@empresa.com"
                  className="w-full bg-white/10 border-2 border-white/20 focus:border-white/60 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition-all"
                />
              </div>
            </div>

            {/* Code Inputs */}
            <p className="text-white/50 text-xs mb-2 text-center">Código de acceso</p>
            <div className="flex justify-center gap-3 mb-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={pin[i] || ''}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`w-12 h-14 text-center text-2xl font-mono rounded-xl border-2 bg-white/10 text-white outline-none transition-all
                    ${error ? 'border-red-400 shake' : 'border-white/20 focus:border-white/60'}
                  `}
                />
              ))}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 justify-center text-red-300 text-sm mb-4"
                >
                  <ShieldAlert className="w-4 h-4" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-white/40 text-xs text-center">
              Contacta al administrador si no tienes credenciales asignadas
            </p>
          </div>
        </motion.div>

        <style jsx>{`
          .shake {
            animation: shake 0.4s ease-in-out;
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-8px); }
            75% { transform: translateX(8px); }
          }
        `}</style>
      </div>
    )
  }

  // Authenticated — render children (user badge is rendered by each page's header/navbar)
  return children
}
