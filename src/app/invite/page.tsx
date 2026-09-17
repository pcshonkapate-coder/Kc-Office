"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useDemoStore } from '../../store/demoStore';
import {
  ShieldCheck, Lock, CheckCircle2, AlertCircle, ArrowRight,
  Building, Mail, Sparkles, User, BadgeCheck, Globe
} from 'lucide-react';

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('token') || '';

  const onboardingInvitations = useDemoStore((state) => state.onboardingInvitations);
  const acceptInvitation = useDemoStore((state) => state.acceptInvitation);

  const [token, setToken] = useState(tokenParam);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [activatedUser, setActivatedUser] = useState<any>(null);

  // Sync token from URL query params
  useEffect(() => {
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [tokenParam]);

  // Lookup invitation details
  const matchedInvitation = onboardingInvitations.find(i => i.token === token);

  const handleAccept = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token) {
      setErrorMessage('A valid invitation token is required.');
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    const res = acceptInvitation(token, password);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to activate invitation.');
    } else {
      setActivatedUser(res.user);
      setIsSuccess(true);
    }
  };

  return (
    <div className="w-full max-w-xl bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/60 relative">
      {!isSuccess ? (
        <div>
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 border border-blue-200 text-blue-700">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Secure Onboarding Token
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Activate Your Kapate OS Identity
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              You have received an authorized invitation from Kapate Consultancy. Complete your account setup by establishing your access credentials.
            </p>
          </div>

          {/* Invitation Pre-Assigned Details Card */}
          {matchedInvitation ? (
            <div className="mb-6 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-blue-500/20">
                    {matchedInvitation.fullName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{matchedInvitation.fullName}</h3>
                    <div className="text-[11px] text-blue-600 font-semibold">{matchedInvitation.designation}</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-white text-slate-800 border border-slate-200 shadow-2xs">
                  {matchedInvitation.kapateId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">System Role</span>
                  <span className="text-emerald-700 font-bold">{matchedInvitation.assignedRole}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Department</span>
                  <span className="text-slate-800 font-semibold">{matchedInvitation.department}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Internal Corporate Email</span>
                  <span className="text-blue-600 font-mono font-bold text-xs">{matchedInvitation.internalEmail}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs shadow-xs">
              <strong>Invitation Token Verification:</strong> Please ensure your secure invitation link contains the assigned token, or paste your token below.
            </div>
          )}

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAccept} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Invitation Token *
              </label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="inv_tok_..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono text-xs placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Create Account Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm Account Password *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <BadgeCheck className="w-4 h-4" /> Activate Account & Provision Identity
            </button>
          </form>
        </div>
      ) : (
        /* Success Screen */
        <div className="text-center py-6 animate-fade-in space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
              {activatedUser?.kapateId || 'KAP-EMP-000005'}
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">Account Activated Successfully!</h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
              Your Kapate OS account credentials have been established. Your corporate identity and internal mailbox are now active.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left max-w-md mx-auto space-y-2.5 shadow-xs">
            <div className="text-xs font-bold text-slate-900 flex items-center justify-between pb-2 border-b border-slate-200">
              <span>Identity Profile</span>
              <span className="text-emerald-700 font-bold">{activatedUser?.role}</span>
            </div>
            <div className="text-xs text-slate-700 space-y-1.5 font-medium">
              <div><span className="text-slate-400">Name:</span> {activatedUser?.name}</div>
              <div><span className="text-slate-400">Corporate Email:</span> <span className="text-blue-600 font-mono font-bold">{activatedUser?.internalEmail || activatedUser?.email}</span></div>
              <div><span className="text-slate-400">Designation:</span> {activatedUser?.designation}</div>
              <div><span className="text-slate-400">Status:</span> <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">ACTIVE</span></div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
            >
              Open Kapate OS Sign In <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InvitePage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-600 selection:text-white font-sans relative overflow-x-hidden">
      
      {/* Background Soft Gradients matching Marketing Theme */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-blue-100/60 via-indigo-50/40 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Header Navbar */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Kapate Consultancy" className="h-9 object-contain" />
            <div className="hidden sm:block">
              <div className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                Kapate <span className="text-blue-600">OS</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Invitation Gateway
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Single-Use Cryptographic Onboarding Verification</div>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors hidden md:flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" /> Marketing Website
            </a>
            
            <Link
              href="/"
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs flex items-center gap-1.5"
            >
              Back to Login <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6 z-10">
        <Suspense fallback={<div className="text-slate-500 text-xs">Loading invitation gateway...</div>}>
          <InviteContent />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-500">
        Kapate OS Security Kernel — Single-Use Cryptographic Onboarding Tokens
      </footer>
    </div>
  );
}
