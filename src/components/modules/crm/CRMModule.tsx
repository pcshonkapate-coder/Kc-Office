"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import { Lead, LeadStatus, DealStage } from '../../../types';
import {
  Users, Building2, UserCheck, DollarSign, Search, Plus, Star, Phone, Mail, Calendar
} from 'lucide-react';

export const CRMModule: React.FC = () => {
  const activeTab = useDemoStore((state) => state.activeTab);
  const leads = useDemoStore((state) => state.leads);
  const updateLeadStatus = useDemoStore((state) => state.updateLeadStatus);
  const companies = useDemoStore((state) => state.companies);
  const contacts = useDemoStore((state) => state.contacts);
  const deals = useDemoStore((state) => state.deals);
  const updateDealStage = useDemoStore((state) => state.updateDealStage);
  const setQuickCreateOpen = useDemoStore((state) => state.setQuickCreateOpen);

  const [subTab, setSubTab] = useState<'leads' | 'companies' | 'contacts' | 'deals'>(
    activeTab === 'companies' ? 'companies' : activeTab === 'contacts' ? 'contacts' : activeTab === 'deals' ? 'deals' : 'leads'
  );

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadFilter, setLeadFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const KANBAN_STAGES: DealStage[] = [
    'NEW LEAD',
    'QUALIFICATION',
    'DISCOVERY BOOKED',
    'DISCOVERY COMPLETED',
    'TECHNICAL ASSESSMENT',
    'NDA / MSA',
    'PROPOSAL / SOW',
    'NEGOTIATION',
    'CLOSED WON',
    'CLOSED LOST'
  ];

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = leadFilter === 'All' || l.status === leadFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      
      {/* Header & Sub navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            CRM & Client Relationships
          </h1>
          <p className="text-xs text-slate-500 mt-1">Lead management, corporate accounts, contacts, and 10-stage sales pipeline</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {[
            { id: 'leads', label: 'Leads', icon: Users, count: leads.length },
            { id: 'companies', label: 'Companies', icon: Building2, count: companies.length },
            { id: 'contacts', label: 'Contacts', icon: UserCheck, count: contacts.length },
            { id: 'deals', label: 'Deals Kanban', icon: DollarSign, count: deals.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                subTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SUBTAB 1: LEADS TABLE */}
      {subTab === 'leads' && (
        <div className="space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search leads by name or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={leadFilter}
                onChange={(e) => setLeadFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="New Lead">New Lead</option>
                <option value="Qualified">Qualified</option>
                <option value="Discovery Booked">Discovery Booked</option>
                <option value="Discovery Completed">Discovery Completed</option>
                <option value="Proposal Sent">Proposal Sent</option>
              </select>

              <button
                onClick={() => setQuickCreateOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" /> New Lead
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 uppercase text-[10px] font-mono text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-4">Lead ID</th>
                    <th className="p-4">Contact & Company</th>
                    <th className="p-4">Service</th>
                    <th className="p-4">Budget</th>
                    <th className="p-4">Score</th>
                    <th className="p-4">Owner</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-mono text-blue-600 font-bold">{lead.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-xs">{lead.name}</div>
                        <div className="text-[11px] text-slate-500">{lead.company}</div>
                      </td>
                      <td className="p-4 font-medium text-slate-700">{lead.service}</td>
                      <td className="p-4 font-mono font-bold text-emerald-600">{lead.budget}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="font-bold text-slate-900">{lead.score}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-700 font-medium">{lead.owner}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold border bg-blue-50 text-blue-700 border-blue-200">
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUBTAB 2: COMPANIES VIEW */}
      {subTab === 'companies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {companies.map((comp) => (
            <div key={comp.id} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" /> {comp.name}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">{comp.industry} • {comp.location}</div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                  {comp.totalRevenue} Rev
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <div className="text-slate-500 text-[10px]">Contacts</div>
                  <div className="font-bold text-slate-900 mt-0.5">{comp.contactsCount}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">Deals</div>
                  <div className="font-bold text-slate-900 mt-0.5">{comp.dealsCount}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">Projects</div>
                  <div className="font-bold text-blue-600 mt-0.5">{comp.activeProjects}</div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Key Account Contacts</div>
                <div className="space-y-1.5">
                  {comp.contacts.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div>
                        <span className="font-semibold text-slate-900">{c.name}</span>
                        <span className="text-slate-500 text-[11px] ml-2">({c.designation})</span>
                      </div>
                      <span className="text-[10px] text-blue-600 font-mono font-medium">{c.relationship}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 3: CONTACTS VIEW */}
      {subTab === 'contacts' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 uppercase text-[10px] font-mono text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-4">Contact Name</th>
                  <th className="p-4">Designation & Company</th>
                  <th className="p-4">Email & Phone</th>
                  <th className="p-4">Relationship Role</th>
                  <th className="p-4">Last Contacted</th>
                  <th className="p-4 text-right">Account Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{c.name}</td>
                    <td className="p-4">
                      <div className="text-xs text-slate-900 font-medium">{c.designation}</div>
                      <div className="text-[11px] text-slate-500">{c.company}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-blue-600 font-mono text-[11px] font-medium">{c.email}</div>
                      <div className="text-slate-500 text-[11px]">{c.phone}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200">
                        {c.relationship}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-500">{c.lastContacted}</td>
                    <td className="p-4 text-right font-medium text-slate-700">{c.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: DEALS KANBAN PIPELINE */}
      {subTab === 'deals' && (
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {KANBAN_STAGES.map((stage) => {
            const stageDeals = deals.filter(d => d.stage === stage);
            const totalStageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

            return (
              <div key={stage} className="min-w-[280px] max-w-[280px] rounded-3xl bg-slate-50 border border-slate-200 p-3.5 flex flex-col justify-between shrink-0 shadow-xs">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                    <div>
                      <div className="text-[11px] font-mono font-bold text-slate-900 uppercase tracking-wider">{stage}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{stageDeals.length} deals • ₹{(totalStageValue / 100000).toFixed(1)}L</div>
                    </div>
                    <span className="w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold font-mono">
                      {stageDeals.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-xs space-y-2 group cursor-pointer"
                      >
                        <div className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition-colors">
                          {deal.title}
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center justify-between">
                          <span>{deal.company}</span>
                          <span className="font-mono font-bold text-emerald-600">₹{(deal.value / 100000).toFixed(2)}L</span>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className="text-slate-600">{deal.owner}</span>
                          <span className="text-blue-600 font-mono font-bold">{deal.probability}% prob</span>
                        </div>

                        <div className="pt-1 flex items-center justify-end">
                          <select
                            value={deal.stage}
                            onChange={(e) => updateDealStage(deal.id, e.target.value as DealStage)}
                            className="bg-slate-50 border border-slate-200 text-[10px] text-slate-700 rounded px-1.5 py-0.5 focus:outline-none"
                          >
                            {KANBAN_STAGES.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LEAD DETAIL DRAWER MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="font-mono text-xs text-blue-600 font-bold">{selectedLead.id}</span>
                <h3 className="text-xl font-bold text-slate-900">{selectedLead.name}</h3>
                <div className="text-xs text-slate-500">{selectedLead.company}</div>
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 text-[10px]">Required Service</div>
                <div className="font-bold text-slate-900 mt-1">{selectedLead.service}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 text-[10px]">Estimated Budget</div>
                <div className="font-bold text-emerald-600 mt-1">{selectedLead.budget}</div>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Requirement Notes</div>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-200">{selectedLead.description}</p>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-2">
              <button className="p-2.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1 border border-slate-200">
                <Phone className="w-3.5 h-3.5" /> Call
              </button>
              <button className="p-2.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1 border border-slate-200">
                <Mail className="w-3.5 h-3.5" /> Email
              </button>
              <button className="p-2.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1 border border-slate-200">
                <Calendar className="w-3.5 h-3.5" /> Meeting
              </button>
              <button
                onClick={() => {
                  updateLeadStatus(selectedLead.id, 'Qualified');
                  setSelectedLead(null);
                }}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
              >
                Qualify
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
