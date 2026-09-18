"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../store/demoStore';
import { UserRole } from '../../types';
import { X, UserPlus, ShieldCheck, Mail, CheckCircle2, Copy, Sparkles, Building2, User, KeyRound } from 'lucide-react';

export const OnboardPersonnelModal: React.FC = () => {
  const isOpen = useDemoStore((state) => state.isOnboardModalOpen);
  const setOpen = useDemoStore((state) => state.setOnboardModalOpen);
  const onboardPersonnel = useDemoStore((state) => state.onboardPersonnel);
  const employees = useDemoStore((state) => state.employees);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('Backend Developer');
  const [department, setDepartment] = useState('Engineering');
  const [employmentType, setEmploymentType] = useState<'EMPLOYEE' | 'INTERN' | 'FREELANCER'>('EMPLOYEE');
  const [role, setRole] = useState<UserRole>('EMPLOYEE');
  const [manager, setManager] = useState(employees[0]?.name || 'Shon Kapate');
  const [skills, setSkills] = useState('');

  const [createdResult, setCreatedResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
    const res = onboardPersonnel({
      fullName,
      email,
      phone,
      designation,
      department,
      employmentType,
      role,
      manager,
      skills: skillsArray
    });

    if (res.success) {
      setCreatedResult(res.invitation);
    }
  };

  const handleCopyLink = () => {
    if (!createdResult) return;
    const link = `${window.location.origin}/invite?token=${createdResult.token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClose = () => {
    setCreatedResult(null);
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden relative">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Onboard Team Personnel</h2>
              <p className="text-xs text-slate-500">Atomic Kapate ID sequence, corporate mailbox, and secure invitation link</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/80 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!createdResult ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul@example.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Designation (Professional Title) *</label>
                <input
                  type="text"
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employment Type *</label>
                <select
                  value={employmentType}
                  onChange={(e) => {
                    const t = e.target.value as any;
                    setEmploymentType(t);
                    if (t === 'INTERN') setRole('INTERN');
                    else if (t === 'EMPLOYEE') setRole('EMPLOYEE');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="EMPLOYEE">Employee (Full-Time)</option>
                  <option value="INTERN">Intern (Mentorship)</option>
                  <option value="FREELANCER">Freelancer (Contractor)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Authorized System Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="INTERN">INTERN</option>
                  <option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
                  <option value="HR_ADMIN">HR_ADMIN</option>
                  <option value="FINANCE_ADMIN">FINANCE_ADMIN</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="Data">Data</option>
                  <option value="Design">Design</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance">Finance</option>
                  <option value="HR">HR</option>
                  <option value="Operations">Operations</option>
                  <option value="Management">Management</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Manager / Mentor *</label>
                <select
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name} ({emp.role})</option>
                  ))}
                  <option value="Shon Kapate">Shon Kapate (Founder & CEO)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Technical Skills</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Comma-separated skills"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" /> Generate Kapate ID & Issue Invitation
              </button>
            </div>
          </form>
        ) : (
          /* Success Screen with Issued Invitation */
          <div className="p-8 text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Personnel Onboarded Successfully
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-2">{createdResult.fullName}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Assigned to {createdResult.department} under manager {createdResult.manager}</p>
            </div>

            {/* Credential summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left max-w-md mx-auto space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Immutable Kapate ID:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{createdResult.kapateId}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Corporate Internal Email:</span>
                <span className="font-mono font-bold text-blue-600">{createdResult.internalEmail}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Assigned System Role:</span>
                <span className="font-bold text-emerald-700">{createdResult.assignedRole}</span>
              </div>
            </div>

            {/* Invitation Link Box */}
            <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 text-left max-w-md mx-auto space-y-2">
              <div className="text-[11px] font-bold text-blue-950 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5 text-blue-600" /> Single-Use Secure Invitation Link:</span>
                <span className="text-[10px] text-blue-600">Expires in 72h</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== 'undefined' ? `${window.location.origin}/invite?token=${createdResult.token}` : `/invite?token=${createdResult.token}`}
                  className="w-full bg-white border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-700"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
