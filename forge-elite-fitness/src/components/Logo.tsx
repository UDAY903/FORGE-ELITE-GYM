import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 'md' }) => {
  const sizeClasses = {
    sm: { pill: 'w-1.5 h-5', text: 'text-sm', elite: 'text-[10px]' },
    md: { pill: 'w-2 h-7', text: 'text-xl', elite: 'text-xl' },
    lg: { pill: 'w-2.5 h-10', text: 'text-3xl', elite: 'text-3xl' },
    xl: { pill: 'w-3 h-12', text: 'text-5xl', elite: 'text-5xl' },
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${currentSize.pill} bg-brand rounded-full shadow-[0_0_15px_rgba(255,107,0,0.3)]`} />
      <span className={`${currentSize.text} font-black italic tracking-tighter uppercase whitespace-nowrap`}>
        FORGE <span className="text-brand">ELITE</span>
      </span>
    </div>
  );
};
