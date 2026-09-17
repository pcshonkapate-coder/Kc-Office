"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import { FileText, Download } from 'lucide-react';

export const DocumentsModule: React.FC = () => {
  const documents = useDemoStore((state) => state.documents);
  const showToast = useDemoStore((state) => state.showToast);

  const [filter, setFilter] = useState('All');

  const filteredDocs = filter === 'All' ? documents : documents.filter(d => d.category === filter);

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Centralized Document Library</h1>
          <p className="text-xs text-slate-500 mt-1">Contracts, proposals, NDAs, SOWs, and project documentation</p>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none"
        >
          <option value="All">All Categories</option>
          <option value="Contracts">Contracts</option>
          <option value="Proposals">Proposals</option>
          <option value="NDA">NDA</option>
          <option value="SOW">SOW</option>
          <option value="Invoices">Invoices</option>
          <option value="HR Documents">HR Documents</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 transition-all space-y-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-blue-600 flex items-center justify-center font-bold text-xs font-mono">
                {doc.fileType}
              </div>
              <div className="truncate">
                <div className="font-bold text-slate-900 text-xs truncate">{doc.title}</div>
                <div className="text-[10px] text-slate-500">{doc.category} • {doc.size}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Owner: {doc.owner.split(' ')[0]}</span>
              <button
                onClick={() => showToast(`Downloaded ${doc.title}`, 'success')}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1 font-semibold"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
