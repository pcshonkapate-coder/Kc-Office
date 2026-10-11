'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { usePermissions } from '../../../hooks/usePermissions';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileCheck2,
  FileText,
  Filter,
  Flag,
  Inbox,
  Layers,
  Receipt,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';

export default function UniversalApprovalsPage() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [rejectionModalItem, setRejectionModalItem] = useState<any>(null);
  const [rejectionNotes, setRejectionNotes] = useState('');

  // Fetch pending approvals
  const { data: approvals = [], isLoading, refetch } = useQuery({
    queryKey: ['approvals', 'pending'],
    queryFn: async () => {
      const { data } = await apiClient.get('/approvals');
      return data;
    },
  });

  // Action Mutation
  const actionMutation = useMutation({
    mutationFn: async ({
      entityType,
      itemId,
      action,
      notes,
    }: {
      entityType: string;
      itemId: string;
      action: 'APPROVE' | 'REJECT';
      notes?: string;
    }) => {
      const { data } = await apiClient.post(`/approvals/${entityType}/${itemId}/action`, {
        action,
        decision_notes: notes,
      });
      return data;
    },
    onSuccess: () => {
      setRejectionModalItem(null);
      setRejectionNotes('');
      queryClient.invalidateQueries({ queryKey: ['approvals', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'ceo-command-center'] });
    },
  });

  const filteredItems = approvals.filter((item: any) => {
    if (filterType === 'ALL') return true;
    return item.entity_type === filterType;
  });

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'EXPENSE':
        return <Receipt className="w-4 h-4 text-emerald-600" />;
      case 'LEAVE':
        return <Calendar className="w-4 h-4 text-indigo-600" />;
      case 'INVOICE':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'MILESTONE':
        return <Flag className="w-4 h-4 text-amber-600" />;
      default:
        return <Inbox className="w-4 h-4 text-slate-600" />;
    }
  };

  const getEntityBadge = (type: string) => {
    switch (type) {
      case 'EXPENSE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'LEAVE':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'INVOICE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'MILESTONE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-xs">
              <FileCheck2 className="w-5 h-5" />
            </div>
            Universal Managerial Inbox
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Unified authorization center for operating expenses, leave requests, invoice releases, and milestone sign-offs
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-slate-700 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>Pending Governance Review: <strong>{approvals.length}</strong></span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {['ALL', 'EXPENSE', 'LEAVE', 'INVOICE', 'MILESTONE'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterType(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterType === tab
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
          >
            {tab === 'ALL'
              ? `All Inquiries (${approvals.length})`
              : tab === 'EXPENSE'
              ? `Expenses (${approvals.filter((a: any) => a.entity_type === 'EXPENSE').length})`
              : tab === 'LEAVE'
              ? `Leaves (${approvals.filter((a: any) => a.entity_type === 'LEAVE').length})`
              : tab === 'INVOICE'
              ? `Invoices (${approvals.filter((a: any) => a.entity_type === 'INVOICE').length})`
              : `Milestones (${approvals.filter((a: any) => a.entity_type === 'MILESTONE').length})`}
          </button>
        ))}
      </div>

      {/* Pending Items List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-xs">
          Loading pending authorization requests...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white border border-slate-200 rounded-2xl max-w-lg mx-auto my-8 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">All Clear! No Pending Approvals</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            You have responded to all managerial requests. All current operational workflows are up to date and in full compliance.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item: any) => (
            <div
              key={item.id}
              className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-xs"
            >
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 shrink-0 mt-0.5">
                  {getEntityIcon(item.entity_type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase font-medium ${getEntityBadge(item.entity_type)}`}>
                      {item.entity_type}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  </div>
                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>
                      Requested by: <strong className="text-slate-800">{item.submitter_name}</strong>
                    </span>
                    <span>•</span>
                    <span className="font-mono text-emerald-600 font-semibold">{item.amount_or_duration}</span>
                    {item.details && (
                      <>
                        <span>•</span>
                        <span className="text-slate-600">{item.details}</span>
                      </>
                    )}
                    <span>•</span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {new Date(item.requested_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                <button
                  onClick={() =>
                    actionMutation.mutate({
                      entityType: item.entity_type,
                      itemId: item.id,
                      action: 'APPROVE',
                    })
                  }
                  disabled={actionMutation.isPending}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-40 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>

                <button
                  onClick={() => setRejectionModalItem(item)}
                  disabled={actionMutation.isPending}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectionModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Provide Rejection Rationale</h3>
                <span className="text-xs text-rose-600 font-mono">{rejectionModalItem.title}</span>
              </div>
              <button onClick={() => setRejectionModalItem(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Rejection / Correction Instructions
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Budget cap exceeded, please attach vendor receipt, or reschedule dates..."
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-rose-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  onClick={() => setRejectionModalItem(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    actionMutation.mutate({
                      entityType: rejectionModalItem.entity_type,
                      itemId: rejectionModalItem.id,
                      action: 'REJECT',
                      notes: rejectionNotes,
                    })
                  }
                  disabled={!rejectionNotes.trim() || actionMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-40"
                >
                  {actionMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
