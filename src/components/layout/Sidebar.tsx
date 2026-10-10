"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../store/demoStore';
import {
  LayoutDashboard, CheckSquare, Clock, Calendar, Mail, MessageSquare,
  Users, Building2, UserCheck, DollarSign, FileText, Shield,
  FolderKanban, PieChart, Users2, Award, TrendingUp, Receipt,
  BookOpen, Bot, Zap, ShieldCheck, Settings, Globe, ChevronLeft,
  ChevronDown, ChevronRight, Target, Sparkles
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
  const tasks = useDemoStore((state) => state.tasks);
  const chatChannels = useDemoStore((state) => state.chatChannels);
  const registrationRequests = useDemoStore((state) => state.registrationRequests);

  // Badge calculations
  const unreadMailCount = emailThreads.filter(t => t.folder === 'INBOX' && t.isUnread).length;
  const unreadChatCount = chatChannels.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const myPendingTasksCount = tasks.filter(t => {
    const firstName = (currentUser.name || '').toLowerCase().split(' ')[0];
    const isAssigned = (t.assignedTo || '').toLowerCase().includes(firstName) || t.assignedTo === currentUser.id;
    return isAssigned && (t.status as string) !== 'COMPLETED' && (t.status as string) !== 'Done';
  }).length;
  const pendingRequestsCount = registrationRequests?.filter(r => r.status === 'PENDING').length || 0;

  // Domain Collapsible State
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    main: true,
    business: true,
    delivery: true,
    people: true,
    finance: true,
    communication: true,
    knowledge: true,
    intelligence: true,
    admin: true
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const isClient = currentUser.role === 'CLIENT';
  const isIntern = currentUser.role === 'INTERN';
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'HR_ADMIN';
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
  const isFinance = currentUser.role === 'FINANCE' || currentUser.role === 'FINANCE_ADMIN' || isSuperAdmin;
  const isManager = currentUser.role === 'PROJECT_MANAGER' || isAdmin;

  return (
    <aside
      className={`bg-slate-950 border-r border-slate-850 flex flex-col h-screen sticky top-0 transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* 1. Header Branding */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-850 shrink-0 bg-slate-950/80 backdrop-blur">
        <div className="flex items-center gap-3 overflow-hidden">
          <img src="/logo.png" alt="Kapate OS" className="h-7 object-contain shrink-0" />
          {!collapsed && (
            <div className="truncate">
              <div className="font-black text-sm text-white tracking-wider flex items-center gap-1.5">
                KAPATE <span className="text-cyan-400">OS</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">2.0</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium truncate">Enterprise Operating System</div>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* 2. Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar text-xs">
        
        {/* =========================================================================
            CLIENT PORTAL VIEW
            ========================================================================= */}
        {isClient ? (
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 px-3 py-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Client Portal
            </div>
            {[
              { id: 'client-portal', label: 'Client Dashboard', icon: LayoutDashboard },
              { id: 'projects', label: 'Project Progress', icon: FolderKanban },
              { id: 'documents', label: 'Authorized Documents', icon: FileText },
              { id: 'finance', label: 'Invoices & Billing', icon: Receipt },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${
                  activeTab === item.id 
                    ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 shadow-sm' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <item.icon className="w-4 h-4 text-cyan-400 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>
        ) : (
          /* =========================================================================
              KAPATE OS 2.0 CANONICAL 8-DOMAIN ENTERPRISE NAVIGATION
              ========================================================================= */
          <>
            {/* 1. DOMAIN: MAIN */}
            <div>
              {!collapsed && (
                <button
                  onClick={() => toggleSection('main')}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200"
                >
                  <span>Main</span>
                  {openSections.main ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
              )}
              {(collapsed || openSections.main) && (
                <div className="space-y-0.5">
                  {/* Home Dashboard */}
                  <button
                    onClick={() => setActiveTab(isIntern ? 'intern-dashboard' : 'dashboard')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                      activeTab === 'dashboard' || activeTab === 'intern-dashboard'
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>{isIntern ? 'Intern Dashboard' : 'Overview'}</span>}
                  </button>

                  {/* My Work Command Center */}
                  <button
                    onClick={() => setActiveTab('my-work')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                      activeTab === 'my-work'
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Target className="w-4 h-4 text-cyan-400 shrink-0" />
                      {!collapsed && <span className="truncate">My Work</span>}
                    </div>
                    {!collapsed && myPendingTasksCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {myPendingTasksCount}
                      </span>
                    )}
                  </button>

                  {/* Corporate Mail */}
                  <button
                    onClick={() => setActiveTab('mail')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                      activeTab === 'mail' || activeTab === 'inbox'
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                      {!collapsed && <span className="truncate">Inbox & Mail</span>}
                    </div>
                    {!collapsed && unreadMailCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-500 text-white">
                        {unreadMailCount}
                      </span>
                    )}
                  </button>

                  {/* Schedule & Milestones Calendar */}
                  <button
                    onClick={() => setActiveTab('calendar')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                      activeTab === 'calendar'
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                    {!collapsed && <span>Calendar</span>}
                  </button>
                </div>
              )}
            </div>

            {/* 2. DOMAIN: BUSINESS (CRM & PIPELINE) */}
            {!isIntern && (
              <div>
                {!collapsed && (
                  <button
                    onClick={() => toggleSection('business')}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200"
                  >
                    <span>Business & CRM</span>
                    {openSections.business ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                )}
                {(collapsed || openSections.business) && (
                  <div className="space-y-0.5">
                    {[
                      { id: 'leads', label: 'Leads', icon: Users },
                      { id: 'companies', label: 'Companies', icon: Building2 },
                      { id: 'contacts', label: 'Contacts', icon: UserCheck },
                      { id: 'deals', label: 'Deals Kanban', icon: DollarSign },
                      { id: 'proposals', label: 'Proposals', icon: FileText },
                      { id: 'contracts', label: 'Contracts & SOWs', icon: Shield },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                          activeTab === item.id
                            ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                        }`}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. DOMAIN: DELIVERY (PROJECTS & TASKS) */}
            <div>
              {!collapsed && (
                <button
                  onClick={() => toggleSection('delivery')}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200"
                >
                  <span>Delivery & Projects</span>
                  {openSections.delivery ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
              )}
              {(collapsed || openSections.delivery) && (
                <div className="space-y-0.5">
                  <button
                    onClick={() => setActiveTab('projects')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                      activeTab === 'projects'
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    <FolderKanban className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Projects & Sprints</span>}
                  </button>
                  <button
                    onClick={() => setActiveTab('tasks')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                      activeTab === 'tasks'
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Task Kanban</span>}
                  </button>
                  {!isIntern && (
                    <button
                      onClick={() => setActiveTab('resources')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                        activeTab === 'resources'
                          ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                      }`}
                    >
                      <PieChart className="w-4 h-4 shrink-0" />
                      {!collapsed && <span>Resource Allocation</span>}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 4. DOMAIN: PEOPLE (WORKFORCE & HR) */}
            <div>
              {!collapsed && (
                <button
                  onClick={() => toggleSection('people')}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200"
                >
                  <span>People & Workforce</span>
                  {openSections.people ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
              )}
              {(collapsed || openSections.people) && (
                <div className="space-y-0.5">
                  {!isIntern && (
                    <button
                      onClick={() => setActiveTab('employees')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                        activeTab === 'employees'
                          ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                      }`}
                    >
                      <Users2 className="w-4 h-4 shrink-0" />
                      {!collapsed && <span>Employees</span>}
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('interns')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                      activeTab === 'interns'
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    <Award className="w-4 h-4 text-amber-400 shrink-0" />
                    {!collapsed && <span>Intern Hub</span>}
                  </button>
                  <button
                    onClick={() => setActiveTab('timesheets')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                      activeTab === 'timesheets'
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                    {!collapsed && <span>Timesheets & Time</span>}
                  </button>
                  <button
                    onClick={() => setActiveTab('attendance')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                      activeTab === 'attendance'
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    <Calendar className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Attendance & Leaves</span>}
                  </button>
                  {isManager && (
                    <button
                      onClick={() => setActiveTab('performance')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                        activeTab === 'performance'
                          ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4 shrink-0" />
                      {!collapsed && <span>Performance Reviews</span>}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 5. DOMAIN: FINANCE (BILLING & REVENUE) */}
            {isFinance && (
              <div>
                {!collapsed && (
                  <button
                    onClick={() => toggleSection('finance')}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200"
                  >
                    <span>Finance & Billing</span>
                    {openSections.finance ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                )}
                {(collapsed || openSections.finance) && (
                  <div className="space-y-0.5">
                    <button
                      onClick={() => setActiveTab('finance')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                        activeTab === 'finance'
                          ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                      }`}
                    >
                      <Receipt className="w-4 h-4 text-emerald-400 shrink-0" />
                      {!collapsed && <span>Invoices & Expenses</span>}
                    </button>
                    <button
                      onClick={() => setActiveTab('profitability')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                        activeTab === 'profitability'
                          ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                      }`}
                    >
                      <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                      {!collapsed && <span>Project Profitability</span>}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 6. DOMAIN: COMMUNICATION */}
            <div>
              {!collapsed && (
                <button
                  onClick={() => toggleSection('communication')}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200"
                >
                  <span>Communication</span>
                  {openSections.communication ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
              )}
              {(collapsed || openSections.communication) && (
                <div className="space-y-0.5">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                      activeTab === 'chat'
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <MessageSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                      {!collapsed && <span className="truncate">Internal Chat</span>}
                    </div>
                    {!collapsed && unreadChatCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-cyan-500 text-slate-950">
                        {unreadChatCount}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* 7. DOMAIN: KNOWLEDGE */}
            <div>
              {!collapsed && (
                <button
                  onClick={() => toggleSection('knowledge')}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200"
                >
                  <span>Knowledge & SOPs</span>
                  {openSections.knowledge ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
              )}
              {(collapsed || openSections.knowledge) && (
                <div className="space-y-0.5">
                  <button
                    onClick={() => setActiveTab('documents')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                      activeTab === 'documents'
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>Documents Vault</span>}
                  </button>
                  <button
                    onClick={() => setActiveTab('knowledge')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                      activeTab === 'knowledge'
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                    {!collapsed && <span>Wiki & Standard SOPs</span>}
                  </button>
                </div>
              )}
            </div>

            {/* 8. DOMAIN: INTELLIGENCE */}
            <div>
              {!collapsed && (
                <button
                  onClick={() => toggleSection('intelligence')}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200"
                >
                  <span>Intelligence & AI</span>
                  {openSections.intelligence ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
              )}
              {(collapsed || openSections.intelligence) && (
                <div className="space-y-0.5">
                  <button
                    onClick={() => setActiveTab('ai-assistant')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                      activeTab === 'ai-assistant'
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    <Bot className="w-4 h-4 text-cyan-400 shrink-0" />
                    {!collapsed && <span>AI Copilot & Ops</span>}
                  </button>
                  <button
                    onClick={() => setActiveTab('automations')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                      activeTab === 'automations'
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    {!collapsed && <span>Cross-Automations</span>}
                  </button>
                  {!isIntern && (
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                        activeTab === 'analytics'
                          ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4 shrink-0" />
                      {!collapsed && <span>Analytics & BI</span>}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* DOMAIN: ADMIN & GOVERNANCE */}
            {isAdmin && (
              <div className="pt-2 border-t border-slate-850">
                {!collapsed && (
                  <button
                    onClick={() => toggleSection('admin')}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300"
                  >
                    <span>System Governance</span>
                    {openSections.admin ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                )}
                {(collapsed || openSections.admin) && (
                  <div className="space-y-0.5">
                    {isSuperAdmin && (
                      <button
                        onClick={() => setActiveTab('super-admin')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
                          activeTab === 'super-admin'
                            ? 'bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-md border border-indigo-500/40'
                            : 'text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                          {!collapsed && <span>Super Admin Tier 0</span>}
                        </div>
                        {!collapsed && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-indigo-500 text-white">
                            ROOT
                          </span>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => setActiveTab('security')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                        activeTab === 'security'
                          ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                        {!collapsed && <span>Security & IAM</span>}
                      </div>
                      {!collapsed && pendingRequestsCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 animate-pulse">
                          {pendingRequestsCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab('settings')}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                        activeTab === 'settings'
                          ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                      }`}
                    >
                      <Settings className="w-4 h-4 shrink-0" />
                      {!collapsed && <span>System Settings</span>}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 3. Footer Link */}
      <div className="p-3 border-t border-slate-850 bg-slate-950/80">
        <a
          href={process.env.NEXT_PUBLIC_MAIN_SITE_URL || process.env.NEXT_PUBLIC_WEBSITE_URL || '/'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white transition-colors"
        >
          <Globe className="w-4 h-4 shrink-0 text-cyan-400" />
          {!collapsed && <span className="font-semibold text-[11px] truncate">Kapate Public Portal</span>}
        </a>
      </div>
    </aside>
  );
};
export default Sidebar;
