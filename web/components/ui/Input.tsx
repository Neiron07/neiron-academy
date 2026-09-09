import { forwardRef, InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, id, className = '', ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <label className="block" htmlFor={inputId}>
        {label && <span className="mb-1.5 block text-sm text-lavender">{label}</span>}
        <input
          ref={ref}
          id={inputId}
          className={`h-12 w-full rounded-xl border bg-transparent px-4 text-base text-white placeholder:text-muted outline-none transition-colors ${
            error ? 'border-white' : 'border-purple-mid focus:border-purple'
          } ${className}`}
          aria-invalid={!!error}
          {...rest}
        />
        {error && <span className="mt-1.5 block text-sm text-white">{error}</span>}
        {!error && hint && <span className="mt-1.5 block text-sm text-muted">{hint}</span>}
      </label>
    );
  },
);
Input.displayName = 'Input';
