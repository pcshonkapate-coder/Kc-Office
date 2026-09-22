"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../store/demoStore';
import { Search, X, Users, FolderKanban, CheckSquare, Receipt } from 'lucide-react';

export const GlobalSearchModal: React.FC = () => {
  const isOpen = useDemoStore((state) => state.isGlobalSearchOpen);
  const setOpen = useDemoStore((state) => state.setGlobalSearchOpen);
  const setActiveTab = useDemoStore((state) => state.setActiveTab);
  const currentUser = useDemoStore((state) => state.currentUser);

  const leads = useDemoStore((state) => state.leads);
  const projects = useDemoStore((state) => state.projects);
  const tasks = useDemoStore((state) => state.tasks);
  const invoices = useDemoStore((state) => state.invoices);

  const [query, setQuery] = useState('');
  const [serverResults, setServerResults] = useState<{
    projects?: typeof projects;
    tasks?: typeof tasks;
    leads?: typeof leads;
    invoices?: typeof invoices;
  } | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, setOpen]);

  React.useEffect(() => {
    if (!isOpen || !query.trim()) {
      return;
    }
    const token = typeof window !== 'undefined' ? (localStorage.getItem('kapate_token') || localStorage.getItem('kapate_access_token')) : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const timer = setTimeout(() => {
      fetch(`/api/v1/system/search?q=${encodeURIComponent(query)}`, { headers })
        .then(r => r.ok ? r.json() : null)
        .then(json => {
          if (json && json.data) {
            setServerResults(json.data);
          }
        })
        .catch(() => {});
    }, 150);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  const isClient = currentUser.role === 'CLIENT';
  const isIntern = currentUser.role === 'INTERN';
  const canSeeFinance = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'FINANCE';
  const canSeeCommercial = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'PROJECT_MANAGER';

  const activeQuery = query.trim().toLowerCase();
  const effectiveServerResults = activeQuery ? serverResults : null;

  const filteredProjects = !activeQuery ? [] : (effectiveServerResults?.projects || projects.filter(p => {
    if (isClient) return p.client.toLowerCase().includes(currentUser.name.toLowerCase()) && p.name.toLowerCase().includes(activeQuery);
    if (isIntern) return ((p.team && p.team.some(m => m.toLowerCase().includes(currentUser.name.toLowerCase()))) || p.name.toLowerCase().includes('internal') || p.client.toLowerCase().includes('internal')) && p.name.toLowerCase().includes(activeQuery);
    return p.name.toLowerCase().includes(activeQuery);
  }));

  const filteredTasks = !activeQuery ? [] : (effectiveServerResults?.tasks || tasks.filter(t => {
    if (isClient) return (t.clientVisible || t.assignedTo?.toLowerCase().includes(currentUser.name.toLowerCase())) && t.title.toLowerCase().includes(activeQuery);
    if (isIntern) return t.assignedTo?.toLowerCase().includes(currentUser.name.toLowerCase()) && t.title.toLowerCase().includes(activeQuery);
    return t.title.toLowerCase().includes(activeQuery);
  }));

  const filteredLeads = !activeQuery ? [] : (effectiveServerResults?.leads || (canSeeCommercial ? leads.filter(l => {
    return l.name.toLowerCase().includes(activeQuery) || l.company.toLowerCase().includes(activeQuery);
  }) : []));

  const filteredInvoices = !activeQuery ? [] : (effectiveServerResults?.invoices || (canSeeFinance ? invoices.filter(i => {
    return i.id.toLowerCase().includes(activeQuery) || i.client.toLowerCase().includes(activeQuery);
  }) : isClient ? invoices.filter(i => {
    return i.client.toLowerCase().includes(currentUser.name.toLowerCase()) && (i.id.toLowerCase().includes(activeQuery) || i.client.toLowerCase().includes(activeQuery));
  }) : []));

  const handleSelect = (tab: string) => {
    setActiveTab(tab);
    setOpen(false);
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-fade-in text-slate-900"
    >
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <Search className="w-5 h-5 text-blue-600" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads, companies, deals, projects, tasks, invoices..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="p-4 overflow-y-auto space-y-4 custom-scrollbar">
          
          {/* Projects */}
          {filteredProjects.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-blue-600" /> Projects ({filteredProjects.length})
              </div>
              <div className="space-y-1">
                {filteredProjects.map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleSelect('projects')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 cursor-pointer flex items-center justify-between text-xs transition-all"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{p.name}</span>
                      <span className="text-slate-500 text-[11px] ml-2">• {p.client}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">{p.progress}% Complete</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {filteredTasks.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-blue-600" /> Tasks ({filteredTasks.length})
              </div>
              <div className="space-y-1">
                {filteredTasks.map(t => (
                  <div
                    key={t.id}
                    onClick={() => handleSelect('tasks')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 cursor-pointer flex items-center justify-between text-xs transition-all"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{t.title}</span>
                      <span className="text-slate-500 text-[11px] ml-2">Assigned to: {t.assignedTo}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leads */}
          {filteredLeads.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" /> Leads ({filteredLeads.length})
              </div>
              <div className="space-y-1">
                {filteredLeads.map(l => (
                  <div
                    key={l.id}
                    onClick={() => handleSelect('leads')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 cursor-pointer flex items-center justify-between text-xs transition-all"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{l.name}</span>
                      <span className="text-slate-500 text-[11px] ml-2">({l.company})</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">{l.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoices */}
          {filteredInvoices.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-amber-600" /> Invoices ({filteredInvoices.length})
              </div>
              <div className="space-y-1">
                {filteredInvoices.map(i => (
                  <div
                    key={i.id}
                    onClick={() => handleSelect('finance')}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-200 cursor-pointer flex items-center justify-between text-xs transition-all"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{i.id}</span>
                      <span className="text-slate-500 text-[11px] ml-2">— {i.client}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-600">₹{(i.total / 100000).toFixed(2)}L</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
