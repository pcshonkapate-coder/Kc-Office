"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import { Project, Task, TaskStatus } from '../../../types';
import {
  FolderKanban, CheckSquare, Clock, Plus, Users, AlertTriangle, CheckCircle2,
  Shield, Eye, Briefcase, Filter, Search, UserCheck, Calendar, ArrowRight,
  Sparkles, Check, ChevronRight
} from 'lucide-react';

export const ProjectsModule: React.FC = () => {
  const activeTab = useDemoStore((state) => state.activeTab);
  const projects = useDemoStore((state) => state.projects);
  const tasks = useDemoStore((state) => state.tasks);
  const updateTaskStatus = useDemoStore((state) => state.updateTaskStatus);
  const setQuickCreateOpen = useDemoStore((state) => state.setQuickCreateOpen);
  const showToast = useDemoStore((state) => state.showToast);

  const [subTab, setSubTab] = useState<'grid' | 'kanban'>(activeTab === 'tasks' ? 'kanban' : 'grid');
  const [selectedProject, setSelectedProject] = useState<Project | null>(projects[0] || null);
  const [projectDetailTab, setProjectDetailTab] = useState<'overview' | 'tasks' | 'milestones' | 'profitability'>('overview');
  
  // Filtering states for tasks
  const [taskRoleFilter, setTaskRoleFilter] = useState<'ALL' | 'MANAGER' | 'CLIENT' | 'ENGINEER'>('ALL');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [projectFilterId, setProjectFilterId] = useState<string>('ALL');

  const KANBAN_TASK_STATUSES: TaskStatus[] = [
    'TODO',
    'IN PROGRESS',
    'IN REVIEW',
    'CHANGES REQUESTED',
    'BLOCKED',
    'COMPLETED'
  ];

  const isManagerTask = (t: Task) =>
    t.assigneeRole === 'MANAGER' ||
    t.assignedTo?.toLowerCase().includes('manager') ||
    t.assignedTo?.toLowerCase().includes('shon');

  const isClientTask = (t: Task) =>
    t.assigneeRole === 'CLIENT' ||
    t.clientVisible === true ||
    t.assignedTo?.toLowerCase().includes('client');

  const managerTasks = tasks.filter(isManagerTask);
  const clientTasks = tasks.filter(isClientTask);
  const engineeringTasks = tasks.filter((t) => !isManagerTask(t) && !isClientTask(t));

  const filteredTasks = tasks.filter((t) => {
    if (taskRoleFilter === 'MANAGER' && !isManagerTask(t)) return false;
    if (taskRoleFilter === 'CLIENT' && !isClientTask(t)) return false;
    if (taskRoleFilter === 'ENGINEER' && (isManagerTask(t) || isClientTask(t))) return false;

    if (projectFilterId !== 'ALL' && t.projectId !== projectFilterId) return false;

    if (taskSearchQuery.trim()) {
      const q = taskSearchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.assignedTo.toLowerCase().includes(q) ||
        t.projectName.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'High':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Medium':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const renderRoleBadge = (t: Task) => {
    if (isManagerTask(t)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
          <Shield className="w-2.5 h-2.5" /> Manager Task
        </span>
      );
    }
    if (isClientTask(t)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Eye className="w-2.5 h-2.5" /> Client Action Item
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <Briefcase className="w-2.5 h-2.5" /> Engineering
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            Project Delivery & Task Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sprint planning, milestone execution, manager audit reviews, and client sign-off tracking
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setSubTab('grid')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                subTab === 'grid' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" /> All Projects ({projects.length})
            </button>
            <button
              onClick={() => setSubTab('kanban')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                subTab === 'kanban' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" /> Task Board ({tasks.length})
            </button>
          </div>

          <button
            onClick={() => setQuickCreateOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      {/* QUICK ROLE ASSIGNMENT SUMMARY STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => {
            setSubTab('kanban');
            setTaskRoleFilter('ALL');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            subTab === 'kanban' && taskRoleFilter === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${subTab === 'kanban' && taskRoleFilter === 'ALL' ? 'text-slate-300' : 'text-slate-500'}`}>
              Total Tasks
            </span>
            <CheckSquare className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black mt-2 font-mono">{tasks.length}</div>
          <div className={`text-[10px] mt-1 ${subTab === 'kanban' && taskRoleFilter === 'ALL' ? 'text-slate-400' : 'text-slate-500'}`}>
            Across {projects.length} active projects
          </div>
        </div>

        <div
          onClick={() => {
            setSubTab('kanban');
            setTaskRoleFilter('MANAGER');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            subTab === 'kanban' && taskRoleFilter === 'MANAGER'
              ? 'bg-purple-900 text-white border-purple-900 shadow-md'
              : 'bg-white text-slate-900 border-purple-100 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${subTab === 'kanban' && taskRoleFilter === 'MANAGER' ? 'text-purple-200' : 'text-purple-700'}`}>
              Manager Tasks
            </span>
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black mt-2 font-mono text-purple-600">{managerTasks.length}</div>
          <div className={`text-[10px] mt-1 ${subTab === 'kanban' && taskRoleFilter === 'MANAGER' ? 'text-purple-200' : 'text-slate-500'}`}>
            Security, audit & PM reviews
          </div>
        </div>

        <div
          onClick={() => {
            setSubTab('kanban');
            setTaskRoleFilter('CLIENT');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            subTab === 'kanban' && taskRoleFilter === 'CLIENT'
              ? 'bg-amber-900 text-white border-amber-900 shadow-md'
              : 'bg-white text-slate-900 border-amber-100 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${subTab === 'kanban' && taskRoleFilter === 'CLIENT' ? 'text-amber-200' : 'text-amber-700'}`}>
              Client Action Items
            </span>
            <Eye className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black mt-2 font-mono text-amber-600">{clientTasks.length}</div>
          <div className={`text-[10px] mt-1 ${subTab === 'kanban' && taskRoleFilter === 'CLIENT' ? 'text-amber-200' : 'text-slate-500'}`}>
            UAT, SSO & Client sign-offs
          </div>
        </div>

        <div
          onClick={() => {
            setSubTab('kanban');
            setTaskRoleFilter('ENGINEER');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            subTab === 'kanban' && taskRoleFilter === 'ENGINEER'
              ? 'bg-blue-900 text-white border-blue-900 shadow-md'
              : 'bg-white text-slate-900 border-blue-100 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${subTab === 'kanban' && taskRoleFilter === 'ENGINEER' ? 'text-blue-200' : 'text-blue-700'}`}>
              Engineering Tasks
            </span>
            <Briefcase className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black mt-2 font-mono text-blue-600">{engineeringTasks.length}</div>
          <div className={`text-[10px] mt-1 ${subTab === 'kanban' && taskRoleFilter === 'ENGINEER' ? 'text-blue-200' : 'text-slate-500'}`}>
            Architecture, CI/CD & features
          </div>
        </div>
      </div>

      {/* SUBTAB 1: PROJECTS GRID & PROJECT DETAIL TABS */}
      {subTab === 'grid' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Projects Cards List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">Active Projects ({projects.length})</div>
            {projects.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400">
                No active projects. Click "New Project" to initialize.
              </div>
            ) : (
              projects.map((prj) => (
                <div
                  key={prj.id}
                  onClick={() => setSelectedProject(prj)}
                  className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                    selectedProject?.id === prj.id
                      ? 'bg-white border-blue-600 shadow-md ring-1 ring-blue-600/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs font-bold text-blue-600">{prj.id}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {prj.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mt-2">{prj.name}</h3>
                  <div className="text-xs text-slate-500 mt-1">{prj.client}</div>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Completion</span>
                      <span className="font-mono font-bold text-blue-600">{prj.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${prj.progress}%` }} />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-purple-600" />
                      Manager: {prj.manager?.split(' ')[0] || 'Shon'}
                    </span>
                    <span className="font-mono font-bold text-emerald-600">₹{(prj.budget / 100000).toFixed(1)}L</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Detailed Project View Tabs */}
          <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            {!selectedProject ? (
              <div className="p-12 text-center text-slate-400">
                <FolderKanban className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <div className="text-sm font-semibold text-slate-700">No Project Selected</div>
                <div className="text-xs text-slate-400 mt-1">Select an active project or create a new delivery workspace.</div>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-600">{selectedProject.id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 font-semibold border border-blue-200">{selectedProject.status}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mt-1">{selectedProject.name}</h2>
                    <div className="text-xs text-slate-500 mt-1">
                      Client: <span className="font-semibold text-slate-700">{selectedProject.client}</span> • 
                      Manager: <span className="font-semibold text-purple-700">{selectedProject.manager}</span>
                    </div>
                  </div>

                  <div className="text-right bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div className="text-[10px] text-slate-500">Total Budget</div>
                    <div className="text-lg font-black text-emerald-600 font-mono">₹{(selectedProject.budget / 100000).toFixed(2)}L</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'tasks', label: `Tasks (${tasks.filter(t => t.projectId === selectedProject.id).length})` },
                    { id: 'milestones', label: 'Milestones Timeline' },
                    { id: 'profitability', label: 'Profitability Audit' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setProjectDetailTab(t.id as any)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                        projectDetailTab === t.id
                          ? 'bg-blue-50 text-blue-600 border border-blue-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {projectDetailTab === 'overview' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Project Summary</h4>
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        {selectedProject.description}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Allocated Team Members</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedProject.team.map((member, i) => (
                          <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span className="text-slate-800 font-medium">{member}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* PROJECT TASKS TAB */}
                {projectDetailTab === 'tasks' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-700">
                        Tasks for {selectedProject.name}
                      </div>
                      <button
                        onClick={() => {
                          setSubTab('kanban');
                          setProjectFilterId(selectedProject.id);
                        }}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        Open in Kanban Board <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {tasks.filter(t => t.projectId === selectedProject.id).length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 rounded-2xl bg-slate-50">
                        No tasks assigned for this project yet.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {tasks
                          .filter(t => t.projectId === selectedProject.id)
                          .map((t) => (
                            <div
                              key={t.id}
                              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono font-bold text-blue-600">{t.id}</span>
                                  {renderRoleBadge(t)}
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadgeClass(t.priority)}`}>
                                    {t.priority}
                                  </span>
                                  {t.clientVisible && (
                                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-medium">
                                      Client Visible
                                    </span>
                                  )}
                                </div>
                                <div className="font-bold text-slate-900">{t.title}</div>
                                {t.description && <div className="text-[11px] text-slate-500">{t.description}</div>}
                                <div className="text-[10px] text-slate-400">
                                  Assigned to: <span className="text-slate-700 font-medium">{t.assignedTo}</span> • Due: {t.dueDate}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <select
                                  value={t.status}
                                  onChange={(e) => updateTaskStatus(t.id, e.target.value as TaskStatus)}
                                  className="bg-white border border-slate-300 text-xs font-semibold text-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none shadow-2xs"
                                >
                                  {KANBAN_TASK_STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {projectDetailTab === 'milestones' && (
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-2">Milestone Execution Schedule</div>
                    {selectedProject.milestones.map((m) => (
                      <div key={m.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-900 flex items-center gap-2">
                            {m.progress === 100 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-amber-500" />}
                            {m.name}
                          </div>
                          <div className="text-[11px] text-slate-500">Target Due Date: {m.dueDate}</div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold border ${
                          m.progress === 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {m.progress}% Completed
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {projectDetailTab === 'profitability' && (
                  selectedProject.profitability ? (
                    <div className="space-y-4">
                      {selectedProject.profitability.alertMessage && (
                        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>{selectedProject.profitability.alertMessage}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                          <div className="text-slate-500 text-[10px]">Project Revenue</div>
                          <div className="text-lg font-bold text-emerald-600 mt-1 font-mono">₹{selectedProject.profitability.revenue.toLocaleString('en-IN')}</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                          <div className="text-slate-500 text-[10px]">Gross Profit & Margin</div>
                          <div className="text-lg font-bold text-blue-600 mt-1 font-mono">
                            ₹{selectedProject.profitability.grossProfit.toLocaleString('en-IN')} ({selectedProject.profitability.grossMargin}%)
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      No financial profitability audit recorded for this project yet.
                    </div>
                  )
                )}
              </>
            )}

          </div>

        </div>
      )}

      {/* SUBTAB 2: TASK BOARD KANBAN WITH ROLE FILTERS */}
      {subTab === 'kanban' && (
        <div className="space-y-4">
          
          {/* TASK CONTROLS & FILTER BAR */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto">
              <button
                onClick={() => setTaskRoleFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  taskRoleFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Tasks ({tasks.length})
              </button>
              <button
                onClick={() => setTaskRoleFilter('MANAGER')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  taskRoleFilter === 'MANAGER'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-purple-700 hover:bg-purple-50'
                }`}
              >
                <Shield className="w-3.5 h-3.5" /> Assigned to Managers ({managerTasks.length})
              </button>
              <button
                onClick={() => setTaskRoleFilter('CLIENT')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  taskRoleFilter === 'CLIENT'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-amber-800 hover:bg-amber-50'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Client Action Items ({clientTasks.length})
              </button>
              <button
                onClick={() => setTaskRoleFilter('ENGINEER')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  taskRoleFilter === 'ENGINEER'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-blue-700 hover:bg-blue-50'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" /> Engineering ({engineeringTasks.length})
              </button>
            </div>

            {/* Search & Project Filter */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter tasks..."
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <select
                value={projectFilterId}
                onChange={(e) => setProjectFilterId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
              >
                <option value="ALL">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* ACTIVE FILTER NOTICE BANNER */}
          {taskRoleFilter === 'MANAGER' && (
            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium">
                <Shield className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Showing tasks specifically assigned to <strong>Managers & Delivery PMs</strong> (Architecture sign-off, budget audits, security compliance).</span>
              </div>
              <button
                onClick={() => setTaskRoleFilter('ALL')}
                className="text-[11px] font-bold text-purple-700 hover:underline shrink-0 ml-2"
              >
                Clear Filter
              </button>
            </div>
          )}

          {taskRoleFilter === 'CLIENT' && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium">
                <Eye className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Showing action items assigned to or requiring sign-off from <strong>Enterprise Clients</strong> (UAT review, SSO certificate submission, theme approvals).</span>
              </div>
              <button
                onClick={() => setTaskRoleFilter('ALL')}
                className="text-[11px] font-bold text-amber-800 hover:underline shrink-0 ml-2"
              >
                Clear Filter
              </button>
            </div>
          )}

          {/* KANBAN COLUMNS */}
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {KANBAN_TASK_STATUSES.map((status) => {
              const statusTasks = filteredTasks.filter((t) => t.status === status);

              return (
                <div
                  key={status}
                  className="min-w-[300px] max-w-[300px] rounded-3xl bg-slate-50 border border-slate-200 p-3.5 flex flex-col justify-between shrink-0 shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                      <div className="text-[11px] font-mono font-bold text-slate-900 uppercase tracking-wider">
                        {status}
                      </div>
                      <span className="w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold font-mono">
                        {statusTasks.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {statusTasks.length === 0 ? (
                        <div className="p-6 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                          No tasks in {status}
                        </div>
                      ) : (
                        statusTasks.map((t) => (
                          <div
                            key={t.id}
                            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all space-y-2.5 shadow-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-blue-600">{t.id}</span>
                              {renderRoleBadge(t)}
                            </div>

                            <div className="font-bold text-slate-900 text-xs leading-snug">
                              {t.title}
                            </div>

                            {t.description && (
                              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                {t.description}
                              </p>
                            )}

                            <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                              <FolderKanban className="w-3 h-3 text-slate-400" />
                              <span className="text-slate-600 truncate">{t.projectName}</span>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                              <span className="text-slate-600 font-semibold truncate">
                                {t.assignedTo}
                              </span>
                              <span className={`px-2 py-0.5 rounded font-mono font-bold border ${getPriorityBadgeClass(t.priority)}`}>
                                {t.priority}
                              </span>
                            </div>

                            <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" /> Due {t.dueDate}
                              </span>
                              <select
                                value={t.status}
                                onChange={(e) => updateTaskStatus(t.id, e.target.value as TaskStatus)}
                                className="bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-700 rounded-lg px-2 py-1 focus:outline-none"
                              >
                                {KANBAN_TASK_STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>

                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
};
