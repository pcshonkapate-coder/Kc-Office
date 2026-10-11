'use client';

import React, { useState } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { apiClient } from '../../lib/api-client';
import {
  Briefcase,
  Building,
  Calendar,
  CheckCircle2,
  DollarSign,
  FolderGit2,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';

interface UniversalCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UniversalCreateModal({ isOpen, onClose, onSuccess }: UniversalCreateModalProps) {
  const { can } = usePermissions();

  const availableTypes = [
    { id: 'lead', label: 'New Lead', icon: UserPlus, perm: 'crm.lead.create' },
    { id: 'deal', label: 'New Deal / Opportunity', icon: Briefcase, perm: 'crm.deal.create' },
    { id: 'account', label: 'New Client Account', icon: Building, perm: 'crm.account.create' },
    { id: 'project', label: 'New Project', icon: FolderGit2, perm: 'project.create' },
    { id: 'leave', label: 'Leave Request', icon: Calendar, perm: 'hr.attendance.manage' },
  ].filter((item) => can(item.perm));

  const [selectedType, setSelectedType] = useState<string>(
    availableTypes[0]?.id || 'lead'
  );
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (selectedType === 'lead') {
        await apiClient.post('/crm/leads', {
          title: formData.title || 'Untitled Lead',
          contact_name: formData.contact_name || 'Contact Person',
          email: formData.email,
          phone: formData.phone || null,
          company: formData.company || 'Enterprise Prospect',
          source: formData.source || 'WEBSITE',
          estimated_value: Number(formData.estimated_value || 0),
        });
        setSuccessMsg('Lead recorded successfully in CRM pipeline.');
      } else if (selectedType === 'account') {
        await apiClient.post('/crm/accounts', {
          name: formData.name,
          industry: formData.industry || 'Technology',
          website: formData.website || null,
          tier: formData.tier || 'GROWTH',
          status: 'ACTIVE',
        });
        setSuccessMsg('Client Profile created in Client 360 directory.');
      } else if (selectedType === 'project') {
        await apiClient.post('/projects', {
          project_code: formData.project_code || 'KC-PRJ',
          name: formData.name,
          description: formData.description || 'Enterprise delivery initiative',
          billing_type: formData.billing_type || 'FIXED_PRICE',
          total_budget: Number(formData.total_budget || 0),
          start_date: formData.start_date || new Date().toISOString().split('T')[0],
          target_end_date: formData.target_end_date || new Date().toISOString().split('T')[0],
          tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()) : [],
        });
        setSuccessMsg('Project created successfully with automated health tracking.');
      } else if (selectedType === 'leave') {
        await apiClient.post('/workforce/leaves', {
          leave_type: formData.leave_type || 'CASUAL',
          start_date: formData.start_date,
          end_date: formData.end_date,
          reason: formData.reason || 'Personal leave request',
        });
        setSuccessMsg('Leave request submitted for managerial approval.');
      }

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(
        err.response?.data?.detail?.message ||
          err.response?.data?.detail ||
          'Failed to complete operation. Please verify input fields.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Universal Create</h3>
            <p className="text-xs text-slate-500">Context-Aware Creation Hub</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Entity Selector Tabs */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
          {availableTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  setSelectedType(type.id);
                  setFormData({});
                  setError(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {selectedType === 'lead' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Acme Innovations"
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Title / Requirement</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Custom AI Copilot System"
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Name</label>
                  <input
                    required
                    type="text"
                    placeholder="John Doe"
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
                  <input
                    required
                    type="email"
                    placeholder="john@acme.com"
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Value (₹)</label>
                <input
                  type="number"
                  placeholder="500000"
                  onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </>
          )}

          {selectedType === 'account' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account / Client Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Nexus Technologies Ltd"
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Industry</label>
                  <input
                    type="text"
                    defaultValue="Technology"
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client Tier</label>
                  <select
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="GROWTH">GROWTH</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                    <option value="STARTUP">STARTUP</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {selectedType === 'project' && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project Code</label>
                  <input
                    required
                    type="text"
                    placeholder="KC-AI-01"
                    onChange={(e) => setFormData({ ...formData, project_code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none uppercase font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Enterprise AI Data Migration"
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Type</label>
                  <select
                    onChange={(e) => setFormData({ ...formData, billing_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none"
                  >
                    <option value="FIXED_PRICE">Fixed Price</option>
                    <option value="TIME_AND_MATERIALS">Time & Materials</option>
                    <option value="RETAINER">Retainer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Budget (₹)</label>
                  <input
                    type="number"
                    placeholder="1500000"
                    onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    required
                    type="date"
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target End Date</label>
                  <input
                    required
                    type="date"
                    onChange={(e) => setFormData({ ...formData, target_end_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {selectedType === 'leave' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Leave Category</label>
                <select
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none"
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Medical / Sick Leave</option>
                  <option value="PAID">Paid Time Off</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    required
                    type="date"
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    required
                    type="date"
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide context for manager approval..."
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none"
                />
              </div>
            </>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer transition-all"
            >
              {isSubmitting ? 'Creating...' : 'Create Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
