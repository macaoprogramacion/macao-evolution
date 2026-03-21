import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import GlassCard from '@/components/photographer/ui/GlassCard';

export default function PhotoCard({ 
  image, 
  isSelected = false,
  onSelect,
}) {
  return (
    <GlassCard 
      className={`overflow-hidden group cursor-pointer ${isSelected ? 'ring-4 ring-red-500' : ''}`} 
      hover={!isSelected}
      onClick={onSelect}
    >
      {/* Photo */}
      <div className="aspect-square overflow-hidden relative">
        <motion.img 
          src={image} 
          alt=""
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        />
        {/* Selection overlay */}
        {isSelected && (
          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
            <div className="bg-red-500 rounded-full p-2">
              <Check className="w-6 h-6 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Select button */}
      <div className="p-3 flex items-center justify-center">
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl w-full justify-center
            ${isSelected 
              ? 'bg-red-500 text-white' 
              : 'bg-black/40 hover:bg-red-500 hover:text-white text-white'
            }
            transition-colors duration-200
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">
            {isSelected ? 'Seleccionada' : 'Seleccionar'}
          </span>
        </motion.button>
      </div>
    </GlassCard>
  );
}
