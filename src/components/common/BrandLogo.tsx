import React from 'react';
import { Rocket } from 'lucide-react';

export interface BrandLogoProps {
  variant?: 'navbar' | 'compact' | 'dark' | 'badge';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'navbar',
  size = 'md',
  className = '',
  onClick,
}) => {
  // Size classes for icon container
  const iconContainerSizes = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-2xl',
    lg: 'w-12 h-12 rounded-2xl',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base sm:text-lg',
    lg: 'text-xl sm:text-2xl',
  };

  const subtitleSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px] sm:text-[11px]',
    lg: 'text-xs',
  };

  // Compact icon-only variant
  if (variant === 'compact') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center justify-center shrink-0 bg-[#6355F4] text-white shadow-md shadow-purple-500/25 ${iconContainerSizes[size]} ${
          onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''
        } ${className}`}
        title="Startup Incubation Platform"
      >
        <Rocket className={iconSizes[size]} />
      </div>
    );
  }

  // Dashboard in-header mini badge variant
  if (variant === 'badge') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center gap-2 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        <div className="w-6 h-6 rounded-lg bg-[#6355F4] text-white flex items-center justify-center shadow-xs shrink-0">
          <Rocket className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-extrabold text-gray-900 text-xs tracking-tight">Startup</span>
          <span className="text-[10px] font-extrabold tracking-wider text-[#6355F4] uppercase">
            Incubation Platform
          </span>
        </div>
      </div>
    );
  }

  // Dark variant (for dark purple / navy backgrounds like Login, Signup, Footer)
  if (variant === 'dark') {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center gap-3 select-none ${
          onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
        } ${className}`}
      >
        <div
          className={`shrink-0 bg-[#6355F4] text-white flex items-center justify-center shadow-md shadow-purple-900/40 border border-white/20 ${iconContainerSizes[size]}`}
        >
          <Rocket className={iconSizes[size]} />
        </div>
        <div className="flex flex-col text-left">
          <span className={`font-black text-white tracking-tight leading-none ${titleSizes[size]}`}>
            Startup
          </span>
          <span
            className={`font-extrabold text-purple-300 tracking-wider uppercase leading-none mt-1 ${subtitleSizes[size]}`}
          >
            Incubation Platform
          </span>
        </div>
      </div>
    );
  }

  // Default transparent navbar logo
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none bg-transparent ${
        onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''
      } ${className}`}
    >
      <div
        className={`shrink-0 bg-[#6355F4] text-white flex items-center justify-center shadow-md shadow-purple-500/25 ${iconContainerSizes[size]}`}
      >
        <Rocket className={iconSizes[size]} />
      </div>
      <div className="flex flex-col text-left">
        <span className={`font-black text-gray-900 tracking-tight leading-none ${titleSizes[size]}`}>
          Startup
        </span>
        <span
          className={`font-extrabold text-[#6355F4] tracking-wider uppercase leading-none mt-1 ${subtitleSizes[size]}`}
        >
          Incubation Platform
        </span>
      </div>
    </div>
  );
};
export default BrandLogo;
