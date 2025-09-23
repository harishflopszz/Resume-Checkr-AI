import React from 'react';
import { cn } from '@/lib/utils';

interface ModernCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'floating' | 'interactive' | 'glow';
  glowColor?: 'blue' | 'pink' | 'green' | 'purple';
  animated?: boolean;
}

const ModernCard = React.forwardRef<HTMLDivElement, ModernCardProps>(
  ({ className, children, variant = 'floating', glowColor = 'blue', animated = true, ...props }, ref) => {
    // Base classes that should always be present
    const baseClasses = 'rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/60 shadow-sm';
    
    // Variant-specific classes
    // Variant-specific classes
    const glowColorClasses: Record<NonNullable<ModernCardProps['glowColor']>, string> = {
      blue:   "hover:shadow-[0_0_30px_rgba(59,130,246,0.20)] border-blue-300/50",
      pink:   "hover:shadow-[0_0_30px_rgba(236,72,153,0.20)] border-pink-300/50",
      green:  "hover:shadow-[0_0_30px_rgba(34,197,94,0.20)] border-green-300/50",
      purple: "hover:shadow-[0_0_30px_rgba(168,85,247,0.20)] border-purple-300/50",
    };
    const variantClasses = {
      floating: 'hover:shadow-lg transition-shadow duration-300',
      interactive: 'cursor-pointer hover:shadow-md hover:-translate-y-1 transition-transform duration-200',
      glow: cn('hover:shadow-lg', glowColorClasses[glowColor]),
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          animated && 'transition-transform duration-200 hover:transform-gpu',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ModernCard.displayName = 'ModernCard';

export default ModernCard;
