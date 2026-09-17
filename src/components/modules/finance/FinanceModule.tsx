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
  const markInvoicePaid = useDemoStore((state) => state.markInvoicePaid);
  const showToast = useDemoStore((state) => state.showToast);

  const [subTab, setSubTab] = useState<'invoices' | 'payments' | 'expenses' | 'profitability'>(
    activeTab === 'profitability' ? 'profitability' : 'invoices'
  );

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(invoices[0] || null);

  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.total, 0);
  const totalOutstanding = invoices.filter(i => i.status !== 'Paid').reduce((sum, i) => sum + i.total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            Finance, Billing & Profitability
          </h1>
          <p className="text-xs text-slate-500 mt-1">Invoices with 18% GST calculation, received payments, operating expenses, and project margins</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setSubTab('invoices')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              subTab === 'invoices' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" /> Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setSubTab('payments')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              subTab === 'payments' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> Payments ({payments.length})
          </button>
          <button
            onClick={() => setSubTab('expenses')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              subTab === 'expenses' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" /> Expenses ({expenses.length})
          </button>
          <button
            onClick={() => setSubTab('profitability')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              subTab === 'profitability' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Project Profitability
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
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
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200"
                  >
                    Download PDF
                  </button>
                  {selectedInvoice.status !== 'Paid' && (
                    <button
                      onClick={() => markInvoicePaid(selectedInvoice.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm"
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
      )}

      {subTab === 'profitability' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Project Profitability Breakdown</h2>
              <div className="text-xs text-slate-500">Project: AI Customer Support Platform (PRJ-001)</div>
            </div>
            <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-mono font-bold border border-emerald-200">
              56.7% Gross Margin
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>AI API expenditure is 18% above forecast due to extra fine-tuning iterations.</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500 text-[10px]">Total Revenue</div>
              <div className="text-base font-bold text-slate-900 mt-1 font-mono">₹15,00,000</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500 text-[10px]">Employee Cost</div>
              <div className="text-base font-bold text-slate-700 mt-1 font-mono">₹4,00,000</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500 text-[10px]">Cloud & GPU Infra</div>
              <div className="text-base font-bold text-slate-700 mt-1 font-mono">₹1,20,000</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500 text-[10px]">AI API Tokens</div>
              <div className="text-base font-bold text-amber-700 mt-1 font-mono">₹80,000</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Calculated Net Gross Profit</div>
              <div className="text-2xl font-black text-emerald-600 font-mono mt-1">₹8,50,000</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Total Direct Expenses</div>
              <div className="text-lg font-bold text-rose-600 font-mono mt-1">₹6,50,000</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
