import { motion } from 'framer-motion';
import { Phone, Clock, AlertTriangle } from 'lucide-react';
import GlassCard from '@/components/photographer/ui/GlassCard';
import GlassButton from '@/components/photographer/ui/GlassButton';

const statusColors = {
  'Vendido': 'bg-green-400/80 text-white',
  'Descargado': 'bg-blue-400/80 text-white',
  'Pendiente': 'bg-amber-400/80 text-white',
  'Vendido/Com...': 'bg-green-400/80 text-white',
};

export default function PortfolioCard({ 
  image, 
  clientName, 
  status, 
  commission, 
  date, 
  dateLabel = 'Subido el',
  remainingDays,
  expiringSoon,
  expired,
  onView,
  onEdit,
  onDelete,
  onCall,
}) {
  return (
    <GlassCard className={`p-4 relative ${
      expired ? 'border-2 border-gray-500/50' :
      expiringSoon ? 'border-2 border-red-500/50' : ''
    }`}>
      <div className="flex gap-4">
        {/* Client photo */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white/30">
            <img 
              src={image} 
              alt={clientName}
              className="w-full h-full object-cover"
            />
          </div>
          {expiringSoon && (
            <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1">
              <AlertTriangle className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white font-medium truncate">
                Cliente: {clientName}
              </p>
              <p className="text-white/80 text-sm truncate">
                Estado: {status}
              </p>
              <p className="text-white/80 text-sm">
                Comisión: ${commission}
              </p>
              <p className="text-white/60 text-xs">
                {dateLabel}: {date}
              </p>
            </div>
            
            {/* Phone button */}
            <motion.button
              onClick={onCall}
              className="p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Phone className="w-4 h-4 text-white" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Expiration info */}
      {remainingDays !== undefined && (
        <div className={`mt-3 p-2 rounded-xl ${
          expired ? 'bg-gray-500/20' :
          expiringSoon ? 'bg-red-500/20' : 'bg-white/5'
        } flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${
              expired ? 'text-gray-400' :
              expiringSoon ? 'text-red-400' : 'text-white/60'
            }`} />
            <span className={`text-sm ${
              expired ? 'text-gray-400' :
              expiringSoon ? 'text-red-400 font-medium' : 'text-white/70'
            }`}>
              {expired 
                ? 'Expirado' 
                : `${remainingDays} días restantes`
              }
            </span>
          </div>
          {expiringSoon && (
            <span className="text-xs text-red-400 font-medium">¡Urgente!</span>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-4">
        <GlassButton 
          variant="primary" 
          className="flex-1 py-2 text-sm"
          onClick={onView}
        >
          Ver
        </GlassButton>
        <GlassButton 
          variant="secondary" 
          className="flex-1 py-2 text-sm"
          onClick={onEdit}
        >
          Editar
        </GlassButton>
        <GlassButton 
          variant="secondary" 
          className="flex-1 py-2 text-sm"
          onClick={onDelete}
        >
          Eliminar
        </GlassButton>
      </div>
    </GlassCard>
  );
}
