"use client";

import React, { useState, useMemo } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import { Task, Project } from '../../../types';
import {
  CheckSquare, Clock, Users, FileText, Send, ChevronRight, X,
  Briefcase, CheckCircle2, Play, AlertCircle, Sparkles, FolderKanban,
  Paperclip, Shield, ArrowRight, UserCheck
} from 'lucide-react';

export const EmployeeWorkspace: React.FC = () => {
  const currentUser = useDemoStore((state) => state.currentUser);
  const tasks = useDemoStore((state) => state.tasks);
  const projects = useDemoStore((state) => state.projects);
  const employees = useDemoStore((state) => state.employees);
  const updateTaskStatus = useDemoStore((state) => state.updateTaskStatus);
  const addTimesheet = useDemoStore((state) => state.addTimesheet);
  const showToast = useDemoStore((state) => state.showToast);

  const [activeTab, setActiveTab] = useState<'sprint' | 'timesheet' | 'collab'>('sprint');
  const [selectedTaskForPanel, setSelectedTaskForPanel] = useState<Task | null>(null);

  // Contextual timesheet logging state
  const [logProjectId, setLogProjectId] = useState(projects[0]?.id || '');
  const [logTaskTitle, setLogTaskTitle] = useState('');
  const [logHours, setLogHours] = useState(4);
  const [logDescription, setLogDescription] = useState('');

  // Filter tasks to only those assigned to the current employee
  const myTasks = useMemo(() => {
    const myName = currentUser.name.toLowerCase();
    return tasks.filter(
      (t) =>
        t.assignedTo?.toLowerCase() === myName ||
        t.assignedTo?.toLowerCase().includes(myName.split(' ')[0])
    );
  }, [tasks, currentUser]);

  const todoTasks = myTasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = myTasks.filter((t) => t.status === 'IN PROGRESS');
  const reviewTasks = myTasks.filter((t) => t.status === 'IN REVIEW');
  const completedTasks = myTasks.filter((t) => t.status === 'COMPLETED');

  // Submit contextual timesheet entry
  const handleLogHours = (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find((p) => p.id === logProjectId) || projects[0];

    addTimesheet({
      date: new Date().toISOString().split('T')[0],
      day: 'Today',
      projectName: proj?.name || 'Assigned Client Project',
      taskName: logTaskTitle || 'Sprint Execution',
      hours: Number(logHours),
      isBillable: true,
      description: logDescription || `Delivery milestone work under ${proj?.name || 'Project'}`
    });

    setLogTaskTitle('');
    setLogHours(4);
    setLogDescription('');
    showToast(`Logged ${logHours}h against ${proj?.name || 'Deliverable'}`, 'success');
  };

  // Peer collaboration directory
  const peers = useMemo(() => {
    return employees.filter((e) => e.email.toLowerCase() !== currentUser.email?.toLowerCase());
  }, [employees, currentUser]);

  return (
    <div className="space-y-6 text-slate-100 animate-fade-in font-sans">
      
      {/* HEADER BANNER */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[90px] pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800/80 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
              <CheckSquare className="w-3.5 h-3.5" /> Engineer Execution Portal
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              Welcome back, {currentUser.name.split(' ')[0]}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Personal sprint deliverables, SOW contract scope, project timesheets, and department peer directory.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
            {[
              { id: 'sprint', label: 'My Sprint Board', icon: FolderKanban, count: myTasks.length },
              { id: 'timesheet', label: 'Log Project Hours', icon: Clock },
              { id: 'collab', label: 'Department Peers', icon: Users, count: peers.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/40 text-white">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. PERSONAL SPRINT BOARD */}
      {/* ========================================================================= */}
      {activeTab === 'sprint' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { id: 'TODO', label: 'To Do', items: todoTasks, border: 'border-slate-700' },
            { id: 'IN PROGRESS', label: 'In Progress', items: inProgressTasks, border: 'border-blue-800' },
            { id: 'REVIEW', label: 'Review Required', items: reviewTasks, border: 'border-amber-800' },
            { id: 'COMPLETED', label: 'Completed', items: completedTasks, border: 'border-emerald-800' },
          ].map((col) => (
            <div
              key={col.id}
              className={`rounded-2xl bg-slate-900/50 border ${col.border} p-4 flex flex-col min-h-[460px]`}
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <span className="font-extrabold text-xs uppercase tracking-wider text-slate-200">
                  {col.label}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-800 text-slate-300">
                  {col.items.length}
                </span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
                {col.items.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-slate-500 text-xs text-center border border-dashed border-slate-800 rounded-xl p-4">
                    No deliverables in {col.label}
                  </div>
                ) : (
                  col.items.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskForPanel(task)}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-600/60 transition-all cursor-pointer shadow-sm group space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-900/50 truncate">
                          {task.projectName || 'Active SOW'}
                        </span>
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                            task.priority === 'Urgent' || (task.priority as string) === 'P0-Critical'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-slate-900 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {task.priority || 'Medium'}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                        {task.title}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-900">
                        <span className="font-mono text-[10px]">Due: {task.dueDate || 'Sprint End'}</span>
                        <span className="text-blue-400 text-[10px] flex items-center gap-0.5">
                          Inspect SOW &rarr;
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CONTEXTUAL PROJECT TIMESHEET LOGGING */}
      {/* ========================================================================= */}
      {activeTab === 'timesheet' && (
        <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" /> Contextual Project Time Logging
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Hours are validated directly against active contract project codes, ensuring accurate billing attribution.
            </p>
          </div>

          <form onSubmit={handleLogHours} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Select Active Client Deliverable (Project ID)
              </label>
              <select
                value={logProjectId}
                onChange={(e) => setLogProjectId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.id}] {p.name} — {p.client}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Deliverable / Task Title
                </label>
                <input
                  type="text"
                  required
                  value={logTaskTitle}
                  onChange={(e) => setLogTaskTitle(e.target.value)}
                  placeholder="e.g. Optimized PostgreSQL index query plans"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Hours Spent
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="16"
                  required
                  value={logHours}
                  onChange={(e) => setLogHours(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                SOW Progress & Execution Notes
              </label>
              <textarea
                rows={3}
                value={logDescription}
                onChange={(e) => setLogDescription(e.target.value)}
                placeholder="Detail the technical milestones accomplished, benchmarks conducted, or blockers resolved..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" /> Submit to Project Manager for Approval
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DEPARTMENT COLLABORATION HUB */}
      {/* ========================================================================= */}
      {activeTab === 'collab' && (
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" /> Department Collaboration & Peer Directory
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Active engineering peers, specialization skills, and online availability for technical consultation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {peers.map((peer) => (
              <div
                key={peer.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-950 text-blue-300 border border-blue-900 flex items-center justify-center font-bold text-sm">
                    {peer.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-white truncate">{peer.name}</h4>
                    <p className="text-[11px] text-slate-400 truncate">{peer.role}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-900">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Available
                  </span>
                  <span className="text-slate-500">{peer.department}</span>
                </div>

                {peer.skills && peer.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {peer.skills.slice(0, 3).map((s, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[9px] bg-slate-900 text-slate-300 border border-slate-800"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SOW CONTEXT SLIDE-PANEL */}
      {/* ========================================================================= */}
      {selectedTaskForPanel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="w-full max-w-lg bg-slate-950 border-l border-slate-800 h-full p-6 flex flex-col justify-between shadow-2xl space-y-6 overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-950/80 border border-blue-800 text-blue-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">SOW Scope of Work</h3>
                    <p className="text-[11px] text-slate-400 font-mono">Task ID: {selectedTaskForPanel.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTaskForPanel(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Task Details */}
              <div className="space-y-3">
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-blue-950 border border-blue-800 text-blue-300">
                  {selectedTaskForPanel.projectName || 'Client Engagement'}
                </span>
                <h2 className="text-lg font-bold text-white leading-snug">
                  {selectedTaskForPanel.title}
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  {selectedTaskForPanel.description ||
                    'Deliverable executing under contract Scope of Work (SOW) specification. Verify deliverables against unit test suites and SLA latency targets before submitting for review.'}
                </p>
              </div>

              {/* Scope & Contract Context */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" /> SOW Verification Checklist
                </h4>
                <ul className="text-xs text-slate-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    Adheres to Kapate Consultancy Zero-Trust Security Protocol
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    All APIs documented with OpenAPI / Pydantic v2 schemas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    Automated test coverage passes with zero regressions
                  </li>
                </ul>
              </div>

              {/* Stage Progression Action */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Update Deliverable Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['TODO', 'IN PROGRESS', 'REVIEW', 'COMPLETED'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        updateTaskStatus(selectedTaskForPanel.id, st as any);
                        setSelectedTaskForPanel({ ...selectedTaskForPanel, status: st as any });
                        showToast(`Status updated to ${st}`, 'success');
                      }}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all border ${
                        selectedTaskForPanel.status === st
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedTaskForPanel(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
            >
              Close Context Panel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
