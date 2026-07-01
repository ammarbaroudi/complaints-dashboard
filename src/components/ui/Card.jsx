import { cn } from '../../utils/cn';

export default function Card({ children, className }) {
  return (
    <div
      className={cn(
        'bg-[rgba(255,255,255,0.82)] backdrop-blur-sm rounded-2xl border border-[rgba(11,63,56,0.1)] shadow-[0_16px_30px_rgba(11,63,56,0.08)] p-6',
        className
      )}
    >
      {children}
    </div>
  );
}
