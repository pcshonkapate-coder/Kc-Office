'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { usePermissions } from '../../../hooks/usePermissions';
import { ColumnDef, DataTable } from '../../../components/ui/DataTable';
import {
  Check,
  Copy,
  FileCode,
  Globe,
  Key,
  Laptop,
  Lock,
  LogIn,
  LogOut,
  Plus,
  Radio,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Trash2,
  Users,
  X,
} from 'lucide-react';

export default function SecurityWorkspacePage() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState<'sessions' | 'logins' | 'apikeys' | 'webhooks' | 'audit'>('sessions');

  // API Key creation modal state
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Webhook creation modal state
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState('invoice.paid, project.created');
  const [webhookDescription, setWebhookDescription] = useState('');

  // Selected audit diff state
  const [selectedAuditLog, setSelectedAuditLog] = useState<any>(null);

  // 1. Fetch Sessions
  const { data: sessions = [], isLoading: loadingSessions, refetch: refetchSessions } = useQuery({
    queryKey: ['security', 'sessions'],
    queryFn: async () => {
      const { data } = await apiClient.get('/security/sessions');
      return data;
    },
    enabled: can('system.config.manage'),
  });

  // 2. Fetch Recent Logins
  const { data: recentLogins = [], isLoading: loadingLogins } = useQuery({
    queryKey: ['security', 'recent-logins'],
    queryFn: async () => {
      const { data } = await apiClient.get('/security/recent-logins');
      return data;
    },
    enabled: can('system.config.manage'),
  });

  // 3. Fetch API Keys
  const { data: apiKeys = [], isLoading: loadingKeys } = useQuery({
    queryKey: ['security', 'api-keys'],
    queryFn: async () => {
      const { data } = await apiClient.get('/security/api-keys');
      return data;
    },
    enabled: can('system.config.manage'),
  });

  // 4. Fetch Webhooks
  const { data: webhooks = [], isLoading: loadingWebhooks } = useQuery({
    queryKey: ['security', 'webhooks'],
    queryFn: async () => {
      const { data } = await apiClient.get('/security/webhooks');
      return data;
    },
    enabled: can('system.config.manage'),
  });

  // 5. Fetch Audit Logs
  const { data: auditLogs = [], isLoading: loadingAudit } = useQuery({
    queryKey: ['security', 'audit-logs'],
    queryFn: async () => {
      const { data } = await apiClient.get('/security/audit-logs');
      return data;
    },
    enabled: can('audit.read'),
  });

  // Mutations
  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await apiClient.post(`/security/sessions/${sessionId}/revoke`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['security', 'audit-logs'] });
    },
  });

  const createApiKeyMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/security/api-keys', {
        name: keyName,
        scopes: ['read', 'write'],
      });
      return data;
    },
    onSuccess: (data) => {
      setCreatedSecret(data.plain_secret_key);
      setKeyName('');
      queryClient.invalidateQueries({ queryKey: ['security', 'api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['security', 'audit-logs'] });
    },
  });

  const revokeApiKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const { data } = await apiClient.post(`/security/api-keys/${keyId}/revoke`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security', 'api-keys'] });
      queryClient.invalidateQueries({ queryKey: ['security', 'audit-logs'] });
    },
  });

  const createWebhookMutation = useMutation({
    mutationFn: async () => {
      const eventsList = webhookEvents.split(',').map((e) => e.trim()).filter(Boolean);
      const { data } = await apiClient.post('/security/webhooks', {
        url: webhookUrl,
        events: eventsList,
        description: webhookDescription,
      });
      return data;
    },
    onSuccess: () => {
      setIsWebhookModalOpen(false);
      setWebhookUrl('');
      setWebhookDescription('');
      queryClient.invalidateQueries({ queryKey: ['security', 'webhooks'] });
      queryClient.invalidateQueries({ queryKey: ['security', 'audit-logs'] });
    },
  });

  const testPingWebhookMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      const { data } = await apiClient.post(`/security/webhooks/${webhookId}/test-ping`);
      return data;
    },
    onSuccess: (data) => {
      alert(`Webhook Test Ping Successful: ${data.url} responded with status 200.`);
    },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      await apiClient.delete(`/security/webhooks/${webhookId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security', 'webhooks'] });
      queryClient.invalidateQueries({ queryKey: ['security', 'audit-logs'] });
    },
  });

  // Copy Secret Helper
  const handleCopy = () => {
    if (createdSecret) {
      navigator.clipboard.writeText(createdSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Columns: Sessions
  const sessionColumns: ColumnDef<any>[] = [
    {
      key: 'user_email',
      header: 'Authenticated User',
      render: (row) => (
        <div>
          <span className="font-semibold text-white block">{row.user_email}</span>
          <span className="text-[10px] font-mono text-slate-500">ID: {row.session_id.slice(0, 13)}...</span>
        </div>
      ),
    },
    {
      key: 'user_agent',
      header: 'Device & Client',
      render: (row) => (
        <div className="flex items-center space-x-1.5 text-slate-300">
          <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-[200px] text-xs">{row.user_agent || 'Unknown'}</span>
        </div>
      ),
    },
    { key: 'ip_address', header: 'IP Address' },
    {
      key: 'created_at',
      header: 'Initiated',
      render: (row) => (
        <span className="text-[11px] font-mono text-slate-400">
          {new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'is_current',
      header: 'Scope Status',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
            row.is_current
              ? 'bg-blue-950 text-blue-300 border-blue-800'
              : 'bg-emerald-950 text-emerald-300 border-emerald-800'
          }`}
        >
          {row.is_current ? 'THIS SESSION' : 'ACTIVE'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      render: (row) => (
        <button
          onClick={() => {
            if (confirm(`Revoke session ${row.session_id.slice(0, 8)}? User will be logged out immediately.`)) {
              revokeSessionMutation.mutate(row.session_id);
            }
          }}
          disabled={revokeSessionMutation.isPending}
          className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-300 text-xs font-semibold cursor-pointer transition-colors"
        >
          Revoke
        </button>
      ),
    },
  ];

  // Columns: Recent Logins
  const loginColumns: ColumnDef<any>[] = [
    { key: 'actor_email', header: 'User Email', sortable: true },
    { key: 'action', header: 'Event Action', sortable: true },
    { key: 'ip_address', header: 'IP Address' },
    {
      key: 'user_agent',
      header: 'Browser Client',
      render: (row) => (
        <span className="truncate max-w-[220px] block text-[11px] text-slate-400">
          {row.user_agent || 'Enterprise Client'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
            row.status === 'SUCCESS'
              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Timestamp',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-slate-400 text-xs">
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
    },
  ];

  // Columns: API Keys
  const apiKeyColumns: ColumnDef<any>[] = [
    { key: 'name', header: 'Key Name', sortable: true },
    {
      key: 'key_prefix',
      header: 'Key Prefix',
      render: (row) => (
        <span className="font-mono text-blue-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
          {row.key_prefix}_••••••••
        </span>
      ),
    },
    {
      key: 'scopes',
      header: 'Assigned Scopes',
      render: (row) => (
        <div className="flex gap-1">
          {row.scopes?.map((s: string) => (
            <span key={s} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono">
              {s}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-mono border font-semibold ${
            row.is_active
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {row.is_active ? 'ACTIVE' : 'REVOKED'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created Date',
      render: (row) => <span className="text-slate-600 font-mono text-xs">{new Date(row.created_at).toLocaleDateString()}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) =>
        row.is_active ? (
          <button
            onClick={() => {
              if (confirm(`Revoke API key '${row.name}'? Applications using it will lose access immediately.`)) {
                revokeApiKeyMutation.mutate(row.id);
              }
            }}
            disabled={revokeApiKeyMutation.isPending}
            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
          >
            Revoke
          </button>
        ) : (
          <span className="text-slate-400 text-xs font-mono">Disabled</span>
        ),
    },
  ];

  // Columns: Webhooks
  const webhookColumns: ColumnDef<any>[] = [
    { key: 'url', header: 'Endpoint URL', sortable: true },
    {
      key: 'events',
      header: 'Subscribed Events',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.events?.map((ev: string) => (
            <span key={ev} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono">
              {ev}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'State',
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
          ACTIVE
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => testPingWebhookMutation.mutate(row.id)}
            disabled={testPingWebhookMutation.isPending}
            title="Dispatch Test Ping"
            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-blue-700 border border-slate-200 text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs font-medium"
          >
            <Send className="w-3 h-3" />
            <span>Ping</span>
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete webhook subscription for ${row.url}?`)) {
                deleteWebhookMutation.mutate(row.id);
              }
            }}
            disabled={deleteWebhookMutation.isPending}
            title="Delete Webhook"
            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 cursor-pointer transition-colors shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Columns: Audit Logs
  const auditColumns: ColumnDef<any>[] = [
    { key: 'action', header: 'Action', sortable: true },
    { key: 'entity_type', header: 'Entity Type', sortable: true },
    { key: 'actor_email', header: 'Actor Email', sortable: true },
    { key: 'ip_address', header: 'IP Address' },
    {
      key: 'created_at',
      header: 'Timestamp',
      sortable: true,
      render: (row) => <span className="font-mono text-slate-600 text-xs">{new Date(row.created_at).toLocaleString()}</span>,
    },
    {
      key: 'diff',
      header: 'State Inspection',
      render: (row) => (
        <button
          onClick={() => setSelectedAuditLog(row)}
          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-mono cursor-pointer transition-colors shadow-2xs font-medium"
        >
          View Diff
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            Security & Governance Center
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time session revocation, cryptographic API keys, webhooks, and immutable audit trails
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'sessions' && (
            <button
              onClick={() => refetchSessions()}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              <span>Refresh Sessions</span>
            </button>
          )}

          {activeTab === 'apikeys' && (
            <button
              onClick={() => {
                setIsKeyModalOpen(true);
                setCreatedSecret(null);
              }}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate API Key</span>
            </button>
          )}

          {activeTab === 'webhooks' && (
            <button
              onClick={() => setIsWebhookModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Webhook</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'sessions'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Laptop className="w-3.5 h-3.5" />
          <span>Active Sessions ({sessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logins')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'logins'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Recent Logins ({recentLogins.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('apikeys')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'apikeys'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>API Keys ({apiKeys.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('webhooks')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'webhooks'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Webhooks ({webhooks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Immutable Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* SESSIONS TABLE */}
      {activeTab === 'sessions' && (
        <DataTable
          data={sessions}
          columns={sessionColumns}
          keyExtractor={(item) => item.session_id}
          searchPlaceholder="Search active sessions by user email or IP..."
          searchableKeys={['user_email', 'ip_address', 'user_agent']}
          isLoading={loadingSessions}
        />
      )}

      {/* RECENT LOGINS TABLE */}
      {activeTab === 'logins' && (
        <DataTable
          data={recentLogins}
          columns={loginColumns}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Search login history by user or IP..."
          searchableKeys={['actor_email', 'ip_address', 'action']}
          isLoading={loadingLogins}
        />
      )}

      {/* API KEYS TABLE */}
      {activeTab === 'apikeys' && (
        <DataTable
          data={apiKeys}
          columns={apiKeyColumns}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Search API keys..."
          searchableKeys={['name', 'key_prefix']}
          isLoading={loadingKeys}
        />
      )}

      {/* WEBHOOKS TABLE */}
      {activeTab === 'webhooks' && (
        <DataTable
          data={webhooks}
          columns={webhookColumns}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Search webhooks..."
          searchableKeys={['url']}
          isLoading={loadingWebhooks}
        />
      )}

      {/* AUDIT LOGS TABLE */}
      {activeTab === 'audit' && (
        <DataTable
          data={auditLogs}
          columns={auditColumns}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Search audit trails by actor, action, entity..."
          searchableKeys={['action', 'entity_type', 'actor_email', 'ip_address']}
          isLoading={loadingAudit}
        />
      )}

      {/* BEFORE / AFTER STATE DIFF MODAL */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-blue-600 font-semibold">
                  {selectedAuditLog.action} • {selectedAuditLog.entity_type}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Database Audit State Record</h3>
              </div>
              <button onClick={() => setSelectedAuditLog(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-600 block mb-1">State Before Mutation:</span>
                <pre className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono text-slate-800 overflow-x-auto max-h-60">
                  {JSON.stringify(selectedAuditLog.before_state, null, 2) || 'None (New Record Creation)'}
                </pre>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-600 block mb-1">State After Mutation:</span>
                <pre className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono text-emerald-800 overflow-x-auto max-h-60">
                  {JSON.stringify(selectedAuditLog.after_state, null, 2) || 'None (Record Deleted)'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GENERATE API KEY MODAL */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Generate Enterprise API Key</h3>
              <button onClick={() => setIsKeyModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!createdSecret ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Key Name / Service Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CI/CD Deployment Worker"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-blue-600 transition-all"
                  />
                </div>
                <button
                  onClick={() => createApiKeyMutation.mutate()}
                  disabled={!keyName.trim() || createApiKeyMutation.isPending}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-40 transition-colors"
                >
                  {createApiKeyMutation.isPending ? 'Generating Secret...' : 'Generate Key'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                  Copy this key now. For security purposes, this secret will <strong>never be shown again</strong>.
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between font-mono text-xs text-slate-900">
                  <span className="truncate mr-2">{createdSecret}</span>
                  <button onClick={handleCopy} className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer shadow-2xs">
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={() => setIsKeyModalOpen(false)}
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REGISTER WEBHOOK MODAL */}
      {isWebhookModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Register Webhook Subscription</h3>
              <button onClick={() => setIsWebhookModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Webhook URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://api.external.com/webhooks/kapate"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subscribed Events (Comma-separated)</label>
                <input
                  type="text"
                  required
                  placeholder="invoice.paid, project.created, task.completed"
                  value={webhookEvents}
                  onChange={(e) => setWebhookEvents(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-blue-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="External CRM Sync Service"
                  value={webhookDescription}
                  onChange={(e) => setWebhookDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-blue-600 transition-all"
                />
              </div>

              <button
                onClick={() => createWebhookMutation.mutate()}
                disabled={!webhookUrl.trim() || createWebhookMutation.isPending}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-40 transition-colors"
              >
                {createWebhookMutation.isPending ? 'Registering...' : 'Register Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
