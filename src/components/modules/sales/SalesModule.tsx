"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import { Proposal, Contract } from '../../../types';
import { FileText, Shield, Download, Send, CheckCircle2 } from 'lucide-react';

export const SalesModule: React.FC = () => {
  const activeTab = useDemoStore((state) => state.activeTab);
  const proposals = useDemoStore((state) => state.proposals);
  const contracts = useDemoStore((state) => state.contracts);
  const showToast = useDemoStore((state) => state.showToast);

  const [subTab, setSubTab] = useState<'proposals' | 'contracts'>(activeTab === 'contracts' ? 'contracts' : 'proposals');
  const [selectedProp, setSelectedProp] = useState<Proposal | null>(proposals[0] || null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(contracts[0] || null);

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            Sales & Legal Agreements
          </h1>
          <p className="text-xs text-slate-500 mt-1">Enterprise proposals, SOWs, mutual NDAs, and Master Service Agreements</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setSubTab('proposals')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              subTab === 'proposals' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Proposals ({proposals.length})
          </button>
          <button
            onClick={() => setSubTab('contracts')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              subTab === 'contracts' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Contracts & NDAs ({contracts.length})
          </button>
        </div>
      </div>

      {/* SUBTAB 1: PROPOSALS */}
      {subTab === 'proposals' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-5 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">Active Client Proposals</div>
            {proposals.map((prop) => (
              <div
                key={prop.id}
                onClick={() => setSelectedProp(prop)}
                className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                  selectedProp?.id === prop.id
                    ? 'bg-white border-blue-600 shadow-md ring-1 ring-blue-600/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs font-bold text-blue-600">{prop.id}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {prop.status}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mt-1">{prop.title}</h4>
                <div className="text-xs text-slate-500 mt-1">{prop.client}</div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-emerald-600">₹{(prop.value / 100000).toFixed(2)}L</span>
                  <span className="text-[11px] text-slate-500">Expires: {prop.expiry}</span>
                </div>
              </div>
            ))}
          </div>

          {selectedProp && (
            <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <span className="text-xs font-mono text-blue-600 font-bold">{selectedProp.id}</span>
                  <h2 className="text-xl font-bold text-slate-900">{selectedProp.title}</h2>
                  <div className="text-xs text-slate-500">{selectedProp.client} • Created {selectedProp.created}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => showToast('PDF downloaded', 'info')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </button>
                  <button
                    onClick={() => showToast(`Proposal sent to ${selectedProp.client}`, 'success')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" /> Send Proposal
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Executive Summary</h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  {selectedProp.executiveSummary}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Project Scope</h4>
                  <ul className="space-y-1.5">
                    {selectedProp.scope.map((s, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Technology Stack</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProp.technology.map((t, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-mono border border-blue-200">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Milestone Pricing Breakdown</h4>
                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 uppercase text-[10px] font-mono text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Phase / Milestone</th>
                        <th className="p-3 text-right">Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedProp.pricing.map((p, i) => (
                        <tr key={i}>
                          <td className="p-3 font-medium text-slate-900">{p.phase}</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600">₹{p.amount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* SUBTAB 2: CONTRACTS */}
      {subTab === 'contracts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-5 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">Legal Contracts & Agreements</div>
            {contracts.map((ctr) => (
              <div
                key={ctr.id}
                onClick={() => setSelectedContract(ctr)}
                className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                  selectedContract?.id === ctr.id
                    ? 'bg-white border-blue-600 shadow-md ring-1 ring-blue-600/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs font-bold text-blue-600">{ctr.id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                    ctr.status === 'Signed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {ctr.status}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mt-1">{ctr.title}</h4>
                <div className="text-xs text-slate-500 mt-1">{ctr.client}</div>
              </div>
            ))}
          </div>

          {selectedContract && (
            <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <span className="text-xs font-mono text-blue-600 font-bold">{selectedContract.id}</span>
                  <h2 className="text-xl font-bold text-slate-900">{selectedContract.title}</h2>
                  <div className="text-xs text-slate-500">{selectedContract.client} • Type: {selectedContract.type}</div>
                </div>

                <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-mono font-bold border border-emerald-200">
                  {selectedContract.status}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-4">E-Signature Digital Audit Trail</h4>
                <div className="space-y-4 pl-4 border-l-2 border-slate-200 relative">
                  {selectedContract.timeline.map((event, i) => (
                    <div key={i} className="relative pl-6">
                      <div className={`absolute -left-[25px] top-0.5 w-4 h-4 rounded-full border-2 ${
                        event.completed ? 'bg-emerald-600 border-emerald-500' : 'bg-white border-slate-300'
                      }`} />
                      <div className="font-bold text-xs text-slate-900">{event.event}</div>
                      <div className="text-[11px] font-mono text-slate-500">{event.date}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
