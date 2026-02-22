import { motion } from 'framer-motion';

export default function GlassButton({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) {
  const variants = {
    primary: 'bg-red-600 hover:bg-red-700 text-white',
    secondary: 'bg-black/30 hover:bg-black/40 text-white',
    ghost: 'bg-transparent hover:bg-black/20 text-white',
  };

  return (
    <motion.button
      className={`
        px-6 py-3 rounded-2xl font-medium
        backdrop-blur-md border border-white/30
        transition-colors duration-200
        shadow-lg
        ${variants[variant]}
        ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
