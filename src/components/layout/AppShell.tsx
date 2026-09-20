"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../store/demoStore';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Toast } from '../ui/Toast';
import { QuickCreateModal } from '../modals/QuickCreateModal';
import { GlobalSearchModal } from '../modals/GlobalSearchModal';

// Modules
import { ExecutiveDashboard } from '../modules/dashboard/ExecutiveDashboard';
import { CRMModule } from '../modules/crm/CRMModule';
import { SalesModule } from '../modules/sales/SalesModule';
import { ProjectsModule } from '../modules/projects/ProjectsModule';
import { TeamModule } from '../modules/team/TeamModule';
import { ResourceModule } from '../modules/resources/ResourceModule';
import { TimesheetsModule } from '../modules/timesheets/TimesheetsModule';
import { AttendanceModule } from '../modules/attendance/AttendanceModule';
import { FinanceModule } from '../modules/finance/FinanceModule';
import { ClientPortalModule } from '../modules/client-portal/ClientPortalModule';
import { AIAssistantModule } from '../modules/ai-assistant/AIAssistantModule';
import { DocumentsModule } from '../modules/documents/DocumentsModule';
import { AnalyticsModule } from '../modules/analytics/AnalyticsModule';
import { SettingsModule } from '../modules/settings/SettingsModule';
import { MailModule } from '../modules/mail/MailModule';
import { SecurityDashboard } from '../modules/security/SecurityDashboard';
import { SuperAdminModule } from '../modules/super-admin/SuperAdminModule';
import { OnboardPersonnelModal } from '../modals/OnboardPersonnelModal';
import { ShieldAlert, LogOut, Shield } from 'lucide-react';

export const AppShell: React.FC = () => {
  const activeTab = useDemoStore((state) => state.activeTab);
  const currentUser = useDemoStore((state) => state.currentUser);
  const impersonatedOriginalUser = useDemoStore((state) => state.impersonatedOriginalUser);
  const impersonationReason = useDemoStore((state) => state.impersonationReason);
  const exitImpersonation = useDemoStore((state) => state.exitImpersonation);
  const [collapsed, setCollapsed] = useState(false);

  const renderModule = () => {
    const isSuperOrAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
    const isHrOrAdmin = isSuperOrAdmin || currentUser.role === 'HR_ADMIN';
    const isFinanceOrAdmin = isSuperOrAdmin || currentUser.role === 'FINANCE' || currentUser.role === 'FINANCE_ADMIN';

    // Client role is strictly restricted to Client Portal unless explicitly navigating authorized documents
    if (currentUser.role === 'CLIENT') {
      if (activeTab === 'documents') return <DocumentsModule />;
      if (activeTab === 'finance') return <FinanceModule />;
      return <ClientPortalModule />;
    }

    // Role-based Access Control (RBAC) Guards for privileged modules
    if ((activeTab === 'super-admin' || activeTab === 'admin-control') && !isSuperOrAdmin) {
      return (
        <div className="p-8 rounded-3xl bg-white border border-rose-200 shadow-sm text-center max-w-lg mx-auto my-12 space-y-4 animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
            <p className="text-xs text-slate-500 mt-1">
              Super Admin Center requires elevated root credentials. Your current role is <strong className="font-mono text-slate-700">{currentUser.role}</strong>.
            </p>
          </div>
          <button
            onClick={() => useDemoStore.getState().setActiveTab('dashboard')}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    if ((activeTab === 'security' || activeTab === 'identity') && !isHrOrAdmin) {
      return (
        <div className="p-8 rounded-3xl bg-white border border-rose-200 shadow-sm text-center max-w-lg mx-auto my-12 space-y-4 animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Security Access Restricted</h2>
            <p className="text-xs text-slate-500 mt-1">
              Security audit ledger and personnel onboarding require Administrative privileges.
            </p>
          </div>
          <button
            onClick={() => useDemoStore.getState().setActiveTab('dashboard')}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    if ((activeTab === 'finance' || activeTab === 'profitability') && !isFinanceOrAdmin) {
      return (
        <div className="p-8 rounded-3xl bg-white border border-rose-200 shadow-sm text-center max-w-lg mx-auto my-12 space-y-4 animate-fade-in">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Finance Access Restricted</h2>
            <p className="text-xs text-slate-500 mt-1">
              Invoices, expenses, and financial ledgers are restricted to Finance and Executive personnel.
            </p>
          </div>
          <button
            onClick={() => useDemoStore.getState().setActiveTab('dashboard')}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
      case 'intern-dashboard':
        return <ExecutiveDashboard />;
      case 'crm':
      case 'leads':
      case 'companies':
      case 'contacts':
      case 'deals':
        return <CRMModule />;
      case 'sales':
      case 'proposals':
      case 'contracts':
        return <SalesModule />;
      case 'projects':
      case 'tasks':
        return <ProjectsModule />;
      case 'team':
      case 'employees':
      case 'interns':
      case 'freelancers':
      case 'performance':
        return <TeamModule />;
      case 'resources':
        return <ResourceModule />;
      case 'timesheets':
        return <TimesheetsModule />;
      case 'attendance':
        return <AttendanceModule />;
      case 'finance':
      case 'profitability':
        return <FinanceModule />;
      case 'client-portal':
        return <ClientPortalModule />;
      case 'ai-assistant':
        return <AIAssistantModule />;
      case 'documents':
        return <DocumentsModule />;
      case 'analytics':
        return <AnalyticsModule />;
      case 'settings':
        return <SettingsModule />;
      case 'mail':
      case 'inbox':
      case 'sent':
      case 'drafts':
        return <MailModule />;
      case 'security':
      case 'identity':
        return <SecurityDashboard />;
      case 'super-admin':
      case 'admin-control':
        return <SuperAdminModule />;
      default:
        return <ExecutiveDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Persistent Super Admin Impersonation Banner */}
      {impersonatedOriginalUser && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-white px-4 py-2.5 text-xs shadow-md sticky top-0 z-50 flex items-center justify-between border-b border-amber-400">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="p-1.5 rounded-lg bg-black/20 shrink-0">
              <ShieldAlert className="w-4 h-4 text-white animate-pulse" />
            </span>
            <div className="truncate">
              <span className="font-black uppercase tracking-wider text-[11px] bg-black/25 px-2 py-0.5 rounded-md mr-2">
                SUPER ADMIN IMPERSONATION ACTIVE
              </span>
              <span className="font-semibold">
                Operating as: <strong className="underline decoration-white/50">{currentUser.name}</strong> ({currentUser.email} • {currentUser.role})
              </span>
              {impersonationReason && (
                <span className="text-amber-100 ml-2 hidden sm:inline text-[11px] italic">
                  — Reason: &ldquo;{impersonationReason}&rdquo;
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-4">
            <span className="text-[11px] text-amber-100 hidden md:inline">
              Primary Root: {impersonatedOriginalUser.name}
            </span>
            <button
              onClick={() => exitImpersonation()}
              className="px-3 py-1.5 rounded-lg bg-black/30 hover:bg-black/40 text-white font-bold text-xs flex items-center gap-1.5 border border-white/20 transition-all shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              Exit Impersonation
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 relative">
        
        {/* Left Collapsible Navigation Sidebar */}
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          
          {/* Top Bar Navigation & Actions */}
          <TopBar />

          {/* Dynamic Active Module Container */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto">
            {renderModule()}
          </main>
        </div>

      </div>

      {/* Global Modals & Toasts */}
      <QuickCreateModal />
      <GlobalSearchModal />
      <OnboardPersonnelModal />
      <Toast />
    </div>
  );
};
