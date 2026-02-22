import { motion } from 'framer-motion';
import { User, Bell, LogOut } from 'lucide-react';

export default function Navbar({ title = 'MACAO OFFROAD EXPERIENCE', mobileTitle = 'Panel del Fotógrafo' }) {
  return (
    <header className="bg-black/30 backdrop-blur-xl border-b border-white/20">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Title - different for mobile and desktop */}
        <h1 className="font-title text-xl tracking-wide text-white">
          <span className="hidden md:inline">{title}</span>
          <span className="md:hidden">{mobileTitle}</span>
        </h1>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <motion.button
            className="p-2 rounded-full bg-black/30 hover:bg-black/40 transition-colors relative"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <User className="w-5 h-5 text-white" />
          </motion.button>

          <motion.button
            className="p-2 rounded-full bg-black/30 hover:bg-black/40 transition-colors relative"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Bell className="w-5 h-5 text-white" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
              3
            </span>
          </motion.button>

          <motion.button
            className="p-2 rounded-full bg-black/30 hover:bg-black/40 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <LogOut className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>
    </header>
  );
}
