import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Camera,
  Lock,
  Bell,
  Palette,
  Globe,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronRight,
  Save,
  Mail,
  Phone,
  Building
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { GlassCard, GlassButton } from '../components/ui';

// Background image
import bgFtg from '../assets/branding/photos/bg-4k-ftg.png';

const settingsSections = [
  {
    id: 'profile',
    icon: User,
    title: 'Perfil',
    description: 'Información personal y foto de perfil',
  },
  {
    id: 'security',
    icon: Lock,
    title: 'Seguridad',
    description: 'Contraseña y autenticación',
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notificaciones',
    description: 'Preferencias de alertas y avisos',
  },
  {
    id: 'appearance',
    icon: Palette,
    title: 'Apariencia',
    description: 'Tema y personalización visual',
  },
  {
    id: 'billing',
    icon: CreditCard,
    title: 'Facturación',
    description: 'Métodos de pago y suscripción',
  },
  {
    id: 'help',
    icon: HelpCircle,
    title: 'Ayuda',
    description: 'Soporte y documentación',
  },
];

export default function AjustesPage() {
  
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState({
    name: 'Carlos Méndez',
    email: 'carlos.mendez@macao.com',
    phone: '809-555-0100',
    role: 'Fotógrafo Senior',
    company: 'Macao Memories',
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sales: true,
    updates: false,
  });

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-title text-white">Perfil de Usuario</h2>
            
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-3xl font-bold">
                  CM
                </div>
                <motion.button
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-black/50 border border-white/20"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Camera className="w-4 h-4 text-white" />
                </motion.button>
              </div>
              <div>
                <p className="text-white font-medium text-lg">{profile.name}</p>
                <p className="text-white/60">{profile.role}</p>
              </div>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-xs mb-1.5">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-black/30 rounded-2xl border border-white/20 
                              text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-white/60 text-xs mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-black/30 rounded-2xl border border-white/20 
                              text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 text-xs mb-1.5">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-black/30 rounded-2xl border border-white/20 
                              text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 text-xs mb-1.5">Empresa</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input
                    type="text"
                    value={profile.company}
                    onChange={(e) => setProfile({...profile, company: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-black/30 rounded-2xl border border-white/20 
                              text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>

            <GlassButton variant="primary" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Guardar Cambios
            </GlassButton>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-title text-white">Seguridad</h2>
            
            <GlassCard className="p-4" hover={false}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Cambiar Contraseña</p>
                  <p className="text-white/60 text-sm">Última actualización hace 30 días</p>
                </div>
                <GlassButton variant="secondary" className="text-sm">
                  Cambiar
                </GlassButton>
              </div>
            </GlassCard>

            <GlassCard className="p-4" hover={false}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Autenticación de dos factores</p>
                  <p className="text-white/60 text-sm">Agrega una capa extra de seguridad</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-white/20 peer-focus:ring-2 peer-focus:ring-red-500 rounded-full peer peer-checked:bg-red-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            </GlassCard>

            <GlassCard className="p-4" hover={false}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Sesiones activas</p>
                  <p className="text-white/60 text-sm">2 dispositivos conectados</p>
                </div>
                <GlassButton variant="secondary" className="text-sm">
                  Ver
                </GlassButton>
              </div>
            </GlassCard>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-title text-white">Notificaciones</h2>
            
            {[
              { key: 'email', label: 'Notificaciones por Email', desc: 'Recibe actualizaciones en tu correo' },
              { key: 'push', label: 'Notificaciones Push', desc: 'Alertas en tiempo real' },
              { key: 'sales', label: 'Alertas de Ventas', desc: 'Notificar cuando se realice una venta' },
              { key: 'updates', label: 'Actualizaciones del Sistema', desc: 'Novedades y mejoras' },
            ].map((item) => (
              <GlassCard key={item.key} className="p-4" hover={false}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{item.label}</p>
                    <p className="text-white/60 text-sm">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={notifications[item.key]}
                      onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-white/20 peer-focus:ring-2 peer-focus:ring-red-500 rounded-full peer peer-checked:bg-red-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
              </GlassCard>
            ))}
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-title text-white">Apariencia</h2>
            
            <div>
              <p className="text-white/60 text-sm mb-3">Tema</p>
              <div className="grid grid-cols-3 gap-3">
                {['Oscuro', 'Claro', 'Sistema'].map((theme) => (
                  <motion.button
                    key={theme}
                    className={`p-4 rounded-2xl border-2 transition-colors ${
                      theme === 'Oscuro' 
                        ? 'border-red-500 bg-red-500/20' 
                        : 'border-white/20 bg-black/30 hover:border-white/40'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <p className="text-white font-medium">{theme}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            <GlassCard className="p-4" hover={false}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Animaciones</p>
                  <p className="text-white/60 text-sm">Efectos de transición suaves</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-white/20 peer-focus:ring-2 peer-focus:ring-red-500 rounded-full peer peer-checked:bg-red-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            </GlassCard>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-white/60">Sección en desarrollo</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${bgFtg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      </div>

      {/* Navbar */}
      <div className="relative z-10">
        <Navbar 
          title="MACAO MEMORIES - Ajustes" 
          mobileTitle="Ajustes"
        />
      </div>

      <div className="flex-1 flex relative z-10">
        {/* Sidebar */}
        <Sidebar  />

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 overflow-auto">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-title text-white mb-6">Configuración</h1>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Settings menu */}
              <div className="lg:w-72 flex-shrink-0">
                <GlassCard className="p-2" hover={false}>
                  {settingsSections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    
                    return (
                      <motion.button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                          isActive ? 'bg-red-500/30 text-white' : 'text-white/70 hover:bg-black/30'
                        }`}
                        whileHover={{ x: 4 }}
                      >
                        <Icon className="w-5 h-5" />
                        <div className="flex-1 text-left">
                          <p className="font-medium">{section.title}</p>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${isActive ? 'text-red-400' : 'text-white/40'}`} />
                      </motion.button>
                    );
                  })}

                  <hr className="my-2 border-white/10" />

                  <motion.button
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Cerrar Sesión</span>
                  </motion.button>
                </GlassCard>
              </div>

              {/* Settings content */}
              <div className="flex-1">
                <GlassCard className="p-6" hover={false}>
                  {renderSection()}
                </GlassCard>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Bottom navigation */}
      <BottomNav  />
    </div>
  );
}
