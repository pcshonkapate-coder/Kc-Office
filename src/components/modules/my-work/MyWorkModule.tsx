"use client";

import React, { useState, useMemo } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import {
  CheckCircle2, Clock, Calendar, AlertCircle, Sparkles,
  ArrowUpRight, Play, CheckSquare, Plus,
  FileText, Mail, ChevronRight, Filter,
  ShieldCheck, Hourglass, BarChart3, BellRing, Target
} from 'lucide-react';
import { Task, TaskStatus } from '../../../types';

export const MyWorkModule: React.FC = () => {
  const currentUser = useDemoStore((state) => state.currentUser);
  const tasks = useDemoStore((state) => state.tasks);
  const updateTaskStatus = useDemoStore((state) => state.updateTaskStatus);
  const timesheets = useDemoStore((state) => state.timesheets);
  const calendarEvents = useDemoStore((state) => state.calendarEvents);
  const attendance = useDemoStore((state) => state.attendance);
  const leaves = useDemoStore((state) => state.leaves);
  const setActiveTab = useDemoStore((state) => state.setActiveTab);
  const setQuickCreateOpen = useDemoStore((state) => state.setQuickCreateOpen);
  const setMailComposeOpen = useDemoStore((state) => state.setMailComposeOpen);
  const showToast = useDemoStore((state) => state.showToast);

  const [taskFilter, setTaskFilter] = useState<'ALL' | 'PENDING' | 'URGENT' | 'COMPLETED'>('ALL');

  // Filter user's tasks
  const myTasks = useMemo(() => {
    const firstName = (currentUser.name || '').toLowerCase().split(' ')[0];
    const fullName = (currentUser.name || '').toLowerCase();
    return tasks.filter(t => {
      const assigned = (t.assignedTo || '').toLowerCase();
      return assigned.includes(firstName) || assigned.includes(fullName) || t.assignedTo === currentUser.id;
    });
  }, [tasks, currentUser]);

  // Tasks categorized
  const pendingTasks = useMemo(() => 
    myTasks.filter(t => (t.status as string) !== 'COMPLETED' && (t.status as string) !== 'Done'),
    [myTasks]
  );
  const completedTasks = useMemo(() => 
    myTasks.filter(t => (t.status as string) === 'COMPLETED' || (t.status as string) === 'Done'),
    [myTasks]
  );
  const urgentTasks = useMemo(() => 
    pendingTasks.filter(t => t.priority === 'Urgent' || t.priority === 'High'),
    [pendingTasks]
  );

  const filteredTasks = useMemo(() => {
    switch (taskFilter) {
      case 'PENDING': return pendingTasks;
      case 'URGENT': return urgentTasks;
      case 'COMPLETED': return completedTasks;
      default: return myTasks;
    }
  }, [taskFilter, myTasks, pendingTasks, urgentTasks, completedTasks]);

  // User's attendance today
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayAttendance = useMemo(() => 
    attendance.find(a => 
      (a.employeeName?.toLowerCase().includes((currentUser.name || '').toLowerCase()) ||
       (currentUser.name || '').toLowerCase().includes(a.employeeName?.toLowerCase())) &&
      a.date === todayStr
    ),
    [attendance, currentUser.name, todayStr]
  );

  // User's timesheets this week
  const myTimesheets = useMemo(() => 
    timesheets.filter(ts => 
      (ts.employeeName || '').toLowerCase().includes((currentUser.name || '').toLowerCase()) ||
      (currentUser.name || '').toLowerCase().includes((ts.employeeName || '').toLowerCase())
    ),
    [timesheets, currentUser.name]
  );
  const totalLoggedHours = useMemo(() => 
    myTimesheets.reduce((sum, ts) => sum + (Number(ts.hours) || 0), 0),
    [myTimesheets]
  );
  const pendingApprovalsCount = useMemo(() => 
    myTimesheets.filter(ts => ts.status === 'Submitted').length,
    [myTimesheets]
  );

  // Approvals waiting for managers / admins
  const isManagerOrAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'PROJECT_MANAGER';
  const systemPendingTimesheets = useMemo(() => 
    timesheets.filter(ts => ts.status === 'Submitted'),
    [timesheets]
  );
  const systemPendingLeaves = useMemo(() => 
    leaves.filter(l => l.status === 'Pending'),
    [leaves]
  );

  // Today's schedule events
  const todayEvents = useMemo(() => 
    calendarEvents.slice(0, 4),
    [calendarEvents]
  );

  const handleToggleTaskStatus = (task: Task) => {
    const isDone = (task.status as string) === 'COMPLETED' || (task.status as string) === 'Done';
    const newStatus: TaskStatus = isDone ? 'IN PROGRESS' : 'COMPLETED';
    updateTaskStatus(task.id, newStatus);
    showToast(`Task marked as ${newStatus}`, 'info');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Header & Personal Rhythm Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Sparkles className="w-3.5 h-3.5" /> Kapate OS 2.0 Operating Hub
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {currentUser.kapateId || 'KAP-OS-USER'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {currentUser.department || 'Operations'} &bull; {currentUser.designation || currentUser.role}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Daily Command Center &bull; {currentUser.name}
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Unified operating view for your active deliverables, daily rhythm, scheduled commitments, and approvals.
            </p>
          </div>

          {/* Quick Action Dock */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setQuickCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold shadow-lg shadow-cyan-900/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Quick Create
            </button>
            <button
              onClick={() => setMailComposeOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors"
            >
              <Mail className="w-4 h-4 text-cyan-400" /> Draft Email
            </button>
            <button
              onClick={() => setActiveTab('timesheets')}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors"
            >
              <Clock className="w-4 h-4 text-amber-400" /> Timesheet
            </button>
          </div>
        </div>

        {/* Operational Telemetry Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/70">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Active Tasks</span>
              <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1.5">{pendingTasks.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{urgentTasks.length} high priority</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/70">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Logged Hours</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1.5">{totalLoggedHours.toFixed(1)} hrs</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{pendingApprovalsCount} pending review</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/70">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Today&apos;s Status</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-1.5">
              {todayAttendance?.status || 'Active'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {todayAttendance?.checkIn ? `In: ${todayAttendance.checkIn}` : 'Clocked in'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/70">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Tasks Completed</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-white mt-1.5">{completedTasks.length}</div>
            <div className="text-[11px] text-indigo-300 mt-0.5">Lifetime contribution</div>
          </div>
        </div>
      </div>

      {/* 2. Main 2-Column Command Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tasks & Deliverables (2 cols on large) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-cyan-400" /> My Assigned Deliverables
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct action items linked to active client and engineering projects.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                <button
                  onClick={() => setTaskFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    taskFilter === 'ALL' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({myTasks.length})
                </button>
                <button
                  onClick={() => setTaskFilter('PENDING')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    taskFilter === 'PENDING' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  In Progress ({pendingTasks.length})
                </button>
                <button
                  onClick={() => setTaskFilter('URGENT')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    taskFilter === 'URGENT' ? 'bg-rose-500/20 text-rose-300 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Urgent ({urgentTasks.length})
                </button>
                <button
                  onClick={() => setTaskFilter('COMPLETED')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    taskFilter === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Done ({completedTasks.length})
                </button>
              </div>
            </div>

            {/* Task Item List */}
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-slate-950/40 border border-slate-800/60">
                <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-300 font-medium text-sm">No tasks found for this view.</p>
                <p className="text-xs text-slate-500 mt-1">All commitments are on track or no items are assigned.</p>
                <button
                  onClick={() => setQuickCreateOpen(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  + Add New Task
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => {
                  const isDone = (task.status as string) === 'COMPLETED' || (task.status as string) === 'Done';
                  const isUrgent = task.priority === 'Urgent' || task.priority === 'High';
                  return (
                    <div
                      key={task.id}
                      className={`group p-4 rounded-2xl border transition-all ${
                        isDone 
                          ? 'bg-slate-950/30 border-slate-850 opacity-70' 
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <button
                            onClick={() => handleToggleTaskStatus(task)}
                            className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                              isDone
                                ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                                : 'border-slate-700 hover:border-cyan-400 text-transparent'
                            }`}
                            title={isDone ? 'Mark as In Progress' : 'Mark as Completed'}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className={`text-sm font-semibold truncate ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                                {task.title}
                              </h3>
                              {isUrgent && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  {task.priority}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
                                {task.projectName || 'Internal Operations'}
                              </span>
                            </div>
                            {task.description && (
                              <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                                {task.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                              <span className="flex items-center gap-1 text-slate-400">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                Due: {task.dueDate || 'Ongoing'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                {task.loggedHours || 0} / {task.estimatedHours || 0} hrs
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
                                {task.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setActiveTab('projects')}
                          className="text-slate-500 hover:text-cyan-400 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="View in Projects"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Manager / Admin Governance Queue (Conditional) */}
          {isManagerOrAdmin && (
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-amber-400" /> Operational Sign-off Queue
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Timesheets and workforce requests awaiting managerial approval.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('timesheets')}
                  className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1"
                >
                  Open Approvals <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div 
                  onClick={() => setActiveTab('timesheets')}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Pending Timesheets</span>
                    <Hourglass className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {systemPendingTimesheets.length}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Require manager sign-off for billing</p>
                </div>

                <div 
                  onClick={() => setActiveTab('attendance')}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Leave Requests</span>
                    <Calendar className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {systemPendingLeaves.length}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Workforce leave approvals</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Schedule, AI Copilot Quick Assist & Quick Links */}
        <div className="space-y-6">
          {/* Today's Agenda */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" /> Today&apos;s Agenda
              </h2>
              <button
                onClick={() => setActiveTab('calendar')}
                className="text-xs font-medium text-slate-400 hover:text-white"
              >
                Full Calendar
              </button>
            </div>

            <div className="space-y-3">
              {todayEvents.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No meetings scheduled today.</p>
              ) : (
                todayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{evt.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-400" /> {evt.time || 'All Day'}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {evt.type}
                      </span>
                    </div>
                    {evt.meetingLink && (
                      <a
                        href={evt.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                      >
                        <Play className="w-3 h-3" /> Join Virtual Meeting
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ask Kapate AI Prompt Box */}
          <div className="rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-900/50 p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Kapate AI Intelligence
            </div>
            <h3 className="text-base font-bold text-white">Daily Smart Assistant</h3>
            <p className="text-xs text-slate-400 mt-1">
              Ask questions about active contracts, client invoices, project status, or SOP documentation.
            </p>
            <div className="mt-4">
              <button
                onClick={() => setActiveTab('ai-assistant')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-950/80 border border-indigo-500/30 text-xs text-slate-400 hover:border-indigo-400 hover:text-white transition-all shadow-inner group"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> Ask Kapate AI...
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Quick Hub Navigation Links */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Navigation</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveTab('projects')}
                className="p-3 rounded-xl bg-slate-950/50 hover:bg-slate-800 border border-slate-800/80 text-left text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                Projects & Sprints
              </button>
              <button
                onClick={() => setActiveTab('mail')}
                className="p-3 rounded-xl bg-slate-950/50 hover:bg-slate-800 border border-slate-800/80 text-left text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                Corporate Mailbox
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className="p-3 rounded-xl bg-slate-950/50 hover:bg-slate-800 border border-slate-800/80 text-left text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                Internal Chat
              </button>
              <button
                onClick={() => setActiveTab('knowledge')}
                className="p-3 rounded-xl bg-slate-950/50 hover:bg-slate-800 border border-slate-800/80 text-left text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                Company Wiki
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default MyWorkModule;
