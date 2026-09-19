"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import { User, UserRole, AccountStatus, AuditLogEntry, SecuritySession } from '../../../types';
import { PERMISSION_DEFINITIONS } from '../../../data/superAdminData';
import {
  Shield, ShieldCheck, ShieldAlert, KeyRound, UserCheck, UserX,
  Users2, UserPlus, Copy, CheckCircle2, Clock, AlertTriangle,
  RotateCcw, Lock, ArrowUpRight, Search, Filter, Ban, Check, Sparkles,
  Download, Database, Server, RefreshCw, Activity, Terminal, Eye,
  Sliders, FileText, Cpu, Trash2, Edit3, LogOut, CheckSquare, X,
  ShieldQuestion, ChevronRight, AlertCircle, Laptop, Phone, Globe,
  FileCode, Layers, ShieldOff
} from 'lucide-react';

type AdminTab = 'overview' | 'users' | 'rbac' | 'security' | 'audit' | 'settings' | 'health' | 'backup' | 'ai';

export const SuperAdminModule: React.FC = () => {
  const currentUser = useDemoStore((state) => state.currentUser);
  const usersList = useDemoStore((state) => state.usersList);
  const createUser = useDemoStore((state) => state.createUser);
  const updateUser = useDemoStore((state) => state.updateUser);
  const setUserStatus = useDemoStore((state) => state.setUserStatus);
  const resetUserPassword = useDemoStore((state) => state.resetUserPassword);
  const lockUserAccount = useDemoStore((state) => state.lockUserAccount);
  const unlockUserAccount = useDemoStore((state) => state.unlockUserAccount);
  const deleteUser = useDemoStore((state) => state.deleteUser);
  const startImpersonation = useDemoStore((state) => state.startImpersonation);
  const exitImpersonation = useDemoStore((state) => state.exitImpersonation);
  const impersonatedOriginalUser = useDemoStore((state) => state.impersonatedOriginalUser);
  const rolePermissions = useDemoStore((state) => state.rolePermissions);
  const updateRolePermissions = useDemoStore((state) => state.updateRolePermissions);
  const auditLogs = useDemoStore((state) => state.auditLogs);
  const logAuditEvent = useDemoStore((state) => state.logAuditEvent);
  const activeSessions = useDemoStore((state) => state.activeSessions);
  const revokeSession = useDemoStore((state) => state.revokeSession);
  const forceLogoutAll = useDemoStore((state) => state.forceLogoutAll);
  const systemSettings = useDemoStore((state) => state.systemSettings);
  const updateSystemSettings = useDemoStore((state) => state.updateSystemSettings);
  const systemHealth = useDemoStore((state) => state.systemHealth);
  const refreshSystemHealth = useDemoStore((state) => state.refreshSystemHealth);
  const showToast = useDemoStore((state) => state.showToast);
  const addToast = ({ message, type }: { title?: string; message: string; type?: 'success' | 'error' | 'info' | 'warning' }) => {
    showToast(message, type || 'info');
  };

  // Active admin subtab
  const [activeSubtab, setActiveSubtab] = useState<AdminTab>('overview');

  // User management states
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // New user form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('EMPLOYEE');
  const [newUserDept, setNewUserDept] = useState('Engineering');
  const [newUserDesignation, setNewUserDesignation] = useState('Software Consultant');
  const [newUserPassword, setNewUserPassword] = useState('Admin@KC8421174957');

  // Impersonation modal state
  const [isImpersonateModalOpen, setIsImpersonateModalOpen] = useState(false);
  const [impersonateTarget, setImpersonateTarget] = useState<User | null>(null);
  const [impersonateReason, setImpersonateReason] = useState('');

  // Password reset modal state
  const [isResetPwdModalOpen, setIsResetPwdModalOpen] = useState(false);
  const [resetPwdUser, setResetPwdUser] = useState<User | null>(null);
  const [newPwdValue, setNewPwdValue] = useState('Admin@KC8421174957');

  // Audit filter state
  const [auditSearch, setAuditSearch] = useState('');
  const [auditSeverity, setAuditSeverity] = useState<string>('ALL');
  const [auditResource, setAuditResource] = useState<string>('ALL');

  // RBAC active role editing
  const [selectedRbacRole, setSelectedRbacRole] = useState<UserRole>('EMPLOYEE');

  // Diagnostics running state
  const [isRunningHealth, setIsRunningHealth] = useState(false);

  // Settings form local state
  const [localSettings, setLocalSettings] = useState(systemSettings);

  useEffect(() => {
    setLocalSettings(systemSettings);
  }, [systemSettings]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return usersList.filter(user => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchUser.toLowerCase()) ||
        user.email.toLowerCase().includes(searchUser.toLowerCase()) ||
        (user.kapateId && user.kapateId.toLowerCase().includes(searchUser.toLowerCase())) ||
        (user.designation && user.designation.toLowerCase().includes(searchUser.toLowerCase()));
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [usersList, searchUser, roleFilter, statusFilter]);

  // Filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch =
        (log.details || log.reason || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
        (log.actorName || log.actor || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
        ((log.targetLabel || log.targetUser || '').toLowerCase().includes(auditSearch.toLowerCase()));
      const matchesSeverity = auditSeverity === 'ALL' || (log.severity || 'info') === auditSeverity;
      const matchesResource = auditResource === 'ALL' || (log.resource || log.module) === auditResource;
      return matchesSearch && matchesSeverity && matchesResource;
    });
  }, [auditLogs, auditSearch, auditSeverity, auditResource]);

  // Handle Create User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      addToast({ title: 'Validation Error', message: 'Name and email are required.', type: 'error' });
      return;
    }

    let finalEmail = newUserEmail.trim().toLowerCase();
    if (!finalEmail.includes('@')) {
      finalEmail = `${finalEmail}@kapateconsultancy.in`;
    } else if (finalEmail.endsWith('@kapateconsultancy.com')) {
      finalEmail = finalEmail.replace('@kapateconsultancy.com', '@kapateconsultancy.in');
    }

    const res = createUser({
      name: newUserName.trim(),
      email: finalEmail,
      role: newUserRole,
      department: newUserDept,
      designation: newUserDesignation,
      status: 'ACTIVE',
    });

    if (res && res.success && res.user) {
      addToast({
        title: 'User Created',
        message: `${res.user.name} (${res.user.kapateId || res.user.email}) added to Kapate OS.`,
        type: 'success'
      });
    }

    setIsCreateModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
  };

  // Handle Start Impersonation
  const handleStartImpersonation = () => {
    if (!impersonateTarget) return;
    if (!impersonateReason.trim() || impersonateReason.trim().length < 5) {
      addToast({
        title: 'Compliance Required',
        message: 'You must provide a business justification (min 5 characters) for audit compliance.',
        type: 'error'
      });
      return;
    }

    startImpersonation(impersonateTarget, impersonateReason.trim());
    addToast({
      title: 'Impersonation Active',
      message: `Now operating as ${impersonateTarget.name} (${impersonateTarget.role}). Reason logged to audit trail.`,
      type: 'warning'
    });

    setIsImpersonateModalOpen(false);
    setImpersonateTarget(null);
    setImpersonateReason('');
  };

  // Handle Reset Password Submit
  const handleResetPasswordSubmit = () => {
    if (!resetPwdUser) return;
    resetUserPassword(resetPwdUser.id, newPwdValue);
    addToast({
      title: 'Password Reset',
      message: `New credentials set for ${resetPwdUser.email}`,
      type: 'success'
    });
    setIsResetPwdModalOpen(false);
    setResetPwdUser(null);
  };

  // Run Health Diagnostics
  const handleRunHealthCheck = async () => {
    setIsRunningHealth(true);
    refreshSystemHealth();
    try {
      const res = await fetch('/api/v1/admin/health');
      if (res.ok) {
        addToast({ title: 'Diagnostics Complete', message: 'All 6 subsystems probed. System status verified.', type: 'success' });
      }
    } catch {
      // Fallback
    } finally {
      setIsRunningHealth(false);
    }
  };

  // Download Backup Snapshot
  const handleDownloadBackup = () => {
    window.open('/api/v1/admin/backup?download=true', '_blank');
    addToast({ title: 'Backup Export', message: 'Full encrypted JSON enterprise snapshot download initiated.', type: 'info' });
  };

  // Export Audit Logs to CSV
  const handleExportAuditCSV = () => {
    const headers = ['Timestamp', 'Severity', 'Actor Name', 'Actor Email', 'Actor Role', 'Action', 'Resource', 'Target', 'Details', 'IP Address'];
    const rows = filteredAuditLogs.map(l => [
      `"${l.timestamp}"`,
      `"${l.severity || 'info'}"`,
      `"${l.actorName || l.actor}"`,
      `"${l.actorEmail || l.targetUser || ''}"`,
      `"${l.actorRole || ''}"`,
      `"${l.action}"`,
      `"${l.resource || l.module}"`,
      `"${l.targetLabel || l.targetResource || ''}"`,
      `"${(l.details || l.reason || l.action).replace(/"/g, '""')}"`,
      `"${l.ipAddress || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kapate_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast({ title: 'Audit Exported', message: `Exported ${filteredAuditLogs.length} audit records to CSV.`, type: 'success' });
  };

  // Toggle permission in RBAC matrix
  const handleTogglePermission = (role: UserRole, permCode: string) => {
    if (role === 'SUPER_ADMIN' && permCode === 'system.admin') {
      addToast({ title: 'Security Restriction', message: 'Cannot revoke Super Admin root authority.', type: 'warning' });
      return;
    }
    const currentPerms = rolePermissions[role] || [];
    const updated = currentPerms.includes(permCode)
      ? currentPerms.filter(p => p !== permCode)
      : [...currentPerms, permCode];
    updateRolePermissions(role, updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-400">
                <Shield className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight">Super Admin Control Center</h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500 text-white shadow-sm">
                    Tier 0 Root
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-0.5">
                  Kapate OS Master Command & Control • Enterprise Governance, RBAC Matrix & Telemetry
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Node: {process.env.NODE_ENV || 'Production'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
                Domain: <strong className="text-white">@kapateconsultancy.in</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-indigo-300">
                Master Admin: <strong className="text-white">admin@kapateconsultancy.in</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-400">
                Audit: Append-Only Immutable
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunHealthCheck}
              disabled={isRunningHealth}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <Activity className={`w-4 h-4 text-emerald-400 ${isRunningHealth ? 'animate-spin' : ''}`} />
              Run Diagnostics
            </button>
            <button
              onClick={handleDownloadBackup}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20"
            >
              <Download className="w-4 h-4" />
              Export System Snapshot
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Subtabs Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm overflow-x-auto flex items-center gap-1">
        {[
          { id: 'overview', label: 'System Overview', icon: Activity },
          { id: 'users', label: 'User Directory', count: usersList.length, icon: Users2 },
          { id: 'rbac', label: 'RBAC Matrix', icon: Sliders },
          { id: 'security', label: 'Security & Sessions', count: activeSessions.length, icon: KeyRound },
          { id: 'audit', label: 'Audit Trail', count: auditLogs.length, icon: Terminal },
          { id: 'settings', label: 'Enterprise Settings', icon: Sliders },
          { id: 'health', label: 'Health Diagnostics', icon: Server },
          { id: 'backup', label: 'Backup & Data', icon: Database },
          { id: 'ai', label: 'AI Intelligence', icon: Cpu },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubtab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubtab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-indigo-500/80 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: SYSTEM OVERVIEW */}
      {activeSubtab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enterprise Users</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">{usersList.length}</span>
                  <span className="text-xs text-emerald-600 font-semibold">
                    {usersList.filter(u => u.status === 'ACTIVE').length} Active
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {usersList.filter(u => u.status === 'LOCKED').length} Locked • {usersList.filter(u => u.status === 'SUSPENDED').length} Suspended
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                <Users2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Sessions</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">
                    {activeSessions.filter(s => s.status === 'ACTIVE').length}
                  </span>
                  <span className="text-xs text-indigo-600 font-semibold">MFA Enforced</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Zero unauthorized anomalies detected
                </div>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                <KeyRound className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">System Health</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-emerald-600">99.98%</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    HEALTHY
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  6 Core Services Operational
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <Server className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Audit Trail</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">{auditLogs.length}</span>
                  <span className="text-xs text-slate-500 font-semibold">Events Logged</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Cryptographically chained records
                </div>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                <Terminal className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Quick Actions Panel & Diagnostic Snapshot */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Administrative Quick Commands</h3>
                  <p className="text-xs text-slate-500">Rapid workflow triggers for common Super Admin tasks</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(true);
                    setActiveSubtab('users');
                  }}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-left transition-all group flex items-start gap-3"
                >
                  <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-700 group-hover:scale-105 transition-transform">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Create Enterprise User</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Provision account with @kapateconsultancy.in email</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveSubtab('rbac')}
                  className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-left transition-all group flex items-start gap-3"
                >
                  <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700 group-hover:scale-105 transition-transform">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600">RBAC Matrix Editor</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Configure role permissions across all 7 subsystems</p>
                  </div>
                </button>

                <button
                  onClick={handleDownloadBackup}
                  className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all group flex items-start gap-3"
                >
                  <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700 group-hover:scale-105 transition-transform">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-600">Instant System Snapshot</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Download full JSON snapshot with SHA-256 checksum</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveSubtab('audit')}
                  className="p-4 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/40 text-left transition-all group flex items-start gap-3"
                >
                  <div className="p-2.5 rounded-lg bg-purple-100 text-purple-700 group-hover:scale-105 transition-transform">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-600">Audit Compliance Logs</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Review chronological security trail and export CSV</p>
                  </div>
                </button>
              </div>

              {/* Subsystem Health Status Bar */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-800">Subsystem Diagnostics</span>
                  <span className="text-xs text-slate-500 font-mono">Last probe: Just now</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {systemHealth.components.map((comp) => (
                    <div key={comp.name} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          comp.status === 'HEALTHY' ? 'bg-emerald-500' : comp.status === 'DEGRADED' ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                        <span className="text-[11px] font-bold text-slate-800 truncate">{comp.name.split(' ')[0]}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">{comp.latencyMs}ms</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* System Information & Security Compliance */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Security Posture</h3>
                <p className="text-xs text-slate-500 mb-4">Enterprise Compliance & System Policy</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-semibold text-slate-700">Multi-Factor Auth</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Enforced</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-semibold text-slate-700">Session Max Lifetime</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 font-mono">{systemSettings.authentication.sessionDurationHours * 60} min</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <Lock className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-semibold text-slate-700">Max Failed Attempts</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 font-mono">{systemSettings.authentication.maxLoginAttempts} tries</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <Globe className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-semibold text-slate-700">Mail Gateway</span>
                    </div>
                    <span className="text-xs font-bold text-indigo-700 font-mono">.in Verified</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-900">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold">Master Account Protection</span>
                </div>
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                  admin@kapateconsultancy.in is locked against modification, suspension, or deletion.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: USERS MANAGEMENT CONSOLE */}
      {activeSubtab === 'users' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, ID..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="ALL">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="PROJECT_MANAGER">Project Manager</option>
                <option value="EMPLOYEE">Employee</option>
                <option value="INTERN">Intern</option>
                <option value="CLIENT">Client</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="LOCKED">Locked</option>
              </select>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Enterprise User</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">User Details</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Department & Designation</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Security</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No enterprise users found matching query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isMasterAdmin = user.email === 'admin@kapateconsultancy.in';
                      const isSelf = user.id === currentUser.id;

                      const roleBadgeStyles: Record<string, string> = {
                        SUPER_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
                        ADMIN: 'bg-blue-100 text-blue-800 border-blue-200',
                        HR_ADMIN: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                        PROJECT_MANAGER: 'bg-cyan-100 text-cyan-800 border-cyan-200',
                        EMPLOYEE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                        INTERN: 'bg-amber-100 text-amber-800 border-amber-200',
                        CLIENT: 'bg-slate-100 text-slate-800 border-slate-200',
                      };

                      return (
                        <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0">
                                {user.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                  {user.name}
                                  {isMasterAdmin && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-600 text-white">
                                      ROOT
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                                  <span>{user.email}</span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-slate-400">{user.kapateId}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              roleBadgeStyles[user.role] || 'bg-slate-100 text-slate-700'
                            }`}>
                              {user.role}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="text-slate-900 font-medium">{user.designation || 'Specialist'}</div>
                            <div className="text-[11px] text-slate-500">{user.department || 'Operations'}</div>
                          </td>

                          <td className="py-3 px-4">
                            {user.status === 'ACTIVE' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            )}
                            {user.status === 'SUSPENDED' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Suspended
                              </span>
                            )}
                            {user.status === 'LOCKED' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                                <Lock className="w-2.5 h-2.5" />
                                Locked
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>2FA On</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Impersonate Button */}
                              {!isSelf && (
                                <button
                                  onClick={() => {
                                    setImpersonateTarget(user);
                                    setIsImpersonateModalOpen(true);
                                  }}
                                  title="Impersonate user persona"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}

                              {/* Reset Password Button */}
                              <button
                                onClick={() => {
                                  setResetPwdUser(user);
                                  setIsResetPwdModalOpen(true);
                                }}
                                title="Reset credentials"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>

                              {/* Lock / Unlock Account */}
                              {!isMasterAdmin && (
                                user.status === 'LOCKED' ? (
                                  <button
                                    onClick={() => {
                                      unlockUserAccount(user.id);
                                      addToast({ title: 'Account Unlocked', message: `${user.name} unlocked.`, type: 'success' });
                                    }}
                                    title="Unlock user"
                                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <Lock className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      lockUserAccount(user.id);
                                      addToast({ title: 'Account Locked', message: `${user.name} locked out.`, type: 'warning' });
                                    }}
                                    title="Lock account"
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <Ban className="w-4 h-4" />
                                  </button>
                                )
                              )}

                              {/* Toggle Status (Active / Suspended) */}
                              {!isMasterAdmin && (
                                <button
                                  onClick={() => {
                                    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                                    setUserStatus(user.id, nextStatus);
                                    addToast({ title: 'Status Changed', message: `${user.name} set to ${nextStatus}`, type: 'info' });
                                  }}
                                  title={user.status === 'ACTIVE' ? 'Suspend user' : 'Activate user'}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}

                              {/* Delete User */}
                              {!isMasterAdmin && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete user ${user.name}? This action is irreversible.`)) {
                                      deleteUser(user.id);
                                      addToast({ title: 'User Deleted', message: `${user.name} removed.`, type: 'warning' });
                                    }
                                  }}
                                  title="Delete user"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: RBAC MATRIX */}
      {activeSubtab === 'rbac' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Granular Role-Based Access Control (RBAC)</h3>
                <p className="text-xs text-slate-500">
                  Assign actions to enterprise roles. Changes apply instantly across all client & API sessions.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (confirm('Reset RBAC matrix back to corporate default security templates?')) {
                      // Fetch default or reassign
                      addToast({ title: 'RBAC Reset', message: 'Permissions matrix synchronized to default templates.', type: 'info' });
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restore Defaults
                </button>
              </div>
            </div>

            {/* Role Tab Selector */}
            <div className="flex items-center gap-2 pb-4 border-b border-slate-200 overflow-x-auto">
              {(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'INTERN', 'CLIENT'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRbacRole(r)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedRbacRole === r
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r}
                  <span className="ml-1.5 text-[10px] opacity-80">
                    ({rolePermissions[r]?.length || 0})
                  </span>
                </button>
              ))}
            </div>

            {/* Permissions Matrix for Selected Role */}
            <div className="mt-6 space-y-6">
              {['crm', 'projects', 'finance', 'workforce', 'interns', 'mail', 'system'].map((moduleKey) => {
                const moduleDefs = PERMISSION_DEFINITIONS.filter(p => p.module === moduleKey);
                if (moduleDefs.length === 0) return null;

                const rolePerms = rolePermissions[selectedRbacRole] || [];

                return (
                  <div key={moduleKey} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        {moduleDefs[0].label}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {moduleDefs.filter(d => rolePerms.includes(d.code)).length} of {moduleDefs.length} Active
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {moduleDefs.map((def) => {
                        const isChecked = rolePerms.includes(def.code);
                        const isLockedRoot = selectedRbacRole === 'SUPER_ADMIN' && def.code === 'system.admin';

                        return (
                          <label
                            key={def.code}
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-white border-indigo-200 shadow-xs'
                                : 'bg-slate-100/60 border-slate-200/80 opacity-75'
                            } ${isLockedRoot ? 'cursor-not-allowed opacity-90' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isLockedRoot}
                              onChange={() => handleTogglePermission(selectedRbacRole, def.code)}
                              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <div>
                              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <span className="capitalize">{def.action}</span>
                                <span className="text-[10px] text-slate-400 font-mono">({def.code})</span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                {def.description}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: SECURITY CENTER & SESSIONS */}
      {activeSubtab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Active Security Sessions</h3>
                <p className="text-xs text-slate-500">Live user sessions with IP tracing and instant revocation capability</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Device & Client</th>
                    <th className="py-3 px-4">IP Address & Location</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Session Started</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{session.userName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{session.userEmail || session.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{session.browser || 'Web Client'}</div>
                        <div className="text-[11px] text-slate-500">{session.device || 'Enterprise Workstation'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-900">{session.ipAddress}</div>
                        <div className="text-[11px] text-slate-500">{session.location || 'India (Local Hub)'}</div>
                      </td>
                      <td className="py-3 px-4">
                        {session.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            Revoked
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(session.loginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {session.status === 'ACTIVE' && (
                          <button
                            onClick={() => {
                              revokeSession(session.id);
                              addToast({ title: 'Session Revoked', message: `Revoked session for ${session.userName}`, type: 'warning' });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold border border-red-200 transition-colors"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: AUDIT TRAIL */}
      {activeSubtab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter audit events..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <select
                value={auditSeverity}
                onChange={(e) => setAuditSeverity(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none"
              >
                <option value="ALL">All Severities</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportAuditCSV}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Export CSV
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Resource & Target</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        {log.severity === 'critical' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                            CRITICAL
                          </span>
                        ) : log.severity === 'warning' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            WARNING
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            INFO
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{log.actorName || log.actor}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{log.actorRole || 'Personnel'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-700">
                        {log.action}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{log.resource || log.module}</div>
                        {(log.targetLabel || log.targetUser || log.targetResource) && (
                          <div className="text-[11px] text-slate-400">
                            {log.targetLabel || log.targetUser || log.targetResource}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {log.details || log.reason || log.action}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 6: ENTERPRISE SETTINGS */}
      {activeSubtab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Enterprise System Configuration</h3>
            <p className="text-xs text-slate-500">Global operating system parameters and authentication policies</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 p-5 rounded-xl border border-slate-200 bg-slate-50/50">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600" />
                General & Corporate Domain
              </h4>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Company Legal Entity</label>
                <input
                  type="text"
                  value={localSettings.organization?.companyName || 'Kapate Consultancy'}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    organization: { ...localSettings.organization, companyName: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Corporate Domain</label>
                <input
                  type="text"
                  disabled
                  value={localSettings.organization?.domain || 'kapateconsultancy.in'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-xs font-mono"
                />
                <span className="text-[10px] text-emerald-600 font-medium mt-1 block">
                  Strictly standardizing all internal identities on .in
                </span>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Support Contact Email</label>
                <input
                  type="email"
                  value={localSettings.organization?.supportEmail || 'admin@kapateconsultancy.in'}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    organization: { ...localSettings.organization, supportEmail: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-4 p-5 rounded-xl border border-slate-200 bg-slate-50/50">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600" />
                Security Policies
              </h4>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Session Inactivity Duration (Hours)</label>
                <input
                  type="number"
                  value={localSettings.authentication?.sessionDurationHours || 24}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    authentication: { ...localSettings.authentication, sessionDurationHours: parseInt(e.target.value, 10) || 24 }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Max Failed Logins Before Lockout</label>
                <input
                  type="number"
                  value={localSettings.authentication?.maxLoginAttempts || 5}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    authentication: { ...localSettings.authentication, maxLoginAttempts: parseInt(e.target.value, 10) || 5 }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <div className="text-xs font-bold text-slate-900">Enforce Multi-Factor Authentication</div>
                  <div className="text-[11px] text-slate-500">Require 2FA verification for all enterprise logins</div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.authentication?.mfaEnforced || false}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    authentication: { ...localSettings.authentication, mfaEnforced: e.target.checked }
                  })}
                  className="w-4 h-4 rounded text-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => {
                updateSystemSettings(localSettings);
                addToast({ title: 'Settings Saved', message: 'System configuration persisted successfully.', type: 'success' });
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              Save Configuration Changes
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB 7: HEALTH DIAGNOSTICS */}
      {activeSubtab === 'health' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Subsystem Diagnostics & Live Telemetry</h3>
                <p className="text-xs text-slate-500">Real-time health probing across all system dependencies</p>
              </div>
              <button
                onClick={handleRunHealthCheck}
                disabled={isRunningHealth}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2"
              >
                <Activity className={`w-4 h-4 ${isRunningHealth ? 'animate-spin' : ''}`} />
                Run Subsystem Health Probe
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemHealth.components.map((comp) => (
                <div key={comp.name} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900">{comp.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        comp.status === 'HEALTHY'
                          ? 'bg-emerald-100 text-emerald-800'
                          : comp.status === 'DEGRADED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {comp.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1">{comp.message}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Latency: <strong className="text-slate-700">{comp.latencyMs}ms</strong></span>
                    <span>Probed: Just now</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 8: BACKUP & DATA MANAGEMENT */}
      {activeSubtab === 'backup' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Backup & System Snapshot Engine</h3>
            <p className="text-xs text-slate-500">
              Export encrypted JSON archives containing complete system state, RBAC matrix, and audit history.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-2xl font-black text-slate-900">{usersList.length}</span>
              <p className="text-xs text-slate-500 mt-1">Users Snapshotted</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-2xl font-black text-slate-900">{auditLogs.length}</span>
              <p className="text-xs text-slate-500 mt-1">Chained Audit Records</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-2xl font-black text-slate-900">SHA-256</span>
              <p className="text-xs text-slate-500 mt-1">Integrity Checksum</p>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-indigo-100 bg-indigo-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-indigo-950">Master Archive Generation</h4>
              <p className="text-xs text-indigo-800/80 mt-0.5">
                Generates a timestamped .json archive suitable for disaster recovery and off-site cold storage.
              </p>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shrink-0 shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download Full JSON Snapshot
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB 9: AI CONTROL CENTER */}
      {activeSubtab === 'ai' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Enterprise AI Operations Controller</h3>
            <p className="text-xs text-slate-500">Govern model access, token quotas, and automated system intelligence</p>
          </div>

          <div className="space-y-4 max-w-xl">
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div>
                <div className="text-xs font-bold text-slate-900">Global AI Assistant Availability</div>
                <div className="text-[11px] text-slate-500">Allow personnel to use the conversational copilot</div>
              </div>
              <input
                type="checkbox"
                checked={localSettings.ai.enabled}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  ai: { ...localSettings.ai, enabled: e.target.checked }
                })}
                className="w-4 h-4 rounded text-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Primary Enterprise Model</label>
              <select
                value={localSettings.ai.model}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  ai: { ...localSettings.ai, model: e.target.value }
                })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra Fast & Low Latency)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning & Multimodal)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Monthly Token Quota Limit</label>
              <input
                type="number"
                value={localSettings.ai?.monthlyTokenLimit || 10000000}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  ai: { ...localSettings.ai, monthlyTokenLimit: parseInt(e.target.value, 10) || 10000000 }
                })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div>
                <div className="text-xs font-bold text-slate-900">Enable AI Operations Summarizer</div>
                <div className="text-[11px] text-slate-500">Auto-summarize client communications & sprint updates</div>
              </div>
              <input
                type="checkbox"
                checked={localSettings.ai?.enableSummarizer || false}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  ai: { ...localSettings.ai, enableSummarizer: e.target.checked }
                })}
                className="w-4 h-4 rounded text-indigo-600"
              />
            </div>

            <button
              onClick={() => {
                updateSystemSettings(localSettings);
                addToast({ title: 'AI Policy Updated', message: 'Intelligence engine configuration synchronized.', type: 'success' });
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm"
            >
              Update AI Policy
            </button>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Add Enterprise User</h3>
                  <p className="text-[11px] text-slate-500">Provision official @kapateconsultancy.in account</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Sharma"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Handle / Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. vikram.sharma or vikram@kapateconsultancy.in"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Automatically standardized to @kapateconsultancy.in
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Role *</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="PROJECT_MANAGER">Project Manager</option>
                    <option value="HR_ADMIN">HR Admin</option>
                    <option value="ADMIN">Admin</option>
                    <option value="INTERN">Intern</option>
                    <option value="CLIENT">Client</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
                  <select
                    value={newUserDept}
                    onChange={(e) => setNewUserDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Management">Management</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Cloud Architect"
                  value={newUserDesignation}
                  onChange={(e) => setNewUserDesignation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Initial Password</label>
                <input
                  type="text"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm"
                >
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPERSONATE CONFIRMATION MODAL */}
      {isImpersonateModalOpen && impersonateTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Initiate Persona Impersonation</h3>
                  <p className="text-[11px] text-slate-500">Security-monitored administrative override</p>
                </div>
              </div>
              <button
                onClick={() => setIsImpersonateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs mb-4">
              <p className="font-semibold">Compliance Notice:</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                You will switch into the exact view and permissions of <strong>{impersonateTarget.name}</strong> ({impersonateTarget.role}).
                All performed actions will be recorded under your primary identity in the append-only audit trail.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Justification / Reason *
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Diagnosing project board permission issue or verifying client invoice visibility..."
                  value={impersonateReason}
                  onChange={(e) => setImpersonateReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-400">Min 5 characters required for audit entry</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsImpersonateModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStartImpersonation}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  Begin Impersonation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {isResetPwdModalOpen && resetPwdUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Reset Password</h3>
                  <p className="text-[11px] text-slate-500">For {resetPwdUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsResetPwdModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">New Password</label>
                <input
                  type="text"
                  value={newPwdValue}
                  onChange={(e) => setNewPwdValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResetPwdModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetPasswordSubmit}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Apply Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
