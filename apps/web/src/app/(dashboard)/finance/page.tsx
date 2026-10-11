'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { usePermissions } from '../../../hooks/usePermissions';
import { ColumnDef, DataTable } from '../../../components/ui/DataTable';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Filter,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  X,
  XCircle,
} from 'lucide-react';

export default function FinanceWorkspacePage() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState<'invoices' | 'expenses' | 'profitability'>('invoices');

  // Modal States
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Form states: New Invoice
  const [newInvoiceAccount, setNewInvoiceAccount] = useState('');
  const [newInvoiceDueDate, setNewInvoiceDueDate] = useState('');
  const [newInvoiceTaxType, setNewInvoiceTaxType] = useState('INTRA_STATE');
  const [newInvoiceNotes, setNewInvoiceNotes] = useState('');
  const [invoiceItems, setInvoiceItems] = useState([
    { description: 'Technology Consulting & Implementation', quantity: 1, unit_price: 150000 },
  ]);

  // Form states: Payment
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('NEFT');
  const [paymentReference, setPaymentReference] = useState('');

  // Form states: Expense
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('SOFTWARE_LICENSE');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');

  // 1. Fetch Invoices
  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['finance', 'invoices'],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/invoices');
      return data;
    },
    enabled: can('finance.invoice.read'),
  });

  // 2. Fetch Expenses
  const { data: expenses = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ['finance', 'expenses'],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/expenses');
      return data;
    },
    enabled: can('finance.expense.view'),
  });

  // 3. Fetch Project Profitability
  const { data: profitability = [], isLoading: loadingProfitability } = useQuery({
    queryKey: ['finance', 'profitability'],
    queryFn: async () => {
      const { data } = await apiClient.get('/finance/profitability');
      return data;
    },
    enabled: can('finance.margin.view'),
  });

  // 4. Fetch Client Accounts for Invoicing
  const { data: accounts = [] } = useQuery({
    queryKey: ['crm', 'accounts'],
    queryFn: async () => {
      const { data } = await apiClient.get('/crm/accounts');
      return data;
    },
  });

  // Mutations
  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/finance/invoices', {
        account_id: newInvoiceAccount,
        due_date: newInvoiceDueDate,
        tax_type: newInvoiceTaxType,
        notes: newInvoiceNotes,
        items: invoiceItems,
      });
      return data;
    },
    onSuccess: () => {
      setIsInvoiceModalOpen(false);
      setInvoiceItems([{ description: '', quantity: 1, unit_price: 0 }]);
      queryClient.invalidateQueries({ queryKey: ['finance', 'invoices'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'ceo-command-center'] });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/finance/payments', {
        invoice_id: selectedInvoice.id,
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        transaction_reference: paymentReference,
      });
      return data;
    },
    onSuccess: () => {
      setIsPaymentModalOpen(false);
      setSelectedInvoice(null);
      setPaymentAmount('');
      setPaymentReference('');
      queryClient.invalidateQueries({ queryKey: ['finance', 'invoices'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'ceo-command-center'] });
    },
  });

  const updateExpenseStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) => {
      const { data } = await apiClient.patch(`/finance/expenses/${id}/status`, {
        status,
        rejection_reason: status === 'REJECTED' ? 'Budget ceiling exceeded' : undefined,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'ceo-command-center'] });
    },
  });

  // Invoices Columns
  const invoiceColumns: ColumnDef<any>[] = [
    {
      key: 'invoice_number',
      header: 'Invoice #',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-blue-400 font-semibold">{row.invoice_number}</span>
      ),
    },
    { key: 'account_name', header: 'Client Account', sortable: true },
    {
      key: 'total_amount',
      header: 'Total Amount (₹)',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-white block">₹{Number(row.total_amount).toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            Subtotal: ₹{Number(row.subtotal).toLocaleString()} + Tax: ₹{Number(row.total_tax).toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      key: 'tax_details',
      header: 'GST Breakdown',
      render: (row) => (
        <div className="text-[10px] font-mono text-slate-400">
          {row.tax_type === 'INTRA_STATE' ? (
            <span>
              CGST ({row.cgst_rate}%): ₹{Number(row.cgst_amount).toLocaleString()} | SGST ({row.sgst_rate}%): ₹{Number(row.sgst_amount).toLocaleString()}
            </span>
          ) : (
            <span>IGST ({row.igst_rate}%): ₹{Number(row.igst_amount).toLocaleString()}</span>
          )}
        </div>
      ),
    },
    {
      key: 'amount_paid',
      header: 'Payment Progress',
      render: (row) => {
        const pct = Math.min(Math.round((Number(row.amount_paid) / Number(row.total_amount)) * 100), 100);
        return (
          <div className="w-32 space-y-1">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-emerald-400">₹{Number(row.amount_paid).toLocaleString()}</span>
              <span className="text-slate-400">{pct}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className={`h-full ${pct === 100 ? 'bg-emerald-600' : 'bg-blue-600'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => {
        const getStatusBadge = () => {
          switch (row.status) {
            case 'PAID':
              return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'PARTIALLY_PAID':
              return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'SENT':
              return 'bg-amber-50 text-amber-700 border-amber-200';
            default:
              return 'bg-slate-100 text-slate-700 border-slate-200';
          }
        };
        return (
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono border font-semibold ${getStatusBadge()}`}>
            {row.status}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Action',
      render: (row) =>
        row.status !== 'PAID' ? (
          <button
            onClick={() => {
              setSelectedInvoice(row);
              setPaymentAmount(String(Number(row.total_amount) - Number(row.amount_paid)));
              setIsPaymentModalOpen(true);
            }}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
          >
            <CreditCard className="w-3 h-3 text-emerald-600" />
            <span>Record Payment</span>
          </button>
        ) : (
          <span className="text-emerald-700 text-xs font-mono font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Settled (Locked)</span>
          </span>
        ),
    },
  ];

  // Expenses Columns
  const expenseColumns: ColumnDef<any>[] = [
    { key: 'title', header: 'Expense Title', sortable: true },
    { key: 'category', header: 'Category', sortable: true },
    {
      key: 'amount',
      header: 'Amount (₹)',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-slate-900 font-mono">₹{Number(row.amount).toLocaleString()}</span>
      ),
    },
    {
      key: 'status',
      header: 'Approval Status',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-mono border font-semibold ${
            row.status === 'APPROVED'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : row.status === 'REJECTED'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: 'expense_date',
      header: 'Incurred Date',
      render: (row) => <span className="text-slate-600 font-mono">{row.expense_date}</span>,
    },
    {
      key: 'actions',
      header: 'Manage',
      render: (row) =>
        row.status === 'SUBMITTED' ? (
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => updateExpenseStatusMutation.mutate({ id: row.id, status: 'APPROVED' })}
              className="p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer shadow-2xs transition-colors"
              title="Approve Expense"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => updateExpenseStatusMutation.mutate({ id: row.id, status: 'REJECTED' })}
              className="p-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer shadow-2xs transition-colors"
              title="Reject Expense"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span className="text-slate-500 text-xs font-mono">{row.status}</span>
        ),
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            Corporate Finance & Billing
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Indian GST-compliant tax invoicing, immutable paid ledgers, expense governance, and project profitability
          </p>
        </div>

        {activeTab === 'invoices' && (
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate GST Invoice</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'invoices'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Invoices ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'expenses'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Operating Expenses ({expenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profitability')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'profitability'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Project Profitability & Budget Alerts</span>
        </button>
      </div>

      {/* INVOICES TAB */}
      {activeTab === 'invoices' && (
        <DataTable
          data={invoices}
          columns={invoiceColumns}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Search invoices by number, client..."
          searchableKeys={['invoice_number', 'account_name', 'status']}
          isLoading={loadingInvoices}
        />
      )}

      {/* EXPENSES TAB */}
      {activeTab === 'expenses' && (
        <DataTable
          data={expenses}
          columns={expenseColumns}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Search expenses by title or category..."
          searchableKeys={['title', 'category', 'status']}
          isLoading={loadingExpenses}
        />
      )}

      {/* PROJECT PROFITABILITY & BUDGET CONTROL */}
      {activeTab === 'profitability' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profitability.map((item: any) => {
              const consumedPct = Math.round(item.budget_consumed_pct);
              const isCritical = consumedPct >= 100;
              const isWarning = consumedPct >= 70;

              return (
                <div
                  key={item.project_id}
                  className={`p-5 rounded-2xl border transition-all space-y-3.5 bg-white shadow-xs ${
                    isCritical
                      ? 'border-rose-200 bg-rose-50/20'
                      : isWarning
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-blue-600 font-semibold uppercase">
                        {item.project_code}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">{item.project_name}</h4>
                    </div>
                    {item.alert_level !== 'NORMAL' && (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase flex items-center gap-1 font-semibold ${
                          item.alert_level === 'CRITICAL_100'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>{item.alert_level}</span>
                      </span>
                    )}
                  </div>

                  {/* Profitability Figures */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 text-[10px] block">Revenue Billed</span>
                      <strong className="text-emerald-700 text-sm">₹{Number(item.revenue).toLocaleString()}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 text-[10px] block">Total Cost</span>
                      <strong className="text-slate-800 text-sm">₹{Number(item.total_cost).toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Net Profit & Margin */}
                  <div className="flex items-center justify-between text-xs font-mono px-1">
                    <span className="text-slate-500">Net Profit:</span>
                    <span className={`font-bold ${item.gross_profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      ₹{Number(item.gross_profit).toLocaleString()} ({item.gross_margin_pct}%)
                    </span>
                  </div>

                  {/* Budget Consumption Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-500">Budget Consumed:</span>
                      <span
                        className={`font-semibold ${
                          isCritical ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-700'
                        }`}
                      >
                        {consumedPct}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full transition-all ${
                          isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(consumedPct, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Generate GST Tax Invoice</h3>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client Account</label>
                <select
                  value={newInvoiceAccount}
                  onChange={(e) => setNewInvoiceAccount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-blue-600"
                >
                  <option value="">Select Client Account...</option>
                  {accounts.map((acc: any) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newInvoiceDueDate}
                    onChange={(e) => setNewInvoiceDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GST Tax Jurisdiction</label>
                  <select
                    value={newInvoiceTaxType}
                    onChange={(e) => setNewInvoiceTaxType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="INTRA_STATE">Intra-State (CGST 9% + SGST 9%)</option>
                    <option value="INTER_STATE">Inter-State (IGST 18%)</option>
                    <option value="SEZ_EXPORT">SEZ / Zero Rated Export (0%)</option>
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-slate-700">Deliverable Line Items</label>
                {invoiceItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Service Description"
                      value={item.description}
                      onChange={(e) => {
                        const copy = [...invoiceItems];
                        copy[idx].description = e.target.value;
                        setInvoiceItems(copy);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => {
                        const copy = [...invoiceItems];
                        copy[idx].quantity = parseInt(e.target.value) || 1;
                        setInvoiceItems(copy);
                      }}
                      className="w-16 px-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                    <input
                      type="number"
                      placeholder="Rate (₹)"
                      value={item.unit_price}
                      onChange={(e) => {
                        const copy = [...invoiceItems];
                        copy[idx].unit_price = parseFloat(e.target.value) || 0;
                        setInvoiceItems(copy);
                      }}
                      className="w-28 px-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={() => createInvoiceMutation.mutate()}
                disabled={!newInvoiceAccount || !newInvoiceDueDate || createInvoiceMutation.isPending}
                className="w-full mt-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-40 transition-colors"
              >
                {createInvoiceMutation.isPending ? 'Generating...' : 'Issue Invoice & Post to Ledger'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Invoice Payment</h3>
                <span className="text-xs font-mono text-blue-600 font-semibold">{selectedInvoice.invoice_number}</span>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount to Credit (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Channel</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-blue-600"
                >
                  <option value="NEFT">Bank NEFT / RTGS</option>
                  <option value="UPI">Corporate UPI</option>
                  <option value="WIRE">International Wire Transfer</option>
                  <option value="CHEQUE">Cheque Clearance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">UTR / Transaction Reference</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR-HDFC-99281726"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                Settling an invoice in full will lock the financial record permanently in accordance with corporate audit compliance.
              </div>

              <button
                onClick={() => recordPaymentMutation.mutate()}
                disabled={!paymentAmount || !paymentReference.trim() || recordPaymentMutation.isPending}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-40 transition-colors"
              >
                {recordPaymentMutation.isPending ? 'Recording...' : 'Confirm Receipt & Update Ledger'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
