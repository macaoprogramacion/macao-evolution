import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FolderOpen, DollarSign, Users, Settings } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Inicio', path: '/dashboard' },
  { icon: FolderOpen, label: 'Portafolios', path: '/portfolios' },
  { icon: DollarSign, label: 'Finanzas', path: '/finances' },
  { icon: Users, label: 'Clientes', path: '/clients' },
  { icon: Settings, label: 'Ajustes', path: '/settings' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

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
                onClick={() => navigate(item.path)}
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
