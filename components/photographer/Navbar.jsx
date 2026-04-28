"use client"

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { clearDashboardSession, getDashboardSession } from '@/lib/dashboard-session';

export default function Navbar({ title = 'MACAO OFFROAD EXPERIENCE', mobileTitle = 'Panel del Fotógrafo' }) {
  const router = useRouter();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    getDashboardSession().then((session) => {
      if (session && session.active) {
        setUserName(session.name);
      }
    });
  }, []);

  const handleLogout = async () => {
    await clearDashboardSession();
    router.push('/photographer');
  };

  return (
    <header className="bg-black/30 backdrop-blur-xl border-b border-white/20">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <Image
            src="/Logo PNG/MACAO LOGO-04.png"
            alt="MACAO Logo"
            width={120}
            height={40}
            className="h-9 w-auto"
          />
          <h1 className="font-title text-xl tracking-wide text-white">
            <span className="hidden md:inline">{title}</span>
            <span className="md:hidden">{mobileTitle}</span>
          </h1>
        </div>

        {/* User Badge + Logout */}
        {userName && (
          <div className="flex items-center gap-2">
            <div className="bg-black/40 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="font-medium">{userName}</span>
            </div>
            <motion.button
              onClick={handleLogout}
              className="p-2 rounded-full bg-black/30 hover:bg-red-600/60 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4 text-white" />
            </motion.button>
          </div>
        )}
      </div>
    </header>
  );
}
