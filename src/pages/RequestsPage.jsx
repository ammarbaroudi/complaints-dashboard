import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, MessageSquare, Trash2, AlertTriangle } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { requestsApi } from '../services/api';
import { useToast } from '../hooks/useToast.jsx';
import { cn } from '../utils/cn';
import { usePermission } from '../hooks/usePermission';

const STATUS_MAP = {
  pending:   { label: 'قيد الانتظار', variant: 'warning' },
  in_review: { label: 'قيد المراجعة', variant: 'info' },
  resolved:  { label: 'تم الحل',       variant: 'success' },
  rejected:  { label: 'مرفوض',         variant: 'danger' },
};

const respondSchema = z.object({
  response: z.string().min(10, 'الرد يجب أن يكون 10 أحرف على الأقل'),
  status: z.enum(['pending', 'in_review', 'resolved', 'rejected'], {
    required_error: 'اختر الحالة الجديدة',
  }),
});

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

const inputClass =
  'w-full rounded-lg border border-[rgba(11,63,56,0.1)] bg-[rgba(255,255,255,0.82)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0b5248]/20 placeholder:text-[#60706d]';

export default function RequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [respondModalOpen, setRespondModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast, toasts, ToastContainer } = useToast();

  const canRespond = usePermission('complaints.requests.respond');
  const canDelete  = usePermission('complaints.requests.delete');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(respondSchema),
  });

  useEffect(() => {
    requestsApi.getAll()
      .then(setRequests)
      .catch(() => toast('فشل تحميل الشكاوي', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const fullName = `${r.citizen?.firstName || ''} ${r.citizen?.lastName || ''}`.toLowerCase();
      const national = r.citizen?.nationalNumber || '';
      const desc = r.description || '';
      const matchSearch =
        !search ||
        fullName.includes(search.toLowerCase()) ||
        national.includes(search) ||
        desc.includes(search);
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [requests, search, filterStatus]);

  function openRespond(req) {
    setSelectedRequest(req);
    reset({ response: '', status: req.status });
    setRespondModalOpen(true);
  }

  function openDelete(req) {
    setSelectedRequest(req);
    setDeleteModalOpen(true);
  }

  async function onRespond({ response, status }) {
    setSubmitting(true);
    try {
      const updated = await requestsApi.respond(selectedRequest.id, { response, status });
      setRequests((p) =>
        p.map((r) => (r.id === selectedRequest.id ? { ...r, ...updated, status } : r))
      );
      toast('تم إرسال الرد بنجاح', 'success');
      setRespondModalOpen(false);
    } catch {
      toast('فشل إرسال الرد', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await requestsApi.delete(selectedRequest.id);
      setRequests((p) => p.filter((r) => r.id !== selectedRequest.id));
      toast('تم حذف الشكوى', 'success');
      setDeleteModalOpen(false);
    } catch {
      toast('فشل الحذف', 'error');
    } finally {
      setDeleting(false);
    }
  }

  const statusInfo = selectedRequest ? (STATUS_MAP[selectedRequest.status] || {}) : {};

  return (
    <AppLayout title="إدارة الشكاوي">
      <ToastContainer toasts={toasts} />

      {/* شريط الفلاتر */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute top-1/2 -translate-y-1/2 end-3 text-[#60706d]" />
          <input
            className={cn(inputClass, 'pe-9')}
            placeholder="ابحث عن شكوى..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className={cn(inputClass, 'sm:w-44')}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">جميع الحالات</option>
          <option value="pending">قيد الانتظار</option>
          <option value="in_review">قيد المراجعة</option>
          <option value="resolved">تم الحل</option>
          <option value="rejected">مرفوض</option>
        </select>
      </div>

      {/* الجدول */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr style={{ background: '#0b5248' }} className="text-white">
                <th className="px-3 py-3 text-start font-medium">#</th>
                <th className="px-3 py-3 text-start font-medium">المواطن</th>
                <th className="px-3 py-3 text-start font-medium">رقم الوطني</th>
                <th className="px-3 py-3 text-start font-medium">الفئة</th>
                <th className="px-3 py-3 text-start font-medium">النوع</th>
                <th className="px-3 py-3 text-start font-medium">الوصف</th>
                <th className="px-3 py-3 text-start font-medium">الحالة</th>
                <th className="px-3 py-3 text-start font-medium">التاريخ</th>
                <th className="px-3 py-3 text-start font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-[#60706d]">
                    <MessageSquare size={40} className="mx-auto mb-2 opacity-30" />
                    {requests.length === 0
                      ? 'لا توجد شكاوي بعد'
                      : 'لا توجد شكاوي تطابق البحث'}
                  </td>
                </tr>
              ) : (
                filtered.map((req, idx) => {
                  const st = STATUS_MAP[req.status] || { label: req.status, variant: 'info' };
                  const desc = req.description || '';
                  return (
                    <tr
                      key={req.id}
                      className="border-t border-[rgba(11,63,56,0.06)] hover:bg-[#0b5248]/3 transition-colors"
                    >
                      <td className="px-3 py-3 text-[#60706d]">{idx + 1}</td>
                      <td className="px-3 py-3 font-medium whitespace-nowrap">
                        {req.citizen?.firstName} {req.citizen?.lastName}
                      </td>
                      <td className="px-3 py-3 text-[#60706d]">{req.citizen?.nationalNumber || '—'}</td>
                      <td className="px-3 py-3 text-[#60706d]">
                        {req.category?.arabicName || req.category?.name || '—'}
                      </td>
                      <td className="px-3 py-3">
                        {req.type === 'complaint'
                          ? <Badge variant="danger">شكوى</Badge>
                          : <Badge variant="info">طلب</Badge>
                        }
                      </td>
                      <td className="px-3 py-3 text-[#60706d] max-w-[180px]">
                        <span title={desc}>
                          {desc.length > 60 ? desc.slice(0, 60) + '...' : desc || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>
                      <td className="px-3 py-3 text-[#60706d] whitespace-nowrap">
                        {req.createdAt
                          ? new Date(req.createdAt).toLocaleDateString('ar-SA')
                          : '—'}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          {canRespond && (
                            <button
                              onClick={() => openRespond(req)}
                              className="p-1.5 rounded-lg text-[#0b5248] hover:bg-[#0b5248]/10 transition-colors"
                              title="الرد"
                            >
                              <MessageSquare size={15} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => openDelete(req)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                              title="حذف"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* مودل الرد */}
      <Modal
        isOpen={respondModalOpen}
        onClose={() => setRespondModalOpen(false)}
        title="الرد على الشكوى"
        size="lg"
      >
        {selectedRequest && (
          <div>
            {/* معلومات القراءة فقط */}
            <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-[#0b5248]/5 rounded-xl text-sm">
              <div>
                <span className="text-[#60706d]">المواطن: </span>
                <span className="font-medium">
                  {selectedRequest.citizen?.firstName} {selectedRequest.citizen?.lastName}
                </span>
              </div>
              <div>
                <span className="text-[#60706d]">الرقم الوطني: </span>
                <span className="font-medium">{selectedRequest.citizen?.nationalNumber || '—'}</span>
              </div>
              <div>
                <span className="text-[#60706d]">الفئة: </span>
                <span className="font-medium">
                  {selectedRequest.category?.arabicName || selectedRequest.category?.name || '—'}
                </span>
              </div>
              <div>
                <span className="text-[#60706d]">الحالة الحالية: </span>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              </div>
              <div className="col-span-2">
                <span className="text-[#60706d]">الوصف: </span>
                <span className="font-medium">{selectedRequest.description || '—'}</span>
              </div>
            </div>

            <hr className="border-[rgba(11,63,56,0.1)] mb-4" />

            <form onSubmit={handleSubmit(onRespond)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[#0b5248]">الحالة الجديدة</label>
                <select className={inputClass} {...register('status')}>
                  <option value="pending">قيد الانتظار</option>
                  <option value="in_review">قيد المراجعة</option>
                  <option value="resolved">تم الحل</option>
                  <option value="rejected">مرفوض</option>
                </select>
                {errors.status && (
                  <span className="text-xs text-red-500">{errors.status.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[#0b5248]">نص الرد</label>
                <textarea
                  rows={4}
                  placeholder="اكتب ردك هنا..."
                  className={inputClass}
                  {...register('response')}
                />
                {errors.response && (
                  <span className="text-xs text-red-500">{errors.response.message}</span>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-amber-700 text-xs">
                ⚠️ سيتم إرسال الرد تلقائياً على بريد المواطن الإلكتروني.
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="ghost" type="button" onClick={() => setRespondModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" loading={submitting}>
                  إرسال الرد
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* مودل تأكيد الحذف */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="تأكيد الحذف"
        size="sm"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <p className="text-sm text-gray-700">هل أنت متأكد من حذف هذه الشكوى؟ لا يمكن التراجع.</p>
          <div className="flex gap-2 w-full mt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setDeleteModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="danger" className="flex-1" loading={deleting} onClick={handleDelete}>
              حذف
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
