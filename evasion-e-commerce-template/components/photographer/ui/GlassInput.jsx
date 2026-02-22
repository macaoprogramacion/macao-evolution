import { forwardRef } from 'react';

const GlassInput = forwardRef(({ className = '', icon: Icon, ...props }, ref) => {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
      )}
      <input
        ref={ref}
        className={`
          w-full px-6 py-4 
          ${Icon ? 'pl-12' : ''}
          bg-black/30 backdrop-blur-md
          border border-white/20 rounded-2xl
          text-white placeholder:text-white/50
          focus:outline-none focus:ring-2 focus:ring-red-500/50
          focus:border-red-500/50
          transition-all duration-200
          ${className}
        `}
        {...props}
      />
    </div>
  );
});

GlassInput.displayName = 'GlassInput';

export default GlassInput;
