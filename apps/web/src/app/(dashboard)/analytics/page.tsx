'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { usePermissions } from '../../../hooks/usePermissions';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Building,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  Eye,
  FileSpreadsheet,
  FolderGit2,
  Layers,
  PieChart,
  Printer,
  ShieldAlert,
  TrendingUp,
  User,
  Users,
  X,
} from 'lucide-react';

interface HierarchyNode {
  id: string;
  name: string;
  level: 'COMPANY' | 'DEPARTMENT' | 'TEAM' | 'PROJECT' | 'USER';
  budget: string | number;
  revenue_or_cost: string | number;
  efficiency_pct: number;
  children?: HierarchyNode[];
}

function HierarchyTreeNode({
  node,
  expandedNodes,
  onToggle,
  depth = 0,
}: {
  node: HierarchyNode;
  expandedNodes: Set<string>;
  onToggle: (id: string) => void;
  depth?: number;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);

  const getLevelStyle = (level: string) => {
    switch (level) {
      case 'COMPANY':
        return {
          icon: Building,
          color: 'text-blue-600',
          badge: 'bg-blue-50 text-blue-700 border-blue-200',
          bg: 'bg-white border-slate-200 shadow-2xs',
        };
      case 'DEPARTMENT':
        return {
          icon: Layers,
          color: 'text-indigo-600',
          badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          bg: 'bg-slate-50/90 border-slate-200',
        };
      case 'TEAM':
        return {
          icon: Users,
          color: 'text-purple-600',
          badge: 'bg-purple-50 text-purple-700 border-purple-200',
          bg: 'bg-white border-slate-200',
        };
      case 'PROJECT':
        return {
          icon: FolderGit2,
          color: 'text-amber-600',
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          bg: 'bg-slate-50/70 border-slate-200',
        };
      case 'USER':
        return {
          icon: User,
          color: 'text-emerald-600',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          bg: 'bg-white border-slate-200',
        };
      default:
        return {
          icon: Briefcase,
          color: 'text-slate-500',
          badge: 'bg-slate-100 text-slate-700 border-slate-200',
          bg: 'bg-white border-slate-200',
        };
    }
  };

  const style = getLevelStyle(node.level);
  const Icon = style.icon;

  return (
    <div className="space-y-1.5" style={{ marginLeft: depth > 0 ? `${depth * 1.25}rem` : '0' }}>
      <div
        onClick={() => hasChildren && onToggle(node.id)}
        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
          style.bg
        } ${hasChildren ? 'cursor-pointer hover:border-slate-300 hover:shadow-xs' : ''}`}
      >
        <div className="flex items-center space-x-2">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )
          ) : (
            <span className="w-3.5" />
          )}
          <Icon className={`w-4 h-4 ${style.color}`} />
          <span className="text-xs font-semibold text-slate-900">{node.name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${style.badge}`}>
            {node.level}
          </span>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono">
          {Number(node.budget) > 0 && (
            <span className="text-slate-500 hidden sm:inline">
              Budget: <strong className="text-slate-800">₹{Number(node.budget).toLocaleString()}</strong>
            </span>
          )}
          <span className="text-slate-500">
            {node.level === 'COMPANY' || node.level === 'PROJECT' ? 'Revenue' : 'Cost'}:{' '}
            <strong className="text-slate-900 font-semibold">₹{Number(node.revenue_or_cost).toLocaleString()}</strong>
          </span>
          <span
            className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
              node.efficiency_pct >= 90
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : node.efficiency_pct >= 75
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {node.efficiency_pct}% Eff.
          </span>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="space-y-1.5 pt-0.5">
          {node.children!.map((child) => (
            <HierarchyTreeNode
              key={child.id}
              node={child}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsWorkspacePage() {
  const { can } = usePermissions();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [previewReportType, setPreviewReportType] = useState<string | null>(null);

  // Fetch CEO Command Center metrics
  const { data: ceoData, isLoading } = useQuery({
    queryKey: ['analytics', 'ceo-command-center'],
    queryFn: async () => {
      const { data } = await apiClient.get('/analytics/ceo-command-center');
      return data;
    },
    enabled: can('finance.margin.view'),
  });

  // Fetch structured report preview
  const { data: reportPreview, isLoading: loadingPreview } = useQuery({
    queryKey: ['analytics', 'report-preview', previewReportType],
    queryFn: async () => {
      if (!previewReportType) return null;
      const { data } = await apiClient.get(`/analytics/reports/${previewReportType}`);
      return data;
    },
    enabled: !!previewReportType,
  });

  const toggleNode = (id: string) => {
    const updated = new Set(expandedNodes);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setExpandedNodes(updated);
  };

  const handleDownloadCsv = (reportType: string) => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    window.open(`${apiBase}/analytics/export/${reportType}`, '_blank');
  };

  if (!can('finance.margin.view')) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-3 max-w-md mx-auto my-12 shadow-sm">
        <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
        <p className="text-xs text-slate-500">
          The Executive CEO Command Center requires elevated corporate governance privileges.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Export Triggers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            CEO Executive Command Center
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time corporate pulse, operational risk monitoring, and hierarchical 5-tier profitability
          </p>
        </div>

        {/* Data Export Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPreviewReportType('financial_ledger')}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>Financial Ledger</span>
          </button>
          <button
            onClick={() => setPreviewReportType('project_status')}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span>Projects Report</span>
          </button>
          <button
            onClick={() => setPreviewReportType('crm_pipeline')}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-purple-600" />
            <span>CRM Pipeline</span>
          </button>
          <button
            onClick={() => setPreviewReportType('workforce_timesheets')}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-amber-600" />
            <span>Timesheets</span>
          </button>
        </div>
      </div>

      {/* 1. ATTENTION REQUIRED WIDGET */}
      {ceoData?.attention_required?.length > 0 && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Attention Required: {ceoData.attention_required.length} Operational Anomalies</span>
            </div>
            <span className="text-[11px] font-mono text-rose-600">Automated Risk Monitor</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ceoData.attention_required.map((item: any, idx: number) => (
              <a
                key={idx}
                href={item.link}
                className="p-3.5 bg-white border border-rose-200 hover:border-rose-400 rounded-xl space-y-1 block transition-all shadow-2xs group"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase ${
                      item.severity === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-700 border-rose-200 font-semibold'
                        : 'bg-amber-100 text-amber-700 border-amber-200 font-semibold'
                    }`}
                  >
                    {item.severity}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 transition-colors" />
                </div>
                <div className="text-xs font-bold text-slate-900 pt-1">{item.title}</div>
                <div className="text-[11px] text-slate-500">{item.description}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 2. TOP METRICS: COMPANY PULSE & FINANCIAL RUNWAY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Collected Revenue (YTD)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            ₹{Number(ceoData?.revenue_pipeline?.ytd_collected_revenue || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>MTD: ₹{Number(ceoData?.revenue_pipeline?.mtd_collected_revenue || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Sales Pipeline</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            ₹{Number(ceoData?.revenue_pipeline?.total_pipeline_value || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-blue-600 font-medium">
            Weighted: ₹{Math.round(Number(ceoData?.revenue_pipeline?.weighted_pipeline_value || 0)).toLocaleString()}
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Billable Hours (Week)</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {ceoData?.company_pulse?.active_billable_hours_week || 0} hrs
          </div>
          <div className="text-[11px] text-indigo-600 font-medium">
            Across {ceoData?.company_pulse?.active_projects_count || 0} Active Projects
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Gross Delivery Margin</span>
            <PieChart className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {ceoData?.revenue_pipeline?.average_gross_margin_pct || '0'}%
          </div>
          <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Optimal Healthy Range</span>
          </div>
        </div>
      </div>

      {/* 3. 5-TIER HIERARCHY PROFITABILITY DRILLDOWN */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">5-Tier Hierarchical Operational Drill-down</h3>
            <p className="text-xs text-slate-500">
              Company ➔ Department ➔ Team ➔ Project ➔ Personnel execution & profitability visibility
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            Recursive Tree View
          </span>
        </div>

        {ceoData?.hierarchy_drilldown && (
          <div className="space-y-2 pt-2">
            <HierarchyTreeNode
              node={ceoData.hierarchy_drilldown}
              expandedNodes={expandedNodes}
              onToggle={toggleNode}
            />
          </div>
        )}
      </div>

      {/* REPORT PREVIEW & EXPORT MODAL */}
      {previewReportType && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl shadow-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  {reportPreview?.title || 'Report Table Preview'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live data table generated at {reportPreview?.generated_at ? new Date(reportPreview.generated_at).toLocaleString() : 'now'} • {reportPreview?.total_records || 0} records
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownloadCsv(previewReportType)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={() => setPreviewReportType(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white">
              {loadingPreview ? (
                <div className="p-8 text-center text-xs text-slate-500">Loading structured report data...</div>
              ) : reportPreview?.columns ? (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 sticky top-0">
                      {reportPreview.columns.map((col: string, idx: number) => (
                        <th key={idx} className="p-3 font-semibold text-slate-600 font-mono text-[11px]">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportPreview.rows?.map((row: string[], rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-slate-50/70 transition-colors">
                        {row.map((cell: string, cIdx: number) => (
                          <td key={cIdx} className="p-3 text-slate-700 font-mono text-[11px] whitespace-nowrap">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">No records found for this report.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
