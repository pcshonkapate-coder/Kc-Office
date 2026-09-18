"use client";

import React from 'react';
import { useDemoStore } from '../../../store/demoStore';
import {
  TrendingUp, DollarSign, FolderKanban, Users, Receipt, PieChart,
  ArrowUpRight, Sparkles, CheckSquare, Clock, ShieldCheck, Mail,
  Award, BookOpen, AlertCircle, ChevronRight, CheckCircle2, UserCheck
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell
} from 'recharts';

export const ExecutiveDashboard: React.FC = () => {
  const currentUser = useDemoStore((state) => state.currentUser);
  const leads = useDemoStore((state) => state.leads);
  const deals = useDemoStore((state) => state.deals);
  const tasks = useDemoStore((state) => state.tasks);
  const projects = useDemoStore((state) => state.projects);
  const timesheets = useDemoStore((state) => state.timesheets);
  const setActiveTab = useDemoStore((state) => state.setActiveTab);
  const setMailComposeOpen = useDemoStore((state) => state.setMailComposeOpen);

  const employees = useDemoStore((state) => state.employees);
  const interns = useDemoStore((state) => state.interns);
  const freelancers = useDemoStore((state) => state.freelancers);
  const invoices = useDemoStore((state) => state.invoices);
  const payments = useDemoStore((state) => state.payments);
  const expenses = useDemoStore((state) => state.expenses);

  // Filter personal data for user-tailored views
  const myTasks = tasks.filter(t => 
    t.assignedTo?.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0]) ||
    t.assignedTo?.toLowerCase().includes(currentUser.name.toLowerCase())
  );
  const pendingTasks = myTasks.filter(t => (t.status as string) !== 'COMPLETED' && (t.status as string) !== 'Done');
  const completedTasks = myTasks.filter(t => (t.status as string) === 'COMPLETED' || (t.status as string) === 'Done');

  /* =========================================================================
     1. INTERN ROLE-TAILORED VIEW
     ========================================================================= */
  if (currentUser.role === 'INTERN') {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header with verified Kapate Identity Badge */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 mb-2 uppercase tracking-wider">
              <Award className="w-4 h-4 text-amber-400" /> Intern Learning & Delivery Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Track your daily research sprints, submit timesheets, and collaborate with your assigned mentor.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-xs">
              <div className="text-slate-400 text-[10px] uppercase font-mono tracking-wider">Kapate Identity ID</div>
              <div className="font-mono font-bold text-amber-300 text-sm">{currentUser.kapateId || 'KAP-INT-000001'}</div>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-xs">
              <div className="text-slate-400 text-[10px] uppercase font-mono tracking-wider">Corporate Email</div>
              <div className="font-mono font-semibold text-blue-200 text-xs">{currentUser.internalEmail || currentUser.email}</div>
            </div>
          </div>
        </div>

        {/* Intern KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div 
            onClick={() => setActiveTab('tasks')}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Assigned Tasks</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <CheckSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{myTasks.length}</div>
            <div className="text-[11px] text-blue-600 mt-1 font-semibold flex items-center gap-1">
              {pendingTasks.length} in progress
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('timesheets')}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Hours Logged</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {timesheets.reduce((sum, t) => sum + (Number(t.hours) || 0), 0)}h
            </div>
            <div className="text-[11px] text-purple-600 mt-1 font-semibold">Logged via Timesheets</div>
          </div>

          <div 
            onClick={() => setActiveTab('attendance')}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Attendance Logged</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600">
              {useDemoStore.getState().attendance.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">Recorded sessions</div>
          </div>

          <div 
            onClick={() => setActiveTab('tasks')}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Completed Sprints</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{completedTasks.length}</div>
            <div className="text-[11px] text-amber-600 mt-1 font-semibold">Tasks Completed</div>
          </div>
        </div>

        {/* Main Content Row: Assigned Tasks + Mentorship Hub */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Tasks list */}
          <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">My Assigned Delivery Tasks</h2>
                <p className="text-xs text-slate-500">Tasks assigned by managers and technical leads</p>
              </div>
              <button 
                onClick={() => setActiveTab('tasks')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View Kanban <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {myTasks.length > 0 ? (
                myTasks.map((task: any) => (
                  <div 
                    key={task.id}
                    className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-500">{task.id}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          task.priority === 'High' ? 'bg-rose-100 text-rose-700' :
                          task.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {task.priority}
                        </span>
                        <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          {task.projectName}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-800">{task.title}</div>
                      <div className="text-xs text-slate-500">Due: {task.dueDate} • Est: {task.estimatedHours}h</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                        task.status === 'Done' || task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        task.status === 'In Progress' || task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-center space-y-2">
                  <CheckSquare className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No Assigned Tasks Yet</p>
                  <p className="text-xs text-slate-400">Tasks assigned to you by project leads will appear directly here in real-time.</p>
                </div>
              )}
            </div>
          </div>

          {/* Mentorship & Quick Actions */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                  SK
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Executive Mentorship</div>
                  <div className="font-bold text-slate-900 text-base">Shon Kapate</div>
                  <div className="text-xs text-slate-600">Founder & Technology Lead</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <div className="font-semibold text-slate-900">Weekly Mentorship Sync</div>
                <div className="text-slate-500">Scheduled via Kapate Internal Mail Desk</div>
              </div>

              <button
                onClick={() => {
                  setMailComposeOpen(true, {
                    to: [{ name: 'Shon Kapate', email: 'shon@kapateconsultancy.com' }],
                    subject: 'Internship Progress & Technical Queries'
                  } as any);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Mail className="w-4 h-4" /> Message Lead via Internal Mail
              </button>
            </div>

            <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-amber-700" /> RBAC Policy Notice
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                As an intern, you are authorized to collaborate on assigned project tasks, log sprint hours, and communicate internally. Administrative and client-management capabilities are restricted server-side.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     2. EMPLOYEE ROLE-TAILORED VIEW
     ========================================================================= */
  if (currentUser.role === 'EMPLOYEE') {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header with verified Kapate Identity Badge */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 text-white shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> Engineering & Delivery Workbench
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              {currentUser.designation || 'Engineering Specialist'} • {currentUser.department || 'Engineering'} Department
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-xs">
              <div className="text-slate-400 text-[10px] uppercase font-mono tracking-wider">Kapate Employee ID</div>
              <div className="font-mono font-bold text-emerald-300 text-sm">{currentUser.kapateId || 'KAP-EMP-000001'}</div>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-xs">
              <div className="text-slate-400 text-[10px] uppercase font-mono tracking-wider">Internal Corporate Mail</div>
              <div className="font-mono font-semibold text-blue-200 text-xs">{currentUser.internalEmail || currentUser.email}</div>
            </div>
          </div>
        </div>

        {/* Employee KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div 
            onClick={() => setActiveTab('tasks')}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-emerald-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Active Tasks</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <CheckSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{myTasks.length}</div>
            <div className="text-[11px] text-blue-600 mt-1 font-semibold">{pendingTasks.length} in progress</div>
          </div>

          <div 
            onClick={() => setActiveTab('timesheets')}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-emerald-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Logged Hours</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {timesheets.reduce((sum, t) => sum + (Number(t.hours) || 0), 0)}h
            </div>
            <div className="text-[11px] text-emerald-600 mt-1 font-semibold">Total verified hours</div>
          </div>

          <div 
            onClick={() => setActiveTab('projects')}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-emerald-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Active Projects</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <FolderKanban className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{projects.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">Assigned client systems</div>
          </div>

          <div 
            onClick={() => setActiveTab('mail')}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-emerald-300 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Internal Mail</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Mail className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">Inbox</div>
            <div className="text-[11px] text-amber-600 mt-1 font-semibold">Corporate Communications</div>
          </div>
        </div>

        {/* Task Board + Project Focus */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">My Assigned Engineering Deliverables</h2>
                <p className="text-xs text-slate-500">Sprint commitments & backlog priorities</p>
              </div>
              <button 
                onClick={() => setActiveTab('tasks')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                Go to Task Kanban <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {myTasks.length > 0 ? (
                myTasks.map((task: any) => (
                  <div 
                    key={task.id}
                    className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-500">{task.id}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          task.priority === 'High' ? 'bg-rose-100 text-rose-700' :
                          task.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {task.priority}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {task.projectName}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-800">{task.title}</div>
                      <div className="text-xs text-slate-500">Due: {task.dueDate} • Estimated: {task.estimatedHours}h</div>
                    </div>

                    <span className={`px-3 py-1 rounded-xl text-xs font-bold self-start sm:self-auto ${
                      task.status === 'Done' || task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                      task.status === 'In Progress' || task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-center space-y-2">
                  <CheckSquare className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No Active Tasks Assigned</p>
                  <p className="text-xs text-slate-400">You are all caught up! New engineering tasks assigned to you will show here.</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Active Delivery Sprints</h3>
              {projects.length > 0 ? (
                <div className="space-y-3">
                  {projects.slice(0, 3).map((p) => (
                    <div key={p.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{p.name}</span>
                        <span className="font-mono text-emerald-700 font-semibold">{p.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                      </div>
                      <div className="text-[11px] text-slate-500">{p.status}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-1">
                  <FolderKanban className="w-6 h-6 text-slate-300 mx-auto" />
                  <div className="text-xs font-bold text-slate-600">No Active Sprints</div>
                  <div className="text-[11px] text-slate-400">Created projects and delivery milestones will appear here.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     3. EXECUTIVE & ADMIN VIEW (SUPER_ADMIN, ADMIN, PROJECT_MANAGER, FINANCE)
     ========================================================================= */
  const totalPipeline = deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const totalRevenueCollected = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 
    invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  const totalOperatingCost = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const outstandingInvoices = invoices.filter(i => i.status !== 'Paid');
  const outstandingAmount = outstandingInvoices.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  const totalTeamMembers = employees.length + interns.length + freelancers.length;
  const grossMarginPct = totalRevenueCollected > 0 
    ? (((totalRevenueCollected - totalOperatingCost) / totalRevenueCollected) * 100).toFixed(1) 
    : '0.0';

  const revenueData = [
    { month: 'Current Period', revenue: Number((totalRevenueCollected / 100000).toFixed(2)), cost: Number((totalOperatingCost / 100000).toFixed(2)) },
  ];

  const leadSourceData = leads.length > 0 ? [
    { name: 'Website', value: leads.filter(l => l.source === 'Website').length || 1, color: '#2563eb' },
    { name: 'Referral', value: leads.filter(l => l.source === 'Referral').length || 0, color: '#059669' },
    { name: 'LinkedIn', value: leads.filter(l => l.source === 'LinkedIn').length || 0, color: '#0f172a' },
    { name: 'Events/RFP', value: leads.filter(l => l.source === 'Events/RFP' || l.source === 'Direct').length || 0, color: '#d97706' },
  ].filter(s => s.value > 0) : [
    { name: 'Direct Inbound', value: 100, color: '#2563eb' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Executive Command Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Good morning, {currentUser.name.split(' ')[0]}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Kapate Consultancy Overview — Operational metrics & financial performance
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.kapateId && (
            <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-mono font-bold text-blue-700">
              {currentUser.kapateId}
            </div>
          )}
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 font-mono font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Revenue Collected</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">₹{(totalRevenueCollected / 100000).toFixed(2)}L</div>
          <div className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" /> {payments.length} verified transactions
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pipeline Value</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">₹{(totalPipeline / 100000).toFixed(2)}L</div>
          <div className="text-[11px] text-blue-600 flex items-center gap-1 mt-1 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" /> {deals.length} active deals
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Active Projects</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-900">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{projects.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Client deliverables in flight</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">CRM Leads</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{leads.length}</div>
          <div className="text-[11px] text-purple-600 flex items-center gap-1 mt-1 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" /> Pipeline prospects
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Outstanding Invoices</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">₹{(outstandingAmount / 100000).toFixed(2)}L</div>
          <div className="text-[11px] text-amber-600 mt-1 font-medium">{outstandingInvoices.length} pending settlement</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Team Personnel</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalTeamMembers}</div>
          <div className="text-[11px] text-slate-500 mt-1">{employees.length} Staff • {interns.length} Interns</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Active Tasks</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{tasks.length}</div>
          <div className="text-[11px] text-blue-600 mt-1 font-semibold">
            {tasks.filter(t => (t.status as string) === 'COMPLETED' || (t.status as string) === 'Done').length} completed
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Gross Margin</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">{grossMarginPct}%</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Operating efficiency</div>
        </div>

      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Revenue vs Operating Cost</h3>
              <p className="text-xs text-slate-500">Real-time ledger overview (in Lakhs INR)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Revenue
              </span>
              <span className="flex items-center gap-1.5 text-rose-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Cost
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '12px', fontSize: '12px', color: '#0f172a' }} />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Source Breakdown */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Lead Acquisition Channels</h3>
            <p className="text-xs text-slate-500 mb-4">Inbound lead sources breakdown</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={leadSourceData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                  {leadSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '12px' }} />
              </RePieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            {leadSourceData.map((src) => (
              <div key={src.name} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: src.color }} />
                <span className="text-slate-700 font-semibold">{src.name}</span>
                <span className="text-slate-500 font-mono ml-auto">{src.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
