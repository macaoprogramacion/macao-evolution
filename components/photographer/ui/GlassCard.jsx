import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', hover = true, ...props }) {
  return (
    <motion.div
      className={`
        bg-black/25 backdrop-blur-xl 
        border border-white/20 
        rounded-3xl shadow-xl
        ${className}
      `}
      whileHover={hover ? { scale: 1.02, y: -2 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
