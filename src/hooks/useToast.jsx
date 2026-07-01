import { useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const icons = { success: CheckCircle2, error: XCircle, info: Info };
const colors = {
  success: 'bg-emerald-600 text-white',
  error:   'bg-red-600 text-white',
  info:    'bg-[#0b5248] text-white',
};

function ToastList({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 left-4 z-[100] flex flex-col gap-2" dir="rtl">
      {toasts.map((t) => {
        const Icon = icons[t.variant] || Info;
        return (
          <div
            key={t.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium min-w-[220px] ${colors[t.variant] || colors.info}`}
          >
            <Icon size={16} className="flex-shrink-0" />
            <span className="flex-1">{t.message}</span>
            <button onClick={() => onRemove(t.id)} className="opacity-70 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  function toast(message, variant = 'info') {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, variant }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }

  function removeToast(id) {
    setToasts((p) => p.filter((t) => t.id !== id));
  }

  function ToastContainer({ toasts: t }) {
    return <ToastList toasts={t} onRemove={removeToast} />;
  }

  return { toasts, toast, ToastContainer };
}
