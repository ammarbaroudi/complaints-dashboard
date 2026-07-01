import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../store/authStore';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const schema = z.object({
  email: z.string().min(1, 'البريد الإلكتروني مطلوب').email('بريد غير صالح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, isLoading, error, token } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (token) navigate('/requests', { replace: true });
  }, [token, navigate]);

  async function onSubmit({ email, password }) {
    const ok = await login(email, password);
    if (ok) navigate('/requests', { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#0b5248]/10 flex items-center justify-center">
            <Shield size={28} color="#0b5248" />
          </div>
          <h1 className="text-2xl font-bold text-[#0b5248]">تسجيل الدخول</h1>
          <p className="text-sm text-[#60706d] text-center">لوحة تحكم الشكاوي — محافظة حمص</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="البريد الإلكتروني"
            type="email"
            placeholder="your@email.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#0b5248]">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full rounded-lg border border-[rgba(11,63,56,0.1)] bg-[rgba(255,255,255,0.82)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0b5248]/20 placeholder:text-[#60706d] pe-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 -translate-y-1/2 end-3 text-[#60706d] hover:text-[#0b5248]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <span className="text-xs text-red-500">{errors.password.message}</span>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2 text-center">
              {error}
            </div>
          )}

          <Button type="submit" loading={isLoading} className="w-full mt-2">
            {isLoading ? 'جارٍ التحقق...' : 'دخول'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
