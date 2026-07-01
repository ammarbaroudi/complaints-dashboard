import { NavLink, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, FolderOpen, LogOut, X } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const navItems = [
  { to: '/requests',   icon: LayoutDashboard, label: 'الشكاوي' },
  { to: '/categories', icon: FolderOpen,       label: 'إدارة الفئات' },
];

export default function Sidebar({ isOpen, onClose }) {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const sidebarContent = (
    <aside
      className="w-64 flex-shrink-0 flex flex-col h-full"
      style={{ background: 'linear-gradient(180deg, #041f1c 0%, #0b4039 60%, #083a33 100%)' }}
    >
      {/* شعار */}
      <div className="px-5 py-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Shield size={32} color="#d6b86f" />
          <div>
            <div className="text-white font-bold text-lg leading-tight">لوحة الشكاوي</div>
            <div className="text-white/50 text-xs">نظام الشكاوي — حمص</div>
          </div>
        </div>
        {/* زر إغلاق على الموبايل */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <hr className="border-white/10 mx-4" />

      {/* التنقل */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors duration-150 ${
                isActive
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* تسجيل الخروج */}
      <div className="px-3 py-4">
        <hr className="border-white/10 mb-4" />
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white hover:bg-white/5 transition-colors duration-150 text-sm"
        >
          <LogOut size={18} color="#d6b86f" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* سايدبار ديسكتوب */}
      <div className="hidden lg:flex h-full">
        {sidebarContent}
      </div>

      {/* drawer موبايل - overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* drawer موبايل - القائمة */}
      <div
        className={`fixed top-0 right-0 h-full z-50 lg:hidden transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
}
