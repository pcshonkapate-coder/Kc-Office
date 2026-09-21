"use client";

import React from 'react';
import { useDemoStore } from '../../../store/demoStore';
import { RefreshCw } from 'lucide-react';

export const SettingsModule: React.FC = () => {
  const resetDemoData = useDemoStore((state) => state.resetDemoData);
  const showToast = useDemoStore((state) => state.showToast);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Platform preferences updated successfully', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Admin & System Settings</h1>
          <p className="text-xs text-slate-500 mt-1">Configure company profile, RBAC permissions, pipeline stages, and system defaults</p>
        </div>

        <button
          onClick={resetDemoData}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200"
          title="Reloads all business data from the authoritative persistent store"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-600" /> Sync Authoritative Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Company Organization Profile</h3>
          
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Company Name</label>
                <input type="text" defaultValue="Kapate Consultancy" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900" />
              </div>
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Primary Business Domain</label>
                <input type="text" defaultValue="AI Solutions & IT Consulting" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">HQ Address</label>
                <input type="text" defaultValue="Pune / Mumbai, Maharashtra, India" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900" />
              </div>
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">GSTIN Registration</label>
                <input type="text" defaultValue="27KAPAT1234F1Z9" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono" />
              </div>
            </div>

            <button type="submit" className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm">
              Save Preferences
            </button>
          </form>
        </div>

        <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-base">RBAC Role Matrix</h3>
          <div className="space-y-2">
            {[
              { role: 'SUPER ADMIN', desc: 'Full System Control & Financial Audit' },
              { role: 'EMPLOYEE', desc: 'CRM, Projects, Tasks, Personal Timesheets' },
              { role: 'INTERN', desc: 'Assigned Tasks, Training, Timesheets, Reviews' },
              { role: 'CLIENT', desc: 'Isolated Portal: Progress, Milestones, Invoices' },
              { role: 'FINANCE', desc: 'Invoices, Expenses, Payments, Profitability' }
            ].map((r, i) => (
              <div key={i} className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-blue-600 font-mono text-[11px]">{r.role}</div>
                <div className="text-[11px] text-slate-600 mt-0.5">{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
