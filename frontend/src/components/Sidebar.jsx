import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  FolderOpen, 
  DollarSign, 
  Users, 
  Settings 
} from 'lucide-react';
import { GlassCard } from './ui';

const menuItems = [
  { icon: Home, label: 'Inicio', path: '/dashboard' },
  { icon: FolderOpen, label: 'Portafolios', path: '/portfolios' },
  { icon: DollarSign, label: 'Finanzas', path: '/finances' },
  { icon: Users, label: 'Clientes', path: '/clients' },
  { icon: Settings, label: 'Ajustes', path: '/settings' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <GlassCard className="w-64 p-4 h-full hidden lg:block" hover={false}>
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const isActive = currentPath === item.path;
          const Icon = item.icon;
          
          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-2xl
                transition-colors duration-200
                ${isActive 
                  ? 'bg-red-600 text-white shadow-lg' 
                  : 'text-white hover:bg-black/30'
                }
              `}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>
    </GlassCard>
  );
}
