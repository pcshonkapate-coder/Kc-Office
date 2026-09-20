"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import { UserRole, AccountStatus } from '../../../types';
import {
  Shield, ShieldCheck, ShieldAlert, KeyRound, UserCheck, UserX,
  Users2, UserPlus, Copy, CheckCircle2, Clock, AlertTriangle,
  RotateCcw, Lock, ArrowUpRight, Search, Filter, Ban, Check, Sparkles,
  RefreshCw, X
} from 'lucide-react';

export const SecurityDashboard: React.FC = () => {
  const currentUser = useDemoStore((state) => state.currentUser);
  const registrationRequests = useDemoStore((state) => state.registrationRequests);
  const onboardingInvitations = useDemoStore((state) => state.onboardingInvitations);
  const securityEvents = useDemoStore((state) => state.securityEvents);
  const employees = useDemoStore((state) => state.employees);
  const interns = useDemoStore((state) => state.interns);
  const setOnboardModalOpen = useDemoStore((state) => state.setOnboardModalOpen);

  const fetchRegistrationRequests = useDemoStore((state) => state.fetchRegistrationRequests);
  const approveRegistrationRequest = useDemoStore((state) => state.approveRegistrationRequest);
  const rejectRegistrationRequest = useDemoStore((state) => state.rejectRegistrationRequest);
  const revokeInvitation = useDemoStore((state) => state.revokeInvitation);
  const changeUserRole = useDemoStore((state) => state.changeUserRole);
  const changeUserStatus = useDemoStore((state) => state.changeUserStatus);

  const [activeTab, setActiveTab] = useState<'requests' | 'invitations' | 'access' | 'audit'>('requests');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync registration requests from server on mount
  React.useEffect(() => {
    fetchRegistrationRequests().catch(() => {});
  }, [fetchRegistrationRequests]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRegistrationRequests().finally(() => setIsRefreshing(false));
  };

  // Approval modal state
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [approvalRole, setApprovalRole] = useState<UserRole>('EMPLOYEE');
  const [approvalDept, setApprovalDept] = useState('Engineering');
  const [approvalManager, setApprovalManager] = useState(employees[0]?.name || 'Shon Kapate');
  const [approvalDesignation, setApprovalDesignation] = useState('Software Engineer');
  const [approvalEmpType, setApprovalEmpType] = useState<'EMPLOYEE' | 'INTERN' | 'FREELANCER'>('EMPLOYEE');
  const [approvalPassword, setApprovalPassword] = useState('Kapate@2026!Secured');
  const [isApproving, setIsApproving] = useState(false);

  // Credential handover state
  const [approvedCredentials, setApprovedCredentials] = useState<any>(null);
  const [isApprovedModalOpen, setIsApprovedModalOpen] = useState(false);
  const [copiedApproved, setCopiedApproved] = useState(false);

  // Role edit modal state
  const [selectedUserToEdit, setSelectedUserToEdit] = useState<any>(null);
  const [newRole, setNewRole] = useState<UserRole>('EMPLOYEE');
  const [confirmPrivilege, setConfirmPrivilege] = useState(false);

  // Copied token state
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // Aggregated workforce
  const allPersonnel = [
    ...employees.map(e => ({ ...e, type: 'Employee', designation: e.role, department: e.department })),
    ...interns.map(i => ({ ...i, type: 'Intern', designation: i.role, department: 'AI/ML', status: i.status === 'Active' ? 'Active' : 'Inactive', manager: i.mentor }))
  ];

  const pendingRequests = registrationRequests.filter(r => r.status === 'PENDING');
  const activeInvitations = onboardingInvitations.filter(i => !i.isUsed && !i.isRevoked);
  const suspendedCount = allPersonnel.filter(p => p.status === 'Inactive').length;

  const handleOpenApproveModal = (req: any) => {
    setSelectedRequest(req);
    setApprovalEmpType(req.requestedType || 'EMPLOYEE');
    if (req.requestedType === 'INTERN') {
      setApprovalRole('INTERN');
      setApprovalDesignation('AI/ML Research Intern');
      setApprovalDept('AI/ML');
    } else {
      setApprovalRole('EMPLOYEE');
      setApprovalDesignation('Backend Developer');
      setApprovalDept('Engineering');
    }
    setApprovalManager(employees[0]?.name || 'Shon Kapate');
  };

  const handleConfirmApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setIsApproving(true);
    try {
      const res = await approveRegistrationRequest(
        selectedRequest.id,
        approvalRole,
        approvalDept,
        approvalManager,
        approvalDesignation,
        approvalEmpType,
        approvalPassword
      );
      setSelectedRequest(null);
      if (res && res.credentials) {
        setApprovedCredentials(res.credentials);
        setIsApprovedModalOpen(true);
      }
    } finally {
      setIsApproving(false);
    }
  };

  const handleCopyApprovedCredentials = () => {
    if (!approvedCredentials) return;
    const portalUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const text = `🏢 Kapate OS — Personnel Access Credentials\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Employee Name   : ${approvedCredentials.name}\n` +
      `User ID         : ${approvedCredentials.kapateId}\n` +
      `Login Email     : ${approvedCredentials.email}\n` +
      `Initial Password: ${approvedCredentials.initialPassword}\n` +
      `Role / Dept     : ${approvedCredentials.role || approvalRole} (${approvedCredentials.department || approvalDept})\n` +
      `Login Portal    : ${portalUrl}/\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Note: You can log in using either your Corporate Email or your User ID.`;

    navigator.clipboard.writeText(text);
    setCopiedApproved(true);
    setTimeout(() => setCopiedApproved(false), 2500);
  };

  const handleConfirmRoleChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserToEdit) return;
    changeUserRole(selectedUserToEdit.id, newRole);
    setSelectedUserToEdit(null);
  };

  const handleCopyLink = (token: string, id: string) => {
    const link = `${window.location.origin}/invite?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedTokenId(id);
    setTimeout(() => setCopiedTokenId(null), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Security Kernel Active
            </span>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Server-Side RBAC
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
            Security & Identity Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Zero-trust personnel onboarding, atomic Kapate IDs, cryptographic invitations, and role management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Requests'}</span>
          </button>
          <button
            onClick={() => setOnboardModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Onboard Team Personnel
          </button>
        </div>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Users2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{allPersonnel.length}</div>
            <div className="text-xs text-slate-500 font-semibold">Active Staff Profiles</div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{pendingRequests.length}</div>
            <div className="text-xs text-slate-500 font-semibold">Pending Requests</div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{activeInvitations.length}</div>
            <div className="text-xs text-slate-500 font-semibold">Active Invitations</div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{securityEvents.length}</div>
            <div className="text-xs text-slate-500 font-semibold">Security Audit Events</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'requests' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> Registration Queue ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'invitations' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" /> Active Invitations ({activeInvitations.length})
          </button>
          <button
            onClick={() => setActiveTab('access')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'access' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Access & Roles ({allPersonnel.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Audit Log ({securityEvents.length})
          </button>
        </div>
      </div>

      {/* TAB 1: REGISTRATION REQUESTS */}
      {activeTab === 'requests' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Pending Registration Requests</h2>
              <p className="text-xs text-slate-500">Applicants submitted via /register. Roles and permissions are assigned upon approval.</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Status: PENDING ADMIN REVIEW</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                  <th className="pb-3 font-semibold">Applicant</th>
                  <th className="pb-3 font-semibold">Contact Email</th>
                  <th className="pb-3 font-semibold">Application ID</th>
                  <th className="pb-3 font-semibold">Requested Type</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrationRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 font-bold text-slate-900">
                      <div>{req.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{req.notes}</div>
                    </td>
                    <td className="py-3.5 font-mono text-slate-600">{req.email}</td>
                    <td className="py-3.5 font-mono text-blue-600 font-semibold">{req.applicationId}</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        req.requestedType === 'INTERN' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {req.requestedType}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        req.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenApproveModal(req)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" /> Approve & Issue Invite
                          </button>
                          <button
                            onClick={() => rejectRegistrationRequest(req.id, 'Does not meet current requirements')}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 font-semibold text-xs transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE INVITATIONS */}
      {activeTab === 'invitations' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Active Single-Use Onboarding Invitations</h2>
              <p className="text-xs text-slate-500">Cryptographically hashed single-use tokens valid for 72 hours.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {onboardingInvitations.map((inv) => (
              <div
                key={inv.id}
                className={`p-5 rounded-2xl border transition-all ${
                  inv.isUsed ? 'bg-slate-50/80 border-slate-200 opacity-60' :
                  inv.isRevoked ? 'bg-red-50/40 border-red-200 opacity-60' :
                  'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center font-bold text-white text-xs">
                      {inv.fullName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{inv.fullName}</h3>
                      <div className="text-xs text-blue-600 font-medium">{inv.designation}</div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    inv.isUsed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    inv.isRevoked ? 'bg-red-50 text-red-700 border border-red-200' :
                    'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {inv.isUsed ? 'Accepted & Active' : inv.isRevoked ? 'Revoked' : 'Pending Activation'}
                  </span>
                </div>

                <div className="my-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[11px]">Kapate ID:</span>
                    <span className="font-mono font-bold text-slate-900">{inv.kapateId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[11px]">Corporate Email:</span>
                    <span className="font-mono font-bold text-blue-600">{inv.internalEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[11px]">Assigned Role:</span>
                    <span className="font-bold text-emerald-700">{inv.assignedRole}</span>
                  </div>
                </div>

                {!inv.isUsed && !inv.isRevoked && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleCopyLink(inv.token, inv.id)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedTokenId === inv.id ? 'Copied URL!' : 'Copy Invite Link'}
                    </button>

                    <button
                      onClick={() => revokeInvitation(inv.id)}
                      className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                    >
                      Revoke Token
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: WORKFORCE IDENTITY & ACCESS CONTROL */}
      {activeTab === 'access' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Personnel Identity & System Roles</h2>
              <p className="text-xs text-slate-500">Separation of professional designation from authorization role.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                  <th className="pb-3 font-semibold">Personnel & Kapate ID</th>
                  <th className="pb-3 font-semibold">Corporate Email</th>
                  <th className="pb-3 font-semibold">Designation</th>
                  <th className="pb-3 font-semibold">System Role (RBAC)</th>
                  <th className="pb-3 font-semibold">Department</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allPersonnel.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 font-bold text-slate-900">
                      <div>{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.kapateId || `KAP-EMP-00000${p.id.slice(-2)}`}</div>
                    </td>
                    <td className="py-3.5 font-mono text-blue-600 text-[11px]">{p.email}</td>
                    <td className="py-3.5 font-medium text-slate-700">{p.role || p.designation}</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.type === 'Intern' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        p.name.includes('Amit') ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        p.name.includes('Shon') ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {p.name.includes('Shon') ? 'ADMIN' : p.name.includes('Amit') ? 'PROJECT_MANAGER' : p.type === 'Intern' ? 'INTERN' : 'EMPLOYEE'}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-600">{p.department || 'Engineering'}</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUserToEdit(p);
                          setNewRole(p.type === 'Intern' ? 'INTERN' : 'EMPLOYEE');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        Edit Role
                      </button>
                      <button
                        onClick={() => changeUserStatus(p.id, p.status === 'Active' ? 'SUSPENDED' : 'ACTIVE')}
                        className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer ${
                          p.status === 'Active' ? 'bg-red-50 hover:bg-red-100 text-red-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {p.status === 'Active' ? 'Suspend' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: IMMUTABLE AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Security Audit Ledger</h2>
              <p className="text-xs text-slate-500">Immutable ledger recording all onboarding, role modifications, and privilege verifications.</p>
            </div>
            <span className="text-xs font-mono text-emerald-600 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live Stream
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {securityEvents.map((evt) => (
              <div key={evt.id} className="py-3 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      evt.severity === 'alert' ? 'bg-red-50 text-red-700 border border-red-200' :
                      evt.severity === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {evt.action}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{evt.actor}</span>
                    <span className="text-xs text-slate-400">→</span>
                    <span className="text-xs font-semibold text-slate-700">{evt.target}</span>
                  </div>
                  <div className="text-xs text-slate-500">{evt.details}</div>
                </div>
                <div className="text-[11px] font-mono text-slate-400 shrink-0">{evt.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* APPROVAL MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Approve & Issue Invitation</h3>
                <p className="text-xs text-slate-500">Assign role and provision corporate credentials for {selectedRequest.fullName}</p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-slate-600">
                <Ban className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmApproval} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Designation (Professional Title)</label>
                <input
                  type="text"
                  required
                  value={approvalDesignation}
                  onChange={(e) => setApprovalDesignation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned System Role</label>
                  <select
                    value={approvalRole}
                    onChange={(e) => setApprovalRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="INTERN">INTERN</option>
                    <option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
                    <option value="HR_ADMIN">HR_ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={approvalDept}
                    onChange={(e) => setApprovalDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="AI/ML">AI/ML</option>
                    <option value="Data">Data</option>
                    <option value="Design">Design</option>
                    <option value="Sales">Sales</option>
                    <option value="Finance">Finance</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Manager / Mentor</label>
                <select
                  value={approvalManager}
                  onChange={(e) => setApprovalManager(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name} ({emp.role})</option>
                  ))}
                  <option value="Shon Kapate">Shon Kapate (Founder & CEO)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Set Account Password</label>
                <input
                  type="text"
                  value={approvalPassword}
                  onChange={(e) => setApprovalPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Employee can sign in immediately with this password (or their registration password).
                </span>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-blue-600" /> Automated Credential Generation</div>
                <div>System will generate an atomic Kapate ID and corporate email <strong className="font-mono">{selectedRequest.fullName.split(' ')[0].toLowerCase()}@kapateconsultancy.in</strong>.</div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isApproving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {isApproving ? 'Provisioning...' : 'Approve & Issue Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROLE MODAL */}
      {selectedUserToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900">Change Role: {selectedUserToEdit.name}</h3>
              <button onClick={() => setSelectedUserToEdit(null)} className="text-slate-400 hover:text-slate-600">
                <Ban className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRoleChange} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">New System Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                >
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="INTERN">INTERN</option>
                  <option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
                  <option value="HR_ADMIN">HR_ADMIN</option>
                  <option value="FINANCE_ADMIN">FINANCE_ADMIN</option>
                  <option value="ADMIN">ADMIN (Privileged)</option>
                </select>
              </div>

              {newRole === 'ADMIN' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-2">
                  <div className="font-bold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Admin Privilege Warning</div>
                  <div>Assigning administrative privileges gives unrestricted system access and will be recorded in the security audit ledger.</div>
                  <label className="flex items-center gap-2 cursor-pointer font-semibold mt-1">
                    <input
                      type="checkbox"
                      checked={confirmPrivilege}
                      onChange={(e) => setConfirmPrivilege(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    I explicitly confirm this privilege escalation
                  </label>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserToEdit(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newRole === 'ADMIN' && !confirmPrivilege}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold transition-colors"
                >
                  Confirm Role Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPROVED CREDENTIALS MODAL */}
      {isApprovedModalOpen && approvedCredentials && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Personnel Provisioned Successfully</h3>
                  <p className="text-xs text-slate-500">Corporate credentials generated & saved to database</p>
                </div>
              </div>
              <button
                onClick={() => setIsApprovedModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Account is active immediately. Give these credentials to the personnel to sign in.</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                  <span className="text-slate-500 font-medium">Full Name:</span>
                  <span className="font-bold text-slate-900">{approvedCredentials.name}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                  <span className="text-slate-500 font-medium">User ID (Kapate ID):</span>
                  <span className="font-mono font-bold text-blue-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {approvedCredentials.kapateId}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                  <span className="text-slate-500 font-medium">Login Corporate Email:</span>
                  <span className="font-mono font-bold text-slate-900">{approvedCredentials.email}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                  <span className="text-slate-500 font-medium">Initial Password:</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    {approvedCredentials.initialPassword}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Role & Department:</span>
                  <span className="font-semibold text-slate-700">
                    {approvedCredentials.role || approvalRole} • {approvedCredentials.department || approvalDept}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-[11px] text-blue-800 leading-relaxed">
                💡 <strong>Dual Login Support:</strong> Personnel can log in on the main portal using <strong>either</strong> their Corporate Email or their User ID ({approvedCredentials.kapateId}) with this password.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCopyApprovedCredentials}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {copiedApproved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Copied Credentials!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Full Credentials</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsApprovedModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
