"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import DashboardAuthGate from '@/components/photographer/DashboardAuthGate';
import { 
  User, 
  Camera,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Save,
  Mail,
  Phone,
  Building
} from 'lucide-react';
import Navbar from '@/components/photographer/Navbar';
import Sidebar from '@/components/photographer/Sidebar';
import BottomNav from '@/components/photographer/BottomNav';
import { GlassCard, GlassButton } from '@/components/photographer/ui';
import { updateSupabaseUser } from '@/lib/supabase-users';
import { supabase } from '@/lib/supabase';
import { useTheme } from 'next-themes';
import { getDashboardSession, setDashboardSession } from '@/lib/dashboard-session';

// Background image

const settingsSections = [
  {
    id: 'profile',
    icon: User,
    title: 'Perfil',
    description: 'Información personal y foto de perfil',
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notificaciones',
    description: 'Preferencias de alertas y avisos',
  },
  {
    id: 'help',
    icon: HelpCircle,
    title: 'Ayuda',
    description: 'Soporte y documentación',
  },
];

export default function AjustesPage() {
  
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('profile');
  const [userId, setUserId] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    company: 'Macao Memories',
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Load real user data from session
  useEffect(() => {
    getDashboardSession().then((session) => {
      if (session) {
        setUserId(session.id);
        if (session.avatar_url) setAvatarUrl(session.avatar_url);
        setProfile(prev => ({
          ...prev,
          name: session.name || '',
          email: session.email || '',
          phone: session.phone || '',
          role: session.role || '',
        }));
      }
    });
  }, []);

  const handleAvatarUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (!file.type.startsWith('image/')) {
      setSaveMessage('Solo se permiten imágenes');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSaveMessage('La imagen no puede superar 5MB');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `avatars/${userId}.${ext}`;
      // Upload (upsert to overwrite previous avatar)
      const { error: uploadErr } = await supabase.storage
        .from('portfolio-media')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage
        .from('portfolio-media')
        .getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl + '?t=' + Date.now();
      // Save URL to database
      await updateSupabaseUser(userId, { avatar_url: publicUrl });
      setAvatarUrl(publicUrl);
      // Update session
      const session = await getDashboardSession();
      if (session) {
        await setDashboardSession({ ...session, avatar_url: publicUrl, active: true });
      }
      setSaveMessage('Foto de perfil actualizada');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveMessage('Error al subir la imagen: ' + (err.message || ''));
      setTimeout(() => setSaveMessage(''), 4000);
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  }, [userId]);

  const handleSaveProfile = useCallback(async () => {
    if (!userId || saving) return;
    setSaving(true);
    setSaveMessage('');
    try {
      await updateSupabaseUser(userId, {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
      });
      // Update session with new data
      const session = await getDashboardSession();
      if (session) {
        await setDashboardSession({
          ...session,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          active: true,
        });
      }
      setSaveMessage('Cambios guardados correctamente');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveMessage('Error al guardar los cambios');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  }, [userId, profile, saving]);
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
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-2 border-white/20"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-3xl font-bold">
                    {profile.name ? profile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??'}
                  </div>
                )}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <motion.button
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-black/50 border border-white/20"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 text-white" />
                  )}
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

            <div className="flex items-center gap-4">
              <GlassButton variant="primary" className="flex items-center gap-2" onClick={handleSaveProfile} disabled={saving}>
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </GlassButton>
              {saveMessage && (
                <span className={`text-sm ${saveMessage.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                  {saveMessage}
                </span>
              )}
            </div>
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
        const themeMap = { 'Oscuro': 'dark', 'Claro': 'light', 'Sistema': 'system' };
        const reverseMap = { 'dark': 'Oscuro', 'light': 'Claro', 'system': 'Sistema' };
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-title text-white">Apariencia</h2>
            
            <div>
              <p className="text-white/60 text-sm mb-3">Tema</p>
              <div className="grid grid-cols-3 gap-3">
                {['Oscuro', 'Claro', 'Sistema'].map((t) => (
                  <motion.button
                    key={t}
                    onClick={() => setTheme(themeMap[t])}
                    className={`p-4 rounded-2xl border-2 transition-colors ${
                      theme === themeMap[t]
                        ? 'border-red-500 bg-red-500/20' 
                        : 'border-white/20 bg-black/30 hover:border-white/40'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <p className="text-white font-medium">{t}</p>
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
    <DashboardAuthGate allowedRoles={["photographer", "both", "admin"]}>
    <div className="min-h-screen flex flex-col relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url("/photographer/branding/photos/bg-4k-ftg.png")`,
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
            <h1 className="text-2xl font-title text-white mb-6">Configuracion</h1>

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
    </DashboardAuthGate>
  );
}
