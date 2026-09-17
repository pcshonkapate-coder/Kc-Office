"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../store/demoStore';
import {
  LayoutDashboard, Users, Building2, UserCheck, DollarSign,
  FolderKanban, CheckSquare, Clock, Users2, FileText, Bot,
  TrendingUp, Settings, Shield, ChevronDown, ChevronRight,
  ChevronLeft, Calendar, Award, Receipt, PieChart, Globe, Mail
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const currentUser = useDemoStore((state) => state.currentUser);
  const activeTab = useDemoStore((state) => state.activeTab);
  const setActiveTab = useDemoStore((state) => state.setActiveTab);
  const emailThreads = useDemoStore((state) => state.emailThreads);
  const unreadMailCount = emailThreads.filter(t => t.folder === 'INBOX' && t.isUnread).length;
  const registrationRequests = useDemoStore((state) => state.registrationRequests);
  const pendingRequestsCount = registrationRequests?.filter(r => r.status === 'PENDING').length || 0;

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    crm: true,
    sales: true,
    projects: true,
    team: true,
    finance: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const isClient = currentUser.role === 'CLIENT';
  const isIntern = currentUser.role === 'INTERN';
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'HR_ADMIN';

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Top Logo */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-3 overflow-hidden">
          <img src="/logo.png" alt="Kapate OS" className="h-8 object-contain shrink-0" />
          {!collapsed && (
            <div className="truncate">
              <div className="font-bold text-sm text-slate-900 tracking-tight leading-none">KAPATE OS</div>
              <div className="text-[10px] text-slate-500 mt-1 font-medium">Enterprise Platform</div>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        
        {/* CLIENT ROLE RESTRICTED VIEW */}
        {isClient ? (
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2">Client Portal</div>
            <button
              onClick={() => setActiveTab('client-portal')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'client-portal' ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              {!collapsed && <span>Client Dashboard</span>}
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'projects' ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              {!collapsed && <span>Project Progress</span>}
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'documents' ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              {!collapsed && <span>Authorized Documents</span>}
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'finance' ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Receipt className="w-4 h-4" />
              {!collapsed && <span>Invoices & Billing</span>}
            </button>
          </div>
        ) : (
          /* STANDARD INTERNAL ROLES */
          <>
            {/* Dashboard */}
            <button
              onClick={() => setActiveTab(isIntern ? 'intern-dashboard' : 'dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'dashboard' || activeTab === 'intern-dashboard'
                  ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              {!collapsed && <span>{isIntern ? 'My Intern Dashboard' : 'Dashboard'}</span>}
            </button>

            {/* Internal Business Mail */}
            <button
              onClick={() => setActiveTab('mail')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'mail' || activeTab === 'inbox'
                  ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-blue-600" />
                {!collapsed && <span>Internal Mail</span>}
              </div>
              {!collapsed && unreadMailCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-blue-600 text-white">
                  {unreadMailCount}
                </span>
              )}
            </button>

            {/* CRM Section */}
            {!isIntern && (
              <div>
                {!collapsed && (
                  <button
                    onClick={() => toggleSection('crm')}
                    className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700"
                  >
                    <span>CRM</span>
                    {openSections.crm ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                )}
                {(collapsed || openSections.crm) && (
                  <div className="space-y-1">
                    {[
                      { id: 'leads', label: 'Leads', icon: Users },
                      { id: 'companies', label: 'Companies', icon: Building2 },
                      { id: 'contacts', label: 'Contacts', icon: UserCheck },
                      { id: 'deals', label: 'Deals Kanban', icon: DollarSign },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          activeTab === item.id ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {!collapsed && <span>{item.label}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sales Section */}
            {!isIntern && (
              <div>
                {!collapsed && (
                  <button
                    onClick={() => toggleSection('sales')}
                    className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700"
                  >
                    <span>Sales</span>
                    {openSections.sales ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                )}
                {(collapsed || openSections.sales) && (
                  <div className="space-y-1">
                    <button
                      onClick={() => setActiveTab('proposals')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        activeTab === 'proposals' ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      {!collapsed && <span>Proposals</span>}
                    </button>
                    <button
                      onClick={() => setActiveTab('contracts')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        activeTab === 'contracts' ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                      {!collapsed && <span>Contracts & SOWs</span>}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Projects Section */}
            <div>
              {!collapsed && (
                <button
                  onClick={() => toggleSection('projects')}
                  className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700"
                >
                  <span>Projects & Tasks</span>
                  {openSections.projects ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
              )}
              {(collapsed || openSections.projects) && (
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveTab('projects')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      activeTab === 'projects' ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <FolderKanban className="w-4 h-4" />
                    {!collapsed && <span>All Projects</span>}
                  </button>
                  <button
                    onClick={() => setActiveTab('tasks')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      activeTab === 'tasks' ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4" />
                    {!collapsed && <span>Task Kanban</span>}
                  </button>
                  <button
                    onClick={() => setActiveTab('timesheets')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      activeTab === 'timesheets' ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    {!collapsed && <span>Timesheets</span>}
                  </button>
                  {!isIntern && (
                    <button
                      onClick={() => setActiveTab('resources')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        activeTab === 'resources' ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <PieChart className="w-4 h-4" />
                      {!collapsed && <span>Resource Allocation</span>}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Team Section */}
            <div>
              {!collapsed && (
                <button
                  onClick={() => toggleSection('team')}
                  className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700"
                >
                  <span>Team & HR</span>
                  {openSections.team ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
              )}
              {(collapsed || openSections.team) && (
                <div className="space-y-1">
                  {!isIntern && (
                    <button
                      onClick={() => setActiveTab('employees')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        activeTab === 'employees' ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Users2 className="w-4 h-4" />
                      {!collapsed && <span>Employees</span>}
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('interns')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      activeTab === 'interns' ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    {!collapsed && <span>Intern Hub</span>}
                  </button>
                  <button
                    onClick={() => setActiveTab('attendance')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      activeTab === 'attendance' ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    {!collapsed && <span>Attendance & Leave</span>}
                  </button>
                  <button
                    onClick={() => setActiveTab('performance')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      activeTab === 'performance' ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    {!collapsed && <span>Performance Reviews</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Finance Section */}
            {!isIntern && (
              <div>
                {!collapsed && (
                  <button
                    onClick={() => toggleSection('finance')}
                    className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700"
                  >
                    <span>Finance</span>
                    {openSections.finance ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                )}
                {(collapsed || openSections.finance) && (
                  <div className="space-y-1">
                    <button
                      onClick={() => setActiveTab('finance')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        activeTab === 'finance' ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Receipt className="w-4 h-4" />
                      {!collapsed && <span>Invoices & Expenses</span>}
                    </button>
                    <button
                      onClick={() => setActiveTab('profitability')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        activeTab === 'profitability' ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      {!collapsed && <span>Project Profitability</span>}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Platform Services */}
            <div className="pt-2 border-t border-slate-200 space-y-1">
              <button
                onClick={() => setActiveTab('ai-assistant')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'ai-assistant' ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Bot className="w-4 h-4 text-blue-600" />
                {!collapsed && <span>AI Operations Assistant</span>}
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'documents' ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                {!collapsed && <span>Document Library</span>}
              </button>
              {!isIntern && (
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'analytics' ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  {!collapsed && <span>Analytics & BI</span>}
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'security' ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                    {!collapsed && <span>Security & Identity</span>}
                  </div>
                  {!collapsed && pendingRequestsCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500 text-white animate-pulse">
                      {pendingRequestsCount}
                    </span>
                  )}
                </button>
              )}
              {currentUser.role === 'ADMIN' && (
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    activeTab === 'settings' ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  {!collapsed && <span>Admin Settings</span>}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Sidebar Footer Link to Public Website */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs text-slate-800 transition-colors shadow-sm"
        >
          <Globe className="w-4 h-4 shrink-0 text-blue-600" />
          {!collapsed && <span className="font-semibold text-[11px]">Main Public Website</span>}
        </a>
      </div>
    </aside>
  );
};
