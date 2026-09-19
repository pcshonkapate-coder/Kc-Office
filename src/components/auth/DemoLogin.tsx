"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../store/demoStore';
import { Shield, Lock, ArrowRight, Eye, EyeOff, Globe, Mail, CheckCircle2, Sparkles, UserCheck } from 'lucide-react';

interface DemoLoginProps {
  onLoginSuccess?: () => void;
}

export const DemoLogin: React.FC<DemoLoginProps> = ({ onLoginSuccess }) => {
  const switchRole = useDemoStore((state) => state.switchRole);
  const login = useDemoStore((state) => state.login);
  const showToast = useDemoStore((state) => state.showToast);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const websiteUrl = process.env.NEXT_PUBLIC_MAIN_SITE_URL || process.env.NEXT_PUBLIC_WEBSITE_URL || '/';

  const applyRoleFromEmailOrRoles = (emailAddr: string, roles?: string[]) => {
    if (roles && roles.length > 0) {
      if (roles.includes('superadmin') || roles.includes('partner')) {
        switchRole('ADMIN');
      } else if (roles.includes('intern')) {
        switchRole('INTERN');
      } else if (roles.includes('client')) {
        switchRole('CLIENT');
      } else if (roles.includes('manager') || roles.includes('pm')) {
        switchRole('PROJECT_MANAGER');
      } else {
        switchRole('EMPLOYEE');
      }
    } else {
      if (emailAddr.includes('client')) switchRole('CLIENT');
      else if (emailAddr.includes('intern')) switchRole('INTERN');
      else if (emailAddr.includes('pm') || emailAddr.includes('manager')) switchRole('PROJECT_MANAGER');
      else if (emailAddr.includes('emp') || emailAddr.includes('engineer') || emailAddr.includes('rajesh')) switchRole('EMPLOYEE');
      else switchRole('ADMIN');
    }
  };

  // Standard Authentication
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error?.message || data?.error || data?.detail || 'Invalid email or password.';
        throw new Error(msg);
      }

      const data = await res.json();
      if (!data.success || !data.access_token) {
        throw new Error(data.error || 'Authentication rejected by server.');
      }

      localStorage.setItem('kapate_token', data.access_token);
      localStorage.setItem('kapate_access_token', data.access_token);
      if (data.user) {
        localStorage.setItem('kapate_user', JSON.stringify(data.user));
        login(data.user);
      } else {
        login();
      }

      showToast(`Welcome back, ${data.user?.name || email}`, 'success');
      onLoginSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Soft Accent Glows */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-blue-200/50 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-200/50 blur-[140px] rounded-full pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-10">
        
        {/* Left Branding Panel */}
        <div className="lg:col-span-5 p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-6">
              <img src="/logo.png" alt="Kapate Consultancy" className="h-10 object-contain" />
            </div>

            <h1 className="text-2xl font-black text-slate-900 leading-tight mb-3">
              Kapate <span className="text-blue-600">OS</span>
            </h1>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Enterprise Business Operating System for Kapate Consultancy. Unified CRM, delivery pipelines, manager audits, client portals, and financial governance.
            </p>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2 mb-6">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" /> Enterprise Role Governance
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Granular multi-tenant authorization partitions executive financial dashboards from external client portals and delivery tracking.
              </p>
            </div>

            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-xs font-semibold text-slate-800 border border-slate-300 transition-colors shadow-xs"
            >
              <Globe className="w-4 h-4 text-blue-600" /> Visit Public Website
            </a>
          </div>

          <div className="pt-6 text-[11px] text-slate-400 font-mono">
            Kapate OS v2026.9 • Vercel Ready Build
          </div>
        </div>

        {/* Right Authentication Panel */}
        <div className="lg:col-span-7 p-8 lg:p-10 flex flex-col justify-center bg-white">
          
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Lock className="w-5 h-5 text-slate-800" /> Account Sign-In
            </h2>
            <p className="text-xs text-slate-500">
              Enter your enterprise credentials to access Kapate OS.
            </p>
          </div>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-colors"
                  placeholder="name@kapateconsultancy.in"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-colors"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? 'Signing In...' : 'Sign In to Kapate OS'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 mt-2 text-center border-t border-slate-100">
            <span className="text-xs text-slate-500">New joiner or candidate? </span>
            <a
              href="/register"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
            >
              Register as Personnel &rarr;
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};
