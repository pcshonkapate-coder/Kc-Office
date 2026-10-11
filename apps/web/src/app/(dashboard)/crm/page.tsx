'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { usePermissions } from '../../../hooks/usePermissions';
import { ColumnDef, DataTable } from '../../../components/ui/DataTable';
import {
  ArrowRight,
  Briefcase,
  Building,
  CheckCircle,
  FileCheck2,
  FileSignature,
  Layers,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';

const DEAL_STAGES = [
  { key: 'DISCOVERY', label: 'Discovery', color: 'border-blue-300 text-blue-700 bg-blue-50/60' },
  { key: 'PROPOSAL', label: 'Proposal Sent', color: 'border-amber-300 text-amber-700 bg-amber-50/60' },
  { key: 'NEGOTIATION', label: 'Negotiation', color: 'border-purple-300 text-purple-700 bg-purple-50/60' },
  { key: 'CLOSED_WON', label: 'Closed Won', color: 'border-emerald-300 text-emerald-700 bg-emerald-50/60' },
  { key: 'CLOSED_LOST', label: 'Closed Lost', color: 'border-rose-300 text-rose-700 bg-rose-50/60' },
];

export default function CRMWorkspacePage() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'accounts' | 'leads' | 'contracts'>('pipeline');

  // 1. Fetch Deals
  const { data: deals = [], isLoading: loadingDeals } = useQuery({
    queryKey: ['crm', 'deals'],
    queryFn: async () => {
      const { data } = await apiClient.get('/crm/deals');
      return data;
    },
    enabled: can('crm.deal.read'),
  });

  // 2. Fetch Accounts (Client 360)
  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['crm', 'accounts'],
    queryFn: async () => {
      const { data } = await apiClient.get('/crm/accounts');
      return data;
    },
    enabled: can('crm.account.read'),
  });

  // 3. Fetch Leads
  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ['crm', 'leads'],
    queryFn: async () => {
      const { data } = await apiClient.get('/crm/leads');
      return data;
    },
    enabled: can('crm.lead.read'),
  });

  // 4. Fetch Contracts
  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: ['crm', 'contracts'],
    queryFn: async () => {
      const { data } = await apiClient.get('/crm/contracts');
      return data;
    },
    enabled: can('crm.deal.read'),
  });

  // Deal Stage Mutation
  const updateStageMutation = useMutation({
    mutationFn: async ({ dealId, stage }: { dealId: string; stage: string }) => {
      const { data } = await apiClient.patch(`/crm/deals/${dealId}/stage`, { stage });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'deals'] });
    },
  });

  // Convert Lead Mutation
  const convertLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const { data } = await apiClient.post(`/crm/leads/${leadId}/convert`, {
        tier: 'GROWTH',
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'leads'] });
      queryClient.invalidateQueries({ queryKey: ['crm', 'accounts'] });
      queryClient.invalidateQueries({ queryKey: ['crm', 'deals'] });
    },
  });

  // Sign Contract Mutation
  const signContractMutation = useMutation({
    mutationFn: async ({ contractId, signerName }: { contractId: string; signerName: string }) => {
      const { data } = await apiClient.post(`/crm/contracts/${contractId}/sign`, {
        signer_name: signerName,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'contracts'] });
      queryClient.invalidateQueries({ queryKey: ['crm', 'accounts'] });
    },
  });

  // Pipeline Metrics Calculation
  const totalPipelineValue = deals.reduce(
    (acc: number, d: any) => (d.stage !== 'CLOSED_LOST' ? acc + Number(d.contract_amount || 0) : acc),
    0
  );
  const weightedPipelineValue = deals.reduce(
    (acc: number, d: any) =>
      d.stage !== 'CLOSED_LOST'
        ? acc + (Number(d.contract_amount || 0) * (d.win_probability || 0)) / 100
        : acc,
    0
  );

  // Columns Definitions
  const accountColumns: ColumnDef<any>[] = [
    { key: 'name', header: 'Client Account', sortable: true },
    { key: 'industry', header: 'Industry' },
    {
      key: 'tier',
      header: 'Tier',
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-purple-50 text-purple-700 border border-purple-200">
          {row.tier}
        </span>
      ),
    },
    {
      key: 'total_revenue',
      header: 'Lifetime Value (LTV)',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-semibold text-slate-900">
          ₹{Number(row.total_revenue).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          {row.status}
        </span>
      ),
    },
  ];

  const leadColumns: ColumnDef<any>[] = [
    { key: 'title', header: 'Lead Requirement', sortable: true },
    { key: 'company', header: 'Company', sortable: true },
    { key: 'contact_name', header: 'Contact' },
    { key: 'email', header: 'Email' },
    {
      key: 'estimated_value',
      header: 'Est. Value',
      render: (row) => (
        <span className="font-mono font-semibold text-slate-900">
          ₹{Number(row.estimated_value).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const isConverted = row.status === 'CONVERTED';
        return (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border ${
              isConverted
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            {row.status}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Convert',
      render: (row) => {
        if (row.status === 'CONVERTED') {
          return <span className="text-emerald-600 font-medium text-xs">Converted</span>;
        }
        return (
          <button
            onClick={() => convertLeadMutation.mutate(row.id)}
            disabled={convertLeadMutation.isPending}
            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition-colors shadow-xs cursor-pointer"
          >
            Convert to Client
          </button>
        );
      },
    },
  ];

  const contractColumns: ColumnDef<any>[] = [
    { key: 'contract_number', header: 'Contract ID', sortable: true },
    { key: 'title', header: 'Title', sortable: true },
    { key: 'account_name', header: 'Client Account' },
    {
      key: 'total_value',
      header: 'Value',
      render: (row) => (
        <span className="font-mono font-semibold text-slate-900">
          ₹{Number(row.total_value).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border ${
            row.status === 'ACTIVE'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: 'digital_hash',
      header: 'Digital Signature (SHA-256)',
      render: (row) =>
        row.digital_hash ? (
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-700">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span className="truncate max-w-[140px]" title={row.digital_hash}>
              {row.digital_hash.slice(0, 14)}...
            </span>
          </div>
        ) : (
          <button
            onClick={() =>
              signContractMutation.mutate({
                contractId: row.id,
                signerName: 'Executive Authority',
              })
            }
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold shadow-xs cursor-pointer"
          >
            Sign Contract
          </button>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Workspace Header & KPI Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-xs">
              <Briefcase className="w-5 h-5" />
            </div>
            CRM & Client 360 Workspace
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Sales pipeline, accounts 360, proposals, and cryptographically verified contracts
          </p>
        </div>

        {/* Pipeline Value Metrics */}
        <div className="flex items-center space-x-3 bg-white border border-slate-200 px-4 py-2.5 rounded-2xl shadow-xs">
          <div>
            <span className="text-[10px] font-semibold uppercase text-slate-500 block">Total Pipeline</span>
            <span className="text-base font-bold text-slate-900 font-mono">₹{totalPipelineValue.toLocaleString()}</span>
          </div>
          <div className="h-7 w-px bg-slate-200" />
          <div>
            <span className="text-[10px] font-semibold uppercase text-blue-600 block">Weighted Value</span>
            <span className="text-base font-bold text-blue-600 font-mono">
              ₹{Math.round(weightedPipelineValue).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'pipeline'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Deals Pipeline ({deals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'accounts'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Client 360 Accounts ({accounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('leads')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'leads'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Leads & Prospects ({leads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('contracts')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'contracts'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <FileSignature className="w-3.5 h-3.5" />
          <span>Contracts & Vault ({contracts.length})</span>
        </button>
      </div>

      {/* PIPELINE KANBAN VIEW */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {DEAL_STAGES.map((stage) => {
            const stageDeals = deals.filter((d: any) => d.stage === stage.key);
            const stageTotal = stageDeals.reduce(
              (acc: number, d: any) => acc + Number(d.contract_amount || 0),
              0
            );

            return (
              <div
                key={stage.key}
                className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-3.5 flex flex-col min-h-[460px] shadow-xs"
              >
                {/* Stage Header */}
                <div className="border-b border-slate-200 pb-2.5 mb-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${stage.color}`}>{stage.label}</span>
                    <span className="text-[11px] font-mono text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-xs font-medium">
                      {stageDeals.length}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 font-mono mt-1.5 block">
                    ₹{stageTotal.toLocaleString()}
                  </span>
                </div>

                {/* Stage Cards */}
                <div className="space-y-2.5 flex-1">
                  {stageDeals.map((deal: any) => (
                    <div
                      key={deal.id}
                      className="p-3.5 bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl shadow-xs transition-all space-y-2"
                    >
                      <div className="text-xs font-bold text-slate-900">{deal.name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{deal.account_name}</div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                        <span className="font-bold text-slate-900 font-mono">
                          ₹{Number(deal.contract_amount).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                          {deal.win_probability}% Win
                        </span>
                      </div>

                      {/* Advance Stage Control */}
                      {stage.key !== 'CLOSED_WON' && stage.key !== 'CLOSED_LOST' && (
                        <div className="pt-1.5 flex items-center justify-end">
                          <button
                            onClick={() => {
                              const currentIndex = DEAL_STAGES.findIndex((s) => s.key === stage.key);
                              const nextStage = DEAL_STAGES[currentIndex + 1];
                              if (nextStage) {
                                updateStageMutation.mutate({
                                   dealId: deal.id,
                                   stage: nextStage.key,
                                });
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <span>Advance</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CLIENT 360 ACCOUNTS TABLE */}
      {activeTab === 'accounts' && (
        <DataTable
          data={accounts}
          columns={accountColumns}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Search accounts by company name, industry..."
          searchableKeys={['name', 'industry', 'tier', 'status']}
          isLoading={loadingAccounts}
        />
      )}

      {/* LEADS & PROSPECTS TABLE */}
      {activeTab === 'leads' && (
        <DataTable
          data={leads}
          columns={leadColumns}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Search leads by title, company, contact..."
          searchableKeys={['title', 'company', 'contact_name', 'email', 'status']}
          isLoading={loadingLeads}
        />
      )}

      {/* CONTRACTS VAULT TABLE */}
      {activeTab === 'contracts' && (
        <DataTable
          data={contracts}
          columns={contractColumns}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Search contracts by title, number, client..."
          searchableKeys={['contract_number', 'title', 'account_name', 'status']}
          isLoading={loadingContracts}
        />
      )}
    </div>
  );
}
