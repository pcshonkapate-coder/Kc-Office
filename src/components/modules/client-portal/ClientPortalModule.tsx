"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import {
  CheckCircle2, Clock, FileText, Receipt, Lock, ShieldCheck,
  AlertCircle, Check, ArrowRight, Eye, Sparkles, Send
} from 'lucide-react';
import { TaskStatus } from '../../../types';

export const ClientPortalModule: React.FC = () => {
  const projects = useDemoStore((state) => state.projects);
  const invoices = useDemoStore((state) => state.invoices);
  const documents = useDemoStore((state) => state.documents);
  const tasks = useDemoStore((state) => state.tasks);
  const updateTaskStatus = useDemoStore((state) => state.updateTaskStatus);
  const showToast = useDemoStore((state) => state.showToast);

  const [filterMode, setFilterMode] = useState<'PENDING' | 'COMPLETED' | 'ALL'>('PENDING');

  const clientProject = projects[0] || {
    id: 'PRJ-MAIN',
    name: 'Client Engineering Engagement',
    client: 'Enterprise Client Workspace',
    progress: 0,
    status: 'Active',
    spentBudget: '₹0.0L',
    totalBudget: '₹0.0L',
    milestones: []
  };

  // Filter tasks visible to or assigned to client
  const clientTasks = tasks.filter(
    (t) =>
      t.clientVisible === true ||
      t.assigneeRole === 'CLIENT' ||
      t.assignedTo?.toLowerCase().includes('client')
  );

  const pendingClientTasks = clientTasks.filter((t) => t.status !== 'COMPLETED');
  const completedClientTasks = clientTasks.filter((t) => t.status === 'COMPLETED');

  const displayedTasks =
    filterMode === 'PENDING'
      ? pendingClientTasks
      : filterMode === 'COMPLETED'
      ? completedClientTasks
      : clientTasks;

  const handleApproveTask = (taskId: string, title: string) => {
    updateTaskStatus(taskId, 'COMPLETED');
    showToast(`Approved & signed off on: "${title}"`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 mb-1 uppercase tracking-wider">
            <Lock className="w-4 h-4" /> Client Portal — Isolated Enterprise Workspace
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {clientProject.client || 'Enterprise Client Workspace'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authorized project milestones, client action items, approvals, invoices, and SLA deliverables
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Strict Privacy & Governance Active</span>
          </div>
        </div>
      </div>

      {/* PROJECT PROGRESS OVERVIEW */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-blue-600 font-bold">{clientProject.id}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                {clientProject.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{clientProject.name}</h2>
          </div>
          <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-bold font-mono text-xs border border-emerald-200">
            {clientProject.progress}% Milestone Delivery
          </span>
        </div>

        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${clientProject.progress}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 text-[10px] block">Action Items Pending</span>
            <span className="text-base font-bold font-mono text-amber-600">
              {pendingClientTasks.length} Required
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 text-[10px] block">Approved Deliverables</span>
            <span className="text-base font-bold font-mono text-emerald-600">
              {completedClientTasks.length} Signed Off
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 text-[10px] block">Project Milestones</span>
            <span className="text-base font-bold font-mono text-blue-600">
              {clientProject.milestones?.length || 3} Active
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 text-[10px] block">Authorized Invoices</span>
            <span className="text-base font-bold font-mono text-slate-900">
              {invoices.length} Invoices
            </span>
          </div>
        </div>
      </div>

      {/* CLIENT ACTION ITEMS & APPROVALS SECTION */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Client Action Items & Pending Approvals
              </h3>
              {pendingClientTasks.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                  {pendingClientTasks.length} Action Needed
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Deliverables and technical inputs requiring your sign-off or authorization
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setFilterMode('PENDING')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterMode === 'PENDING'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Action Required ({pendingClientTasks.length})
            </button>
            <button
              onClick={() => setFilterMode('COMPLETED')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterMode === 'COMPLETED'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Signed Off ({completedClientTasks.length})
            </button>
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterMode === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({clientTasks.length})
            </button>
          </div>
        </div>

        {/* Action Items List */}
        {displayedTasks.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="font-bold text-slate-800">All Client Action Items Completed!</div>
            <p className="text-slate-500 mt-1">There are no pending items awaiting your review at this time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedTasks.map((t) => {
              const isCompleted = t.status === 'COMPLETED';

              return (
                <div
                  key={t.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isCompleted
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-white border-amber-200 shadow-xs hover:border-amber-300'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-blue-600">{t.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          t.priority === 'Urgent'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : t.priority === 'High'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {t.priority}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {t.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Due: {t.dueDate}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm">{t.title}</h4>
                    
                    {t.description && (
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {t.description}
                      </p>
                    )}

                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>Project: <strong className="text-slate-700">{t.projectName}</strong></span>
                      <span>•</span>
                      <span>Assigned Recipient: <strong className="text-slate-700">{t.assignedTo}</strong></span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="shrink-0 flex items-center gap-2">
                    {isCompleted ? (
                      <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Signed Off & Approved</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApproveTask(t.id, t.title)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Sign-Off & Approve</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MILESTONES PROGRESS */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          Project Delivery Milestones
        </h3>
        {clientProject.milestones && clientProject.milestones.length > 0 ? (
          <div className="space-y-3">
            {clientProject.milestones.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  {m.progress === 100 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-600" />
                  )}
                  <div>
                    <div className="font-semibold text-slate-900">{m.name}</div>
                    <div className="text-[11px] text-slate-500">Target Date: {m.dueDate}</div>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold border ${
                    m.progress === 100
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {m.progress}% Completed
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-1">
            <Clock className="w-6 h-6 text-slate-300 mx-auto" />
            <div className="text-xs font-bold text-slate-700">No Delivery Milestones Scheduled</div>
            <div className="text-[11px] text-slate-400">Milestones added to your project will appear here with real-time completion tracking.</div>
          </div>
        )}
      </div>

      {/* DOCUMENTS & INVOICES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Authorized Client Documents
          </h3>
          {documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((d) => (
                <div
                  key={d.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-slate-900">{d.title}</span>
                  </div>
                  <span className="text-slate-500 text-[11px] font-mono">{d.size}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-1">
              <FileText className="w-5 h-5 text-slate-300 mx-auto" />
              <div className="text-xs font-semibold text-slate-600">No Documents Uploaded</div>
              <div className="text-[11px] text-slate-400">Contracts, NDAs, and project briefs will be listed here.</div>
            </div>
          )}
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            Client Invoices & Statements
          </h3>
          {invoices.length > 0 ? (
            <div className="space-y-2">
              {invoices.map((i) => (
                <div
                  key={i.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
                >
                  <div>
                    <div className="font-bold text-slate-900 font-mono">{i.id}</div>
                    <div className="text-[11px] text-slate-500">Due: {i.dueDate} • {i.status}</div>
                  </div>
                  <span className="font-mono font-bold text-emerald-600">
                    ₹{(i.total / 100000).toFixed(2)}L
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-1">
              <Receipt className="w-5 h-5 text-slate-300 mx-auto" />
              <div className="text-xs font-semibold text-slate-600">No Invoices Issued</div>
              <div className="text-[11px] text-slate-400">Settled receipts and active tax invoices will appear here.</div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 text-xs text-center font-mono flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-slate-500" />
        <span>Employee Salaries, Internal Operating Costs, Gross Margins, and Private HR Notes are hidden from Client View.</span>
      </div>

    </div>
  );
};
