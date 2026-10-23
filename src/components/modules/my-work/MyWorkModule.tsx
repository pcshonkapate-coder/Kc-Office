"use client";

import React, { useMemo, useState } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import { Task, TaskStatus } from '../../../types';
import {
  Calendar, CheckCircle2, Clock, Hourglass, Plus,
  Target, CheckSquare, Sparkles,
  ChevronRight, ArrowUpRight, Play, Mail, ShieldCheck, BellRing
} from 'lucide-react';

export const MyWorkModule: React.FC = () => {
  const currentUser = useDemoStore((state) => state.currentUser);
  const tasks = useDemoStore((state) => state.tasks);
  const updateTaskStatus = useDemoStore((state) => state.updateTaskStatus);
  const timesheets = useDemoStore((state) => state.timesheets);
  const attendance = useDemoStore((state) => state.attendance);
  const leaves = useDemoStore((state) => state.leaves);
  const calendarEvents = useDemoStore((state) => state.calendarEvents);
  const setActiveTab = useDemoStore((state) => state.setActiveTab);
  const setQuickCreateOpen = useDemoStore((state) => state.setQuickCreateOpen);
  const setMailComposeOpen = useDemoStore((state) => state.setMailComposeOpen);
  const showToast = useDemoStore((state) => state.showToast);

  const [taskFilter, setTaskFilter] = useState<'ALL' | 'PENDING' | 'URGENT' | 'COMPLETED'>('ALL');

  // Filter tasks assigned to current user
  const myTasks = useMemo(() => {
    return tasks.filter((t) => {
      const assigned = (t.assignedTo || '').toLowerCase();
      const userName = (currentUser?.name || '').toLowerCase();
      const userEmail = (currentUser?.email || '').toLowerCase();
      const userKapateId = (currentUser?.kapateId || '').toLowerCase();
      return (
        assigned.includes(userName) ||
        assigned.includes(userEmail) ||
        (userKapateId && assigned.includes(userKapateId))
      );
    });
  }, [tasks, currentUser]);

  const pendingTasks = useMemo(() => 
    myTasks.filter(t => (t.status as string) !== 'COMPLETED' && (t.status as string) !== 'Done'),
    [myTasks]
  );

  const completedTasks = useMemo(() => 
    myTasks.filter(t => (t.status as string) === 'COMPLETED' || (t.status as string) === 'Done'),
    [myTasks]
  );

  const urgentTasks = useMemo(() => 
    myTasks.filter(t => (t.priority === 'High' || t.priority === 'Urgent') && (t.status as string) !== 'COMPLETED' && (t.status as string) !== 'Done'),
    [myTasks]
  );

  const filteredTasks = useMemo(() => {
    switch (taskFilter) {
      case 'PENDING':
        return pendingTasks;
      case 'URGENT':
        return urgentTasks;
      case 'COMPLETED':
        return completedTasks;
      case 'ALL':
      default:
        return myTasks;
    }
  }, [taskFilter, myTasks, pendingTasks, urgentTasks, completedTasks]);

  // Current User Timesheets & Today's Attendance
  const myTimesheets = useMemo(() => 
    timesheets.filter(t => t.employeeName === currentUser?.name),
    [timesheets, currentUser]
  );

  const totalLoggedHours = useMemo(() => 
    myTimesheets.reduce((acc, curr) => acc + (Number(curr.hours) || 0), 0),
    [myTimesheets]
  );

  const pendingApprovalsCount = useMemo(() => 
    myTimesheets.filter(t => t.status === 'Submitted').length,
    [myTimesheets]
  );

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayAttendance = useMemo(() => 
    attendance.find(a => a.employeeName === currentUser?.name && a.date === todayStr),
    [attendance, currentUser, todayStr]
  );

  // Administrative sign-off alerts if manager or admin
  const isManagerOrAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'PROJECT_MANAGER';
  const systemPendingTimesheets = useMemo(() => 
    timesheets.filter(t => t.status === 'Submitted'),
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
    <div className="space-y-6 animate-fade-in pb-12 text-slate-900">
      {/* 1. Header & Personal Rhythm Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Sparkles className="w-3.5 h-3.5" /> Kapate OS 2.0 Operating Hub
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200">
                {currentUser.kapateId || 'KAP-OS-USER'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                {currentUser.department || 'Operations'} &bull; {currentUser.designation || currentUser.role}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Daily Command Center &bull; {currentUser.name}
            </h1>
            <p className="text-slate-500 text-sm mt-1 max-w-2xl">
              Unified operating view for your active deliverables, daily rhythm, scheduled commitments, and approvals.
            </p>
          </div>

          {/* Quick Action Dock */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setQuickCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Quick Create
            </button>
            <button
              onClick={() => setMailComposeOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium border border-slate-200 shadow-xs transition-colors cursor-pointer"
            >
              <Mail className="w-4 h-4 text-blue-600" /> Draft Email
            </button>
            <button
              onClick={() => setActiveTab('timesheets')}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium border border-slate-200 shadow-xs transition-colors cursor-pointer"
            >
              <Clock className="w-4 h-4 text-amber-500" /> Timesheet
            </button>
          </div>
        </div>

        {/* Operational Telemetry Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Active Tasks</span>
              <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1.5">{pendingTasks.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{urgentTasks.length} high priority</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Logged Hours</span>
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1.5">{totalLoggedHours.toFixed(1)} hrs</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{pendingApprovalsCount} pending review</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Today&apos;s Status</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-emerald-600 mt-1.5">
              {todayAttendance?.status || 'Active'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {todayAttendance?.checkIn ? `In: ${todayAttendance.checkIn}` : 'Clocked in'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Tasks Completed</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1.5">{completedTasks.length}</div>
            <div className="text-[11px] text-indigo-600 mt-0.5">Lifetime contribution</div>
          </div>
        </div>
      </div>

      {/* 2. Main 2-Column Command Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tasks & Deliverables (2 cols on large) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" /> My Assigned Deliverables
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct action items linked to active client and engineering projects.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                <button
                  onClick={() => setTaskFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    taskFilter === 'ALL' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({myTasks.length})
                </button>
                <button
                  onClick={() => setTaskFilter('PENDING')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    taskFilter === 'PENDING' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  In Progress ({pendingTasks.length})
                </button>
                <button
                  onClick={() => setTaskFilter('URGENT')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    taskFilter === 'URGENT' ? 'bg-rose-50 text-rose-700 font-semibold border border-rose-200 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Urgent ({urgentTasks.length})
                </button>
                <button
                  onClick={() => setTaskFilter('COMPLETED')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    taskFilter === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Done ({completedTasks.length})
                </button>
              </div>
            </div>

            {/* Task Item List */}
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                <CheckCircle2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-700 font-medium text-sm">No tasks found for this view.</p>
                <p className="text-xs text-slate-400 mt-1">All commitments are on track or no items are assigned.</p>
                <button
                  onClick={() => setQuickCreateOpen(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-medium transition-colors cursor-pointer"
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
                          ? 'bg-slate-50 border-slate-200 opacity-70' 
                          : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <button
                            onClick={() => handleToggleTaskStatus(task)}
                            className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                              isDone
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 hover:border-blue-500 text-transparent'
                            }`}
                            title={isDone ? 'Mark as In Progress' : 'Mark as Completed'}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className={`text-sm font-semibold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                {task.title}
                              </h3>
                              {isUrgent && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  {task.priority}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                {task.projectName || 'Internal Operations'}
                              </span>
                            </div>
                            {task.description && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                {task.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                              <span className="flex items-center gap-1 text-slate-600">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                Due: {task.dueDate || 'Ongoing'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {task.loggedHours || 0} / {task.estimatedHours || 0} hrs
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-700">
                                {task.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setActiveTab('projects')}
                          className="text-slate-400 hover:text-blue-600 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
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
            <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-amber-500" /> Operational Sign-off Queue
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Timesheets and workforce requests awaiting managerial approval.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('timesheets')}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Open Approvals <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div 
                  onClick={() => setActiveTab('timesheets')}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Pending Timesheets</span>
                    <Hourglass className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    {systemPendingTimesheets.length}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Require manager sign-off for billing</p>
                </div>

                <div 
                  onClick={() => setActiveTab('attendance')}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Leave Requests</span>
                    <Calendar className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    {systemPendingLeaves.length}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Workforce leave approvals</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Schedule, AI Copilot Quick Assist & Quick Links */}
        <div className="space-y-6">
          {/* Today's Agenda */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" /> Today&apos;s Agenda
              </h2>
              <button
                onClick={() => setActiveTab('calendar')}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Full Calendar
              </button>
            </div>

            <div className="space-y-3">
              {todayEvents.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No meetings scheduled today.</p>
              ) : (
                todayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{evt.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-600" /> {evt.time || 'All Day'}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {evt.type}
                      </span>
                    </div>
                    {evt.meetingLink && (
                      <a
                        href={evt.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
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
          <div className="rounded-3xl bg-gradient-to-br from-blue-50/60 via-indigo-50/30 to-white border border-blue-200 p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-2">
              <Sparkles className="w-4 h-4 text-blue-600" /> Kapate AI Intelligence
            </div>
            <h3 className="text-base font-bold text-slate-900">Daily Smart Assistant</h3>
            <p className="text-xs text-slate-500 mt-1">
              Ask questions about active contracts, client invoices, project status, or SOP documentation.
            </p>
            <div className="mt-4">
              <button
                onClick={() => setActiveTab('ai-assistant')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white border border-blue-200 text-xs text-slate-600 hover:border-blue-400 hover:text-slate-900 transition-all shadow-xs group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" /> Ask Kapate AI...
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Quick Hub Navigation Links */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Navigation</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveTab('projects')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Projects & Sprints
              </button>
              <button
                onClick={() => setActiveTab('mail')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Corporate Mailbox
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Internal Chat
              </button>
              <button
                onClick={() => setActiveTab('knowledge')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
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
