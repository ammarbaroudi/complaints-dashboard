import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, FolderOpen, AlertTriangle } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { categoriesApi } from '../services/api';
import { useToast } from '../hooks/useToast.jsx';

const schema = z.object({
  name:        z.string().min(2, 'الاسم الإنجليزي مطلوب'),
  arabicName:  z.string().min(2, 'الاسم العربي مطلوب'),
  description: z.string().optional(),
});

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast, toasts, ToastContainer } = useToast();

  const isEdit = Boolean(selected && !deleteOpen);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    categoriesApi.getAll()
      .then(setCategories)
      .catch(() => toast('فشل تحميل الفئات', 'error'))
      .finally(() => setLoading(false));
  }, []);

  function openAdd() {
    setSelected(null);
    reset({ name: '', arabicName: '', description: '' });
    setFormOpen(true);
  }

  function openEdit(cat) {
    setSelected(cat);
    reset({ name: cat.name, arabicName: cat.arabicName, description: cat.description || '' });
    setFormOpen(true);
  }

  function openDelete(cat) {
    setSelected(cat);
    setDeleteOpen(true);
  }

  async function onSubmit(body) {
    setSubmitting(true);
    try {
      if (isEdit) {
        const updated = await categoriesApi.update(selected.id, body);
        setCategories((p) => p.map((c) => (c.id === selected.id ? { ...c, ...updated } : c)));
        toast('تم تحديث الفئة بنجاح', 'success');
      } else {
        const created = await categoriesApi.create(body);
        setCategories((p) => [...p, created]);
        toast('تمت إضافة الفئة بنجاح', 'success');
      }
      setFormOpen(false);
    } catch {
      toast('حدث خطأ، حاول مرة أخرى', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await categoriesApi.delete(selected.id);
      setCategories((p) => p.filter((c) => c.id !== selected.id));
      toast('تم حذف الفئة', 'success');
      setDeleteOpen(false);
    } catch {
      toast('فشل الحذف، حاول مرة أخرى', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppLayout title="إدارة الفئات">
      <ToastContainer toasts={toasts} />

      {/* رأس الصفحة */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#0b5248]">الفئات</h2>
        <Button onClick={openAdd}>
          <Plus size={16} />
          إضافة فئة
        </Button>
      </div>

      {/* الجدول */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#0b5248' }} className="text-white">
              <th className="px-4 py-3 text-start font-medium">#</th>
              <th className="px-4 py-3 text-start font-medium">الاسم بالعربية</th>
              <th className="px-4 py-3 text-start font-medium">الاسم بالإنجليزية</th>
              <th className="px-4 py-3 text-start font-medium">الوصف</th>
              <th className="px-4 py-3 text-start font-medium">الحالة</th>
              <th className="px-4 py-3 text-start font-medium">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-[#60706d]">
                  <FolderOpen size={40} className="mx-auto mb-2 opacity-30" />
                  لا توجد فئات بعد
                </td>
              </tr>
            ) : (
              categories.map((cat, idx) => (
                <tr key={cat.id} className="border-t border-[rgba(11,63,56,0.06)] hover:bg-[#0b5248]/3 transition-colors">
                  <td className="px-4 py-3 text-[#60706d]">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium">{cat.arabicName}</td>
                  <td className="px-4 py-3 text-[#60706d]">{cat.name}</td>
                  <td className="px-4 py-3 text-[#60706d] max-w-[200px] truncate">{cat.description || '—'}</td>
                  <td className="px-4 py-3">
                    {cat.isActive !== false
                      ? <Badge variant="success">نشطة</Badge>
                      : <Badge variant="danger">معطلة</Badge>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-1.5 rounded-lg text-[#0b5248] hover:bg-[#0b5248]/10 transition-colors"
                        title="تعديل"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => openDelete(cat)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </Card>

      {/* مودل الإضافة/التعديل */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={isEdit ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="الاسم بالعربية" error={errors.arabicName?.message} {...register('arabicName')} />
          <Input label="الاسم بالإنجليزية" error={errors.name?.message} {...register('name')} />
          <Input label="الوصف" error={errors.description?.message} {...register('description')} />
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>إلغاء</Button>
            <Button type="submit" loading={submitting}>حفظ</Button>
          </div>
        </form>
      </Modal>

      {/* مودل تأكيد الحذف */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="تأكيد الحذف"
        size="sm"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <p className="text-sm text-gray-700">
            هل أنت متأكد من حذف فئة «<span className="font-semibold">{selected?.arabicName}</span>»؟ لا يمكن التراجع.
          </p>
          <div className="flex gap-2 w-full mt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setDeleteOpen(false)}>إلغاء</Button>
            <Button variant="danger" className="flex-1" loading={deleting} onClick={handleDelete}>حذف</Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
