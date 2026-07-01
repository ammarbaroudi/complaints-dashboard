import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const Input = forwardRef(function Input({ label, error, className, ...rest }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-[#0b5248]">{label}</label>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-[rgba(11,63,56,0.1)] bg-[rgba(255,255,255,0.82)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0b5248]/20 placeholder:text-[#60706d]',
          error && 'border-red-400 focus:ring-red-200',
          className
        )}
        {...rest}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
});

export default Input;
