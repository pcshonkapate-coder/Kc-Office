'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '../../../lib/api-client';
import { useAuthStore } from '../../../stores/authStore';
import { KeyRound, ShieldCheck, Sparkles } from 'lucide-react';

const loginSchema = z.object({
  organizationSlug: z.string().min(2, 'Organization slug required').trim(),
  email: z.string().email('Please enter a valid work email address').trim(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const redirectPath =
    rawRedirect && !rawRedirect.includes('register') && !rawRedirect.includes('dashboard')
      ? rawRedirect
      : '/';
  const setSession = useAuthStore((state) => state.setSession);

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      organizationSlug: 'kapate-consultancy',
      email: 'admin@kapateconsultancy.com',
      password: 'Admin@Kapate2026!',
    },
  });

  const fillSuperAdmin = () => {
    setValue('organizationSlug', 'kapate-consultancy');
    setValue('email', 'admin@kapateconsultancy.com');
    setValue('password', 'Admin@Kapate2026!');
  };

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const response = await apiClient.post('/auth/login', {
        organization_slug: data.organizationSlug,
        email: data.email,
        password: data.password,
      });

      setSession(response.data);
      router.push(redirectPath);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setServerError(
        typeof detail === 'object' && detail?.message
          ? detail.message
          : 'Authentication failed. Please verify your credentials and tenant slug.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative flex items-center justify-center p-4">
      {/* Subtle brand background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-8 shadow-xl shadow-slate-200/50 relative z-10">
        <div className="mb-6 text-center">
          <div className="flex justify-center mb-3">
            <img
              src="/assets/images/KapateConsultancy-Logo-Cropped.png"
              alt="Kapate Consultancy"
              className="h-12 w-auto object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">KAPATE OS 3.0</h1>
          <p className="text-xs text-slate-500 mt-0.5">Enterprise Business Operating System</p>
        </div>

        {/* Quick Demo Autofill Card */}
        <div
          onClick={fillSuperAdmin}
          className="mb-6 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 hover:border-blue-400 transition-all cursor-pointer shadow-xs text-left"
          title="Click to populate Super Admin credentials"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Super Admin Credentials</span>
            </span>
            <span className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded-md font-mono font-medium">
              Click to Auto-Fill
            </span>
          </div>
          <div className="mt-1 text-[11px] font-mono text-blue-800/90">
            admin@kapateconsultancy.com • Admin@Kapate2026!
          </div>
        </div>

        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Organization Slug
            </label>
            <input
              {...register('organizationSlug')}
              type="text"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder="e.g. kapate-consultancy"
            />
            {errors.organizationSlug && (
              <span className="text-xs text-rose-600 mt-1 block">
                {errors.organizationSlug.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Work Email
            </label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder="admin@kapateconsultancy.com"
            />
            {errors.email && (
              <span className="text-xs text-rose-600 mt-1 block">
                {errors.email.message}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder="••••••••••••"
            />
            {errors.password && (
              <span className="text-xs text-rose-600 mt-1 block">
                {errors.password.message}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold tracking-wide transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In to Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
}
