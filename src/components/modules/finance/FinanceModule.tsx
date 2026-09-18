"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import { Invoice } from '../../../types';
import { Receipt, DollarSign, AlertTriangle, CreditCard, Sparkles } from 'lucide-react';

export const FinanceModule: React.FC = () => {
  const activeTab = useDemoStore((state) => state.activeTab);
  const invoices = useDemoStore((state) => state.invoices);
  const payments = useDemoStore((state) => state.payments);
  const expenses = useDemoStore((state) => state.expenses);
  const projects = useDemoStore((state) => state.projects);
  const markInvoicePaid = useDemoStore((state) => state.markInvoicePaid);
  const showToast = useDemoStore((state) => state.showToast);

  const [subTab, setSubTab] = useState<'invoices' | 'payments' | 'expenses' | 'profitability'>(
    activeTab === 'profitability' ? 'profitability' : 'invoices'
  );

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(invoices[0] || null);

  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.total, 0);
  const totalOutstanding = invoices.filter(i => i.status !== 'Paid').reduce((sum, i) => sum + i.total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const activeProjectWithProfit = projects.find(p => p.profitability) || projects[0];

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            Finance, Billing & Profitability
          </h1>
          <p className="text-xs text-slate-500 mt-1">Invoices with GST calculation, received payments, operating expenses, and dynamic project margins</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setSubTab('invoices')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'invoices' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" /> Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setSubTab('payments')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'payments' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Payments ({payments.length})
          </button>
          <button
            onClick={() => setSubTab('expenses')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'expenses' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" /> Expenses ({expenses.length})
          </button>
          <button
            onClick={() => setSubTab('profitability')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'profitability' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Project Profitability
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-semibold">Total Collected Revenue</div>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-1">₹{(totalRevenue / 100000).toFixed(2)}L</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-semibold">Outstanding Receivables</div>
          <div className="text-2xl font-black text-amber-600 font-mono mt-1">₹{(totalOutstanding / 100000).toFixed(2)}L</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-semibold">Total Expenses Logged</div>
          <div className="text-2xl font-black text-rose-600 font-mono mt-1">₹{(totalExpenses / 100000).toFixed(2)}L</div>
        </div>
      </div>

      {subTab === 'invoices' && (
        invoices.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white border border-dashed border-slate-200 text-center space-y-2">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-800">No Invoices Issued</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create tax invoices for clients with automated GST calculations and milestone tracking.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">Invoices Directory</div>
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                    selectedInvoice?.id === inv.id
                      ? 'bg-white border-blue-600 shadow-md ring-1 ring-blue-600/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs font-bold text-blue-600">{inv.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{inv.client}</h4>
                  <div className="text-xs text-slate-500">{inv.projectName}</div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-emerald-600">₹{(inv.total / 100000).toFixed(2)}L</span>
                    <span className="text-slate-500 text-[11px]">Due: {inv.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>

            {selectedInvoice && (
              <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div>
                    <span className="text-xs font-mono text-blue-600 font-bold">{selectedInvoice.id}</span>
                    <h2 className="text-xl font-bold text-slate-900">{selectedInvoice.client}</h2>
                    <div className="text-xs text-slate-500">GSTIN: {selectedInvoice.gstin}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => showToast(`Invoice ${selectedInvoice.id} PDF downloaded`, 'info')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200 cursor-pointer"
                    >
                      Download PDF
                    </button>
                    {selectedInvoice.status !== 'Paid' && (
                      <button
                        onClick={() => markInvoicePaid(selectedInvoice.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm cursor-pointer"
                      >
                        Mark as Paid
                      </button>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 uppercase text-[10px] font-mono text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Item Description</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedInvoice.items.map((item, i) => (
                        <tr key={i}>
                          <td className="p-3 font-medium text-slate-900">{item.description}</td>
                          <td className="p-3 text-right font-mono text-slate-700">₹{item.amount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-mono">₹{selectedInvoice.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>GST (18%)</span>
                    <span className="font-mono">₹{selectedInvoice.tax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-slate-900 text-sm">
                    <span>Total Payable</span>
                    <span className="font-mono text-emerald-600">₹{selectedInvoice.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {subTab === 'payments' && (
        payments.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white border border-dashed border-slate-200 text-center space-y-2">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-800">No Payments Recorded</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Bank wire transfers, UPI receipts, and settled client payments will appear here with transaction reference numbers.
            </p>
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Received Transactions</h3>
            <div className="space-y-2">
              {payments.map(p => (
                <div key={p.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-mono font-bold text-slate-900">{p.id} • {p.method}</div>
                    <div className="text-[11px] text-slate-500">Invoice: {p.invoiceId} • Date: {p.date}</div>
                  </div>
                  <span className="font-mono font-bold text-emerald-600">₹{p.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {subTab === 'expenses' && (
        expenses.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white border border-dashed border-slate-200 text-center space-y-2">
            <DollarSign className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-800">No Expenses Logged</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Track project disbursements, cloud infrastructure costs, API token usage, and company operations here.
            </p>
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Operating Expenses</h3>
            <div className="space-y-2">
              {expenses.map(e => (
                <div key={e.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{e.vendor} {e.projectName ? `(${e.projectName})` : ''}</div>
                    <div className="text-[11px] text-slate-500">Category: {e.category} • Date: {e.date} • {e.status}</div>
                  </div>
                  <span className="font-mono font-bold text-rose-600">₹{e.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {subTab === 'profitability' && (
        activeProjectWithProfit?.profitability ? (
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Project Profitability Breakdown</h2>
                <div className="text-xs text-slate-500">Project: {activeProjectWithProfit.name} ({activeProjectWithProfit.id})</div>
              </div>
              <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-mono font-bold border border-emerald-200">
                {activeProjectWithProfit.profitability.grossMargin}% Gross Margin
              </span>
            </div>

            {activeProjectWithProfit.profitability.alertMessage && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{activeProjectWithProfit.profitability.alertMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 text-[10px]">Total Revenue</div>
                <div className="text-base font-bold text-slate-900 mt-1 font-mono">
                  ₹{activeProjectWithProfit.profitability.revenue.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 text-[10px]">Direct Project Cost</div>
                <div className="text-base font-bold text-slate-700 mt-1 font-mono">
                  ₹{(activeProjectWithProfit.profitability.employeeCost + activeProjectWithProfit.profitability.cloudCost + activeProjectWithProfit.profitability.aiApiCost + activeProjectWithProfit.profitability.otherCost).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 text-[10px]">Gross Profit</div>
                <div className="text-base font-bold text-emerald-600 mt-1 font-mono">
                  ₹{activeProjectWithProfit.profitability.grossProfit.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 text-[10px]">Margin Percentage</div>
                <div className="text-base font-bold text-blue-600 mt-1 font-mono">
                  {activeProjectWithProfit.profitability.grossMargin}%
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 rounded-3xl bg-white border border-dashed border-slate-200 text-center space-y-2">
            <Sparkles className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-800">No Project Profitability Audits</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Real-time profitability, cost audits, and gross margin ratios are dynamically computed when billable projects and milestones are executed.
            </p>
          </div>
        )
      )}

    </div>
  );
};
