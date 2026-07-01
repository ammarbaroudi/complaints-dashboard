import { cn } from '../../utils/cn';

const variants = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  danger:  'bg-red-50 text-red-700 ring-1 ring-red-200',
  info:    'bg-[#0b5248]/8 text-[#0b5248] ring-1 ring-[#0b5248]/20',
  gold:    'bg-[#d6b86f]/15 text-[#083a33] ring-1 ring-[#d6b86f]/40',
};

export default function Badge({ variant = 'info', children, className }) {
  return (
    <span
      className={cn(
        'px-2.5 py-0.5 text-xs font-medium rounded-full',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
