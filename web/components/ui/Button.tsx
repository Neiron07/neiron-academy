import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'invert' | 'danger-quiet';
type Size = 'md' | 'lg' | 'sm';

const variantClass: Record<Variant, string> = {
  primary: 'bg-purple text-white hover:bg-purple/90 active:bg-purple/80',
  secondary: 'bg-transparent text-white border border-purple-mid hover:bg-purple-mid/20',
  ghost: 'bg-transparent text-lavender hover:text-white hover:bg-white/5',
  invert: 'bg-white text-bg hover:bg-white/90',
  'danger-quiet': 'bg-transparent text-muted border border-muted hover:text-white hover:border-lavender',
};

const sizeClass: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-12 px-5 text-base rounded-xl gap-2',
  lg: 'h-14 px-6 text-lg rounded-2xl gap-2',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className = '', disabled, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none select-none ${variantClass[variant]} ${sizeClass[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...rest}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
