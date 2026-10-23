"use client";

import React, { useState, useMemo } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import { Task } from '../../../types';
import {
  FolderKanban, Clock, Users, AlertTriangle, CheckCircle2,
  XCircle, Filter, Shield, TrendingUp
} from 'lucide-react';

export const ManagerCommandCenter: React.FC = () => {
  const tasks = useDemoStore((state) => state.tasks);
  const projects = useDemoStore((state) => state.projects);
  const timesheets = useDemoStore((state) => state.timesheets);
  const employees = useDemoStore((state) => state.employees);
  const updateTaskStatus = useDemoStore((state) => state.updateTaskStatus);
  const updateTask = useDemoStore((state) => state.updateTask);
  const approveTimesheet = useDemoStore((state) => state.approveTimesheet);
  const rejectTimesheet = useDemoStore((state) => state.rejectTimesheet);
  const showToast = useDemoStore((state) => state.showToast);

  const [currentTimestamp] = useState(() => Date.now());
  const [activeTab, setActiveTab] = useState<'sprint' | 'timesheets' | 'resources' | 'milestones'>('sprint');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedTimesheetIds, setSelectedTimesheetIds] = useState<string[]>([]);
  const [reassignModalTask, setReassignModalTask] = useState<Task | null>(null);
  const [newAssignee, setNewAssignee] = useState<string>('');

  // ---------------------------------------------------------------------------
  // SPRINT VELOCITY & KANBAN CALCULATIONS
  // ---------------------------------------------------------------------------
  const filteredTasks = useMemo(() => {
    if (selectedProjectId === 'ALL') return tasks;
    return tasks.filter((t) => t.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  const columns = [
    { id: 'TODO', label: 'Sprint Backlog', color: 'border-slate-200 bg-slate-50 text-slate-700' },
    { id: 'IN PROGRESS', label: 'In Execution', color: 'border-blue-200 bg-blue-50/50 text-blue-700' },
    { id: 'REVIEW', label: 'Manager Review', color: 'border-amber-200 bg-amber-50/50 text-amber-700' },
    { id: 'COMPLETED', label: 'Shipped / Verified', color: 'border-emerald-200 bg-emerald-50/50 text-emerald-700' },
  ];

  const handlePriorityChange = (taskId: string, newPriority: 'Low' | 'Medium' | 'High' | 'Urgent') => {
    updateTask(taskId, { priority: newPriority });
    showToast(`Task priority updated to ${newPriority}`, 'success');
  };

  const handleReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (reassignModalTask && newAssignee) {
      updateTask(reassignModalTask.id, { assignedTo: newAssignee });
      showToast(`Reassigned "${reassignModalTask.title}" to ${newAssignee}`, 'success');
      setReassignModalTask(null);
      setNewAssignee('');
    }
  };

  // ---------------------------------------------------------------------------
  // TIMESHEET AUDITING & 40-HOUR OVERTIME DETECTION
  // ---------------------------------------------------------------------------
  const timesheetWeeklyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    timesheets.forEach((ts) => {
      const key = ts.employeeName || 'Unknown';
      totals[key] = (totals[key] || 0) + Number(ts.hours || 0);
    });
    return totals;
  }, [timesheets]);

  const handleToggleSelectTimesheet = (id: string) => {
    setSelectedTimesheetIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllTimesheets = () => {
    if (selectedTimesheetIds.length === timesheets.length) {
      setSelectedTimesheetIds([]);
    } else {
      setSelectedTimesheetIds(timesheets.map((t) => t.id));
    }
  };

  const handleBulkApprove = (approve: boolean) => {
    selectedTimesheetIds.forEach((id) => {
      if (approve) approveTimesheet(id);
      else rejectTimesheet(id);
    });
    showToast(
      `${approve ? 'Approved' : 'Rejected'} ${selectedTimesheetIds.length} timesheets`,
      approve ? 'success' : 'info'
    );
    setSelectedTimesheetIds([]);
  };

  // ---------------------------------------------------------------------------
  // RESOURCE ALLOCATION & OVERLOAD DETECTION
  // ---------------------------------------------------------------------------
  const resourceAllocation = useMemo(() => {
    return employees.map((emp) => {
      const assignedTasks = tasks.filter(
        (t) =>
          t.assignedTo?.toLowerCase() === emp.name.toLowerCase() &&
          t.status !== 'COMPLETED'
      );
      const activeProjects = Array.from(
        new Set(assignedTasks.map((t) => t.projectName).filter(Boolean))
      );
      const totalEstimatedHours = assignedTasks.reduce(
        (acc, curr) => acc + (Number(curr.estimatedHours) || 8),
        0
      );
      const weeklyHours = timesheetWeeklyTotals[emp.name] || 0;

      // Bandwidth calculation (nominal 40 hours per week sprint)
      const bandwidthPct = Math.round((totalEstimatedHours / 40) * 100);
      const isOverloaded = bandwidthPct > 100 || weeklyHours > 40;

      return {
        ...emp,
        assignedTasksCount: assignedTasks.length,
        activeProjectsCount: activeProjects.length,
        totalEstimatedHours,
        weeklyHours,
        bandwidthPct,
        isOverloaded,
      };
    });
  }, [employees, tasks, timesheetWeeklyTotals]);

  // ---------------------------------------------------------------------------
  // SOW MILESTONE BURNDOWN & AT-RISK DEADLINES
  // ---------------------------------------------------------------------------
  const projectMilestones = useMemo(() => {
    return projects.map((proj) => {
      const projTasks = tasks.filter((t) => t.projectId === proj.id || t.projectName === proj.name);
      const totalTasks = projTasks.length;
      const completedTasks = projTasks.filter((t) => t.status === 'COMPLETED').length;
      const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : proj.progress || 0;

      // Calculate deadline burn
      const deadlineDate = proj.deadline ? new Date(proj.deadline).getTime() : currentTimestamp + 30 * 86400000;
      const daysLeft = Math.ceil((deadlineDate - currentTimestamp) / (1000 * 60 * 60 * 24));

      // Hours burned vs budget
      const projTimesheets = timesheets.filter((ts) => ts.projectName === proj.name);
      const approvedHours = projTimesheets
        .filter((ts) => ts.status === 'Approved')
        .reduce((sum, ts) => sum + (Number(ts.hours) || 0), 0);
      const contractedHours = Math.round(Number(proj.budget || 500000) / 1500); // Nominal blended rate ₹1500/hr
      const remainingHours = Math.max(0, contractedHours - approvedHours);
      const burnPct = contractedHours > 0 ? Math.round((approvedHours / contractedHours) * 100) : 0;

      return {
        ...proj,
        totalTasks,
        completedTasks,
        sowProgressPct: progressPct,
        contractedHours,
        approvedHours,
        remainingHours,
        burnPct,
        daysLeft,
        isAtRisk: daysLeft < 14 && progressPct < 80,
      };
    });
  }, [projects, tasks, timesheets, currentTimestamp]);

  return (
    <div className="space-y-6 text-slate-900 animate-fade-in font-sans">
      
      {/* COMMAND CENTER HEADER */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Shield className="w-3.5 h-3.5" /> Project Delivery Command
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              Manager Operational Center
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Multi-sprint velocity oversight, timesheet governance, bottleneck unblocking, and contract SOW burn-down.
            </p>
          </div>

          {/* Quick Nav Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 overflow-x-auto custom-scrollbar">
            {[
              { id: 'sprint', label: 'Sprint Velocity', icon: FolderKanban },
              { id: 'timesheets', label: 'Timesheet Audits', icon: Clock },
              { id: 'resources', label: 'Resource Matrix', icon: Users },
              { id: 'milestones', label: 'SOW Milestones', icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'sprint' | 'timesheets' | 'resources' | 'milestones')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SPRINT VELOCITY & KANBAN OVERSIGHT */}
      {/* ========================================================================= */}
      {activeTab === 'sprint' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-blue-600" /> Filter Sprint by Project:
              </span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-semibold cursor-pointer"
              >
                <option value="ALL">All Active Projects ({projects.length})</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.client}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Displaying <strong className="text-slate-900">{filteredTasks.length}</strong> active sprint deliverables
            </div>
          </div>

          {/* Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {columns.map((col) => {
              const colTasks = filteredTasks.filter((t) => {
                if (col.id === 'TODO') return t.status === 'TODO';
                if (col.id === 'IN PROGRESS') return t.status === 'IN PROGRESS';
                if (col.id === 'REVIEW') return t.status === 'IN REVIEW';
                return t.status === 'COMPLETED';
              });

              return (
                <div
                  key={col.id}
                  className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex flex-col min-h-[480px]"
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                    <span className="font-black text-xs uppercase tracking-wider text-slate-700">
                      {col.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white border border-slate-200 text-slate-700">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
                    {colTasks.length === 0 ? (
                      <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-xs text-center border-2 border-dashed border-slate-200 rounded-xl p-4">
                        No tasks in {col.label}
                      </div>
                    ) : (
                      colTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 transition-all shadow-xs group relative space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 truncate max-w-[120px]">
                              {task.projectName || 'General'}
                            </span>

                            {/* Priority Tag Switcher */}
                            <select
                              value={task.priority || 'Medium'}
                              onChange={(e) => handlePriorityChange(task.id, e.target.value as 'Low' | 'Medium' | 'High' | 'Urgent')}
                              className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border focus:outline-none cursor-pointer ${
                                (task.priority as string) === 'P0-Critical' || task.priority === 'Urgent'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : (task.priority as string) === 'P1-High' || task.priority === 'High'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              <option value="P0-Critical">P0-Critical</option>
                              <option value="P1-High">P1-High</option>
                              <option value="P2-Medium">P2-Medium</option>
                              <option value="P3-Low">P3-Low</option>
                            </select>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                            {task.title}
                          </h4>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 truncate">
                              <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] flex items-center justify-center font-bold shrink-0">
                                {task.assignedTo?.substring(0, 2).toUpperCase() || 'UN'}
                              </div>
                              <span className="truncate">{task.assignedTo || 'Unassigned'}</span>
                            </div>

                            <button
                              onClick={() => {
                                setReassignModalTask(task);
                                setNewAssignee(task.assignedTo || employees[0]?.name || '');
                              }}
                              className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline shrink-0 font-semibold cursor-pointer"
                            >
                              Reassign
                            </button>
                          </div>

                          {/* Quick Stage Mover */}
                          <div className="grid grid-cols-3 gap-1 pt-1">
                            {columns
                              .filter((c) => c.id !== col.id)
                              .map((targetCol) => (
                                <button
                                  key={targetCol.id}
                                  onClick={() => {
                                    updateTaskStatus(task.id, targetCol.id as Task['status']);
                                    showToast(`Task moved to ${targetCol.label}`, 'info');
                                  }}
                                  className="text-[9px] font-bold py-1 px-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded text-center truncate border border-slate-200 transition-colors cursor-pointer"
                                  title={`Move to ${targetCol.label}`}
                                >
                                  &rarr; {targetCol.id.split(' ')[0]}
                                </button>
                              ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TIMESHEET AUDITING & APPROVAL GRID (WITH >40H FLAGS) */}
      {/* ========================================================================= */}
      {activeTab === 'timesheets' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" /> Weekly Timesheet Governance & Audit Grid
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Approve, reject, or flag billable labor. Automatic amber badges trigger for team members logging &gt; 40 hours in the current sprint.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkApprove(true)}
                disabled={selectedTimesheetIds.length === 0}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve Selected ({selectedTimesheetIds.length})
              </button>
              <button
                onClick={() => handleBulkApprove(false)}
                disabled={selectedTimesheetIds.length === 0}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject Selected
              </button>
            </div>
          </div>

          {/* Timesheets Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedTimesheetIds.length === timesheets.length && timesheets.length > 0}
                      onChange={handleSelectAllTimesheets}
                      className="rounded border-slate-300 text-blue-600"
                    />
                  </th>
                  <th className="p-3">Team Member</th>
                  <th className="p-3">Project & Deliverable</th>
                  <th className="p-3">Task Details</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Hours</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {timesheets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No timesheet entries submitted for review.
                    </td>
                  </tr>
                ) : (
                  timesheets.map((ts) => {
                    const weeklyHrs = timesheetWeeklyTotals[ts.employeeName] || 0;
                    const exceeds40 = weeklyHrs > 40;

                    return (
                      <tr key={ts.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedTimesheetIds.includes(ts.id)}
                            onChange={() => handleToggleSelectTimesheet(ts.id)}
                            className="rounded border-slate-300 text-blue-600"
                          />
                        </td>
                        <td className="p-3 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span>{ts.employeeName}</span>
                            {exceeds40 && (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-50 border border-amber-200 text-amber-700 font-bold"
                                title={`Weekly aggregate: ${weeklyHrs} hrs (>40h limit)`}
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                                {weeklyHrs}h Total
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 font-medium text-slate-700">{ts.projectName}</td>
                        <td className="p-3 text-slate-500 truncate max-w-xs">{ts.taskName || ts.description}</td>
                        <td className="p-3 text-slate-500 font-mono">{ts.date}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          {Number(ts.hours).toFixed(1)}h
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              ts.status === 'Approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : ts.status === 'Rejected'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {ts.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button
                            onClick={() => approveTimesheet(ts.id)}
                            className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 cursor-pointer"
                            title="Approve"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => rejectTimesheet(ts.id)}
                            className="p-1 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 cursor-pointer"
                            title="Reject"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. RESOURCE ALLOCATION MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'resources' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Team Bandwidth & Resource Allocation Timeline
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Active commitments and capacity utilization. Prevent engineer burnout and identify available talent for sprint assignments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resourceAllocation.map((res) => (
              <div
                key={res.id}
                className={`p-5 rounded-2xl bg-white border transition-all ${
                  res.isOverloaded
                    ? 'border-amber-400 shadow-sm'
                    : 'border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{res.name}</h3>
                    <p className="text-xs text-slate-500">{res.role} • {res.department}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                      res.isOverloaded
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {res.bandwidthPct}% Capacity
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-3 border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      res.isOverloaded ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(res.bandwidthPct, 100)}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="block text-[10px] text-slate-500 uppercase">Active Tasks</span>
                    <strong className="text-slate-900 font-mono">{res.assignedTasksCount}</strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="block text-[10px] text-slate-500 uppercase">Projects</span>
                    <strong className="text-slate-900 font-mono">{res.activeProjectsCount}</strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="block text-[10px] text-slate-500 uppercase">Weekly Hrs</span>
                    <strong className="text-slate-900 font-mono">{res.weeklyHours}h</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MILESTONE ANALYTICS (SOW % vs DEADLINE) */}
      {/* ========================================================================= */}
      {activeTab === 'milestones' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" /> Contract SOW Burn-Down & Milestone Analytics
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Real-time progress calculation of completed client deliverables against legal contract deadlines.
            </p>
          </div>

          <div className="space-y-4">
            {projectMilestones.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                        {p.client}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Budget: ₹{(p.budget / 100000).toFixed(2)}L • Manager: {p.manager}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {p.isAtRisk && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> At Risk ({p.daysLeft}d left)
                      </span>
                    )}
                    <span className="text-lg font-black font-mono text-slate-900">
                      {p.sowProgressPct}% SOW Complete
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      p.sowProgressPct >= 100
                        ? 'bg-emerald-500'
                        : p.isAtRisk
                        ? 'bg-rose-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${p.sowProgressPct}%` }}
                  />
                </div>

                {/* SOW Contract Hours Burn Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 font-mono text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 text-center">
                    <span className="block text-[10px] text-slate-500 uppercase">Contract SOW</span>
                    <strong className="text-slate-900">{p.contractedHours} hrs</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 text-center">
                    <span className="block text-[10px] text-slate-500 uppercase">Burned (Approved)</span>
                    <strong className="text-amber-600">{p.approvedHours} hrs</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 text-center">
                    <span className="block text-[10px] text-slate-500 uppercase">Remaining SOW</span>
                    <strong className="text-emerald-600">{p.remainingHours} hrs</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 text-center">
                    <span className="block text-[10px] text-slate-500 uppercase">Target Deadline</span>
                    <strong className="text-blue-600">{p.daysLeft}d left</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>Deliverables: {p.completedTasks} / {p.totalTasks} shipped</span>
                  <span>Contract SLA: {p.deadline || 'Q4 2026'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REASSIGN TASK MODAL */}
      {reassignModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Reassign Deliverable Bottleneck
            </h3>
            <p className="text-xs text-slate-500">
              Transfer &ldquo;{reassignModalTask.title}&rdquo; to a different engineer to balance sprint velocity.
            </p>

            <form onSubmit={handleReassign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Assignee</label>
                <select
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.name}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReassignModalTask(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shadow-sm"
                >
                  Confirm Reassignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ManagerCommandCenter;
