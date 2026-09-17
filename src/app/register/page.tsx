"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useDemoStore } from '../../store/demoStore';
import {
  Shield, ShieldAlert, CheckCircle2, UserCheck, ArrowRight,
  Building2, Lock, Mail, Phone, FileText, Sparkles, Globe, ChevronRight
} from 'lucide-react';

export default function RegisterPage() {
  const submitRegistrationRequest = useDemoStore((state) => state.submitRegistrationRequest);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [requestedType, setRequestedType] = useState<'EMPLOYEE' | 'INTERN' | 'FREELANCER'>('EMPLOYEE');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName || !email || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    const res = submitRegistrationRequest({
      fullName,
      email,
      phone,
      applicationId,
      requestedType,
      notes
    });

    if (res.success) {
      setSubmittedRequest(res.request);
      setIsSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-600 selection:text-white font-sans relative overflow-x-hidden">
      
      {/* Background Soft Gradients matching Marketing Theme */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-blue-100/60 via-indigo-50/40 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Header Navbar */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Logo Brand */}
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Kapate Consultancy" className="h-9 object-contain" />
            <div className="hidden sm:block">
              <div className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                Kapate <span className="text-blue-600">OS</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Identity Gateway
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Enterprise Personnel Onboarding & Authentication</div>
            </div>
          </Link>

          {/* Navigation links */}
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
              Back to OS Sign In <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </header>

      {/* Main Registration Content Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6 z-10">
        <div className="w-full max-w-2xl bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/60 relative">
          
          {!isSubmitted ? (
            <div>
              {/* Header Title */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 border border-blue-200 text-blue-700">
                    <Shield className="w-3.5 h-3.5 text-blue-600" /> Personnel Registration
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Request Kapate OS Personnel Account
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Submit your onboarding registration. Authorized Kapate Consultancy administration will review your credentials, assign your role, and issue your immutable Kapate ID and internal corporate email identity.
                </p>
              </div>

              {/* ZERO PRIVILEGE SECURITY BANNER */}
              <div className="mb-6 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 flex items-start gap-3.5 shadow-xs">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-amber-900">Zero Privilege Self-Assignment Policy</div>
                  <p className="text-amber-800/90 leading-relaxed">
                    Your account role, permission level, Kapate ID, manager, and department authority are strictly assigned server-side by Kapate Consultancy administration. Privilege escalation or self-assignment is disabled.
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Full Legal Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Personal / Contact Email *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. rahul@example.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Application / Reference ID
                    </label>
                    <input
                      type="text"
                      value={applicationId}
                      onChange={(e) => setApplicationId(e.target.value)}
                      placeholder="e.g. APP-2026-088"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Engagement Category
                  </label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      { id: 'EMPLOYEE', label: 'Employee', desc: 'Full-time / Contract' },
                      { id: 'INTERN', label: 'Intern', desc: 'Mentorship & R&D' },
                      { id: 'FREELANCER', label: 'Freelancer', desc: 'Specialist Consultant' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setRequestedType(t.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          requestedType === t.id
                            ? 'bg-blue-50 border-2 border-blue-600 text-blue-950 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900">{t.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Confirm Password *
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
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Skills / Professional Summary
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Brief summary of relevant engineering, design, or business experience..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" /> Submit Registration Request
                </button>
              </form>
            </div>
          ) : (
            /* Submission Acknowledgment Screen */
            <div className="text-center py-6 animate-fade-in space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Request #{submittedRequest?.id || 'REQ-001'} Queued
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-2">Registration Request Received</h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
                  Thank you, <strong className="text-slate-900">{submittedRequest?.fullName}</strong>. Your account request is registered under status <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">PENDING</span>.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left max-w-md mx-auto space-y-3 shadow-xs">
                <div className="text-xs font-bold text-slate-900 flex items-center justify-between pb-2 border-b border-slate-200">
                  <span>Applicant Summary</span>
                  <span className="text-blue-700 font-mono text-[11px] font-bold">{submittedRequest?.applicationId}</span>
                </div>
                <div className="text-xs text-slate-700 space-y-2 font-medium">
                  <div><span className="text-slate-400">Contact Email:</span> {submittedRequest?.email}</div>
                  <div><span className="text-slate-400">Requested Type:</span> {submittedRequest?.requestedType}</div>
                  <div><span className="text-slate-400">Status:</span> <span className="text-amber-700 font-bold">PENDING ADMIN APPROVAL</span></div>
                </div>
              </div>

              <div className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                An authorized Administrator or HR Officer will review your submission, assign your system role, allocate your Department and Manager, and issue your secure onboarding invitation.
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/"
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-xs"
                >
                  Return to Sign In <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer border border-slate-200"
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer Security Watermark */}
      <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-500">
        Kapate OS Security Kernel — Server-Side RBAC & Identity Verification Enforced
      </footer>
    </div>
  );
}
