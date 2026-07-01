import { Menu } from 'lucide-react';
import Badge from '../ui/Badge';

export default function Header({ title, onMenuClick }) {
  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-surface backdrop-blur-sm border-b border-border-soft shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-base sm:text-lg font-bold text-primary">{title}</h1>
      </div>
      <Badge variant="info">مسؤول الشكاوي</Badge>
    </header>
  );
}
