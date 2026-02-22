"use client"

import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { Home, FolderOpen, DollarSign, Users, Settings } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Inicio', path: '/photographer/dashboard' },
  { icon: FolderOpen, label: 'Portafolios', path: '/photographer/portfolios' },
  { icon: DollarSign, label: 'Finanzas', path: '/photographer/finances' },
  { icon: Users, label: 'Clientes', path: '/photographer/clients' },
  { icon: Settings, label: 'Ajustes', path: '/photographer/settings' },
];

export default function BottomNav() {
  const router = useRouter();
  const currentPath = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden z-50">
      <div className="bg-black/30 backdrop-blur-xl border-t border-white/20">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;
            
            return (
              <motion.button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`
                  flex flex-col items-center gap-1 px-4 py-2 rounded-xl
                  transition-colors duration-200
                  ${isActive 
                    ? 'text-red-500' 
                    : 'text-white/70'
                  }
                `}
                whileTap={{ scale: 0.9 }}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
