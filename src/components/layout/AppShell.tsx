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
import { OnboardPersonnelModal } from '../modals/OnboardPersonnelModal';

export const AppShell: React.FC = () => {
  const activeTab = useDemoStore((state) => state.activeTab);
  const currentUser = useDemoStore((state) => state.currentUser);
  const [collapsed, setCollapsed] = useState(false);

  const renderModule = () => {
    // Client role is strictly restricted to Client Portal unless explicitly navigating authorized documents
    if (currentUser.role === 'CLIENT') {
      if (activeTab === 'documents') return <DocumentsModule />;
      if (activeTab === 'finance') return <FinanceModule />;
      return <ClientPortalModule />;
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
      default:
        return <ExecutiveDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
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
