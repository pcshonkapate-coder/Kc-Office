'use client';

import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import {
  CheckCircle2,
  Lock,
  Layers,
  Users,
  Briefcase,
  DollarSign,
  FileText,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, can, is } = usePermissions();

  const modules = [
    {
      title: 'CRM & Pipeline',
      description: 'Manage accounts, deals, proposals, and client conversions.',
      icon: Briefcase,
      perm: 'crm.account.read',
      actionPerm: 'crm.deal.create',
      actionLabel: 'New Deal',
    },
    {
      title: 'Projects & Delivery',
      description: 'Agile sprints, Kanban task tracking, and milestone releases.',
      icon: Layers,
      perm: 'project.read',
      actionPerm: 'project.create',
      actionLabel: 'New Project',
    },
    {
      title: 'Workforce & Interns',
      description: 'Resource capacity, timesheets, and intern competency evaluations.',
      icon: Users,
      perm: 'hr.employee.read',
      actionPerm: 'hr.intern.evaluate',
      actionLabel: 'Evaluate Intern',
    },
    {
      title: 'Finance & Invoicing',
      description: 'Milestone billing, margin audit, accounts receivable, and payroll.',
      icon: DollarSign,
      perm: 'finance.invoice.read',
      actionPerm: 'finance.invoice.create',
      actionLabel: 'Create Invoice',
    },
    {
      title: 'Document Vault',
      description: 'Cryptographically verified client contracts and delivery sign-offs.',
      icon: FileText,
      perm: 'document.read',
      actionPerm: 'document.upload',
      actionLabel: 'Upload Contract',
    },
    {
      title: 'RBAC & Access Control',
      description: 'Granular permissions, system roles, and multi-tenant security.',
      icon: KeyRound,
      perm: 'role.read',
      actionPerm: 'role.create',
      actionLabel: 'New Role',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white border border-slate-800 rounded-2xl p-7 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 font-mono">
              Executive Command Center • Version 3.0 Live
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
              Welcome back, {user?.fullName || 'Administrator'}
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Authenticated Workspace: <span className="font-mono text-blue-200">{user?.email}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {user?.roles?.map((role) => (
              <span
                key={role}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/20 uppercase tracking-wide font-mono"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Module Overview Grid with Granular RBAC checks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Active Core Subsystems</h3>
          <span className="text-xs text-slate-500">
            Permissions evaluated dynamically via <code className="text-blue-600 font-mono">usePermissions()</code>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((mod) => {
            const hasAccess = can(mod.perm);
            const canPerformAction = can(mod.actionPerm);
            const Icon = mod.icon;

            return (
              <div
                key={mod.title}
                className={`p-5 rounded-2xl border transition-all ${
                  hasAccess
                    ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      hasAccess ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {hasAccess ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Granted
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      <Lock className="w-3 h-3 text-slate-400" />
                      Restricted
                    </span>
                  )}
                </div>

                <h4 className="text-base font-bold text-slate-900">{mod.title}</h4>
                <p className="text-xs text-slate-600 mt-1 min-h-[32px] leading-relaxed">{mod.description}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-slate-400">{mod.perm}</span>
                  {hasAccess && canPerformAction && (
                    <button className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-[11px] transition-colors cursor-pointer shadow-2xs">
                      {mod.actionLabel}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resolved Permissions Inspector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
          <KeyRound className="w-4 h-4 text-blue-600" />
          Resolved RBAC Capability Tokens ({user?.permissions?.length || 0})
        </h4>
        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-2">
          {user?.permissions?.map((p) => (
            <span
              key={p}
              className="text-[11px] font-mono bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-100 transition-colors"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
