"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import { EmailTemplate } from '../../../types';
import { X, Layers, Plus, FileText, Check, ArrowRight, Sparkles } from 'lucide-react';

export const MailTemplatesModal: React.FC = () => {
  const isMailTemplatesOpen = useDemoStore((state) => state.isMailTemplatesOpen);
  const emailTemplates = useDemoStore((state) => state.emailTemplates);
  const setMailTemplatesOpen = useDemoStore((state) => state.setMailTemplatesOpen);
  const setMailComposeOpen = useDemoStore((state) => state.setMailComposeOpen);

  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(emailTemplates[0]);

  if (!isMailTemplatesOpen) return null;

  const handleUseTemplate = (tmpl: EmailTemplate) => {
    setMailTemplatesOpen(false);
    setMailComposeOpen(true, {
      subject: tmpl.subject.replace('{{project_name}}', 'Project Nexus'),
      body: tmpl.body
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" /> Company Email Templates
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Standardized enterprise communications with dynamic variable injection
            </p>
          </div>
          <button onClick={() => setMailTemplatesOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Left list, Right preview */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* Template List */}
          <div className="md:col-span-5 border-r border-slate-200 p-4 overflow-y-auto space-y-2 custom-scrollbar bg-slate-50/40">
            {emailTemplates.map((tmpl) => {
              const isSelected = selectedTemplate.id === tmpl.id;

              return (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-purple-500 shadow-sm ring-1 ring-purple-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {tmpl.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {tmpl.variables.length} vars
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs mt-1">{tmpl.title}</h4>
                  <p className="text-[11px] text-slate-500 truncate mt-1">{tmpl.subject}</p>
                </div>
              );
            })}
          </div>

          {/* Template Preview */}
          <div className="md:col-span-7 p-6 overflow-y-auto space-y-4 custom-scrollbar flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subject Preview</span>
                <div className="text-sm font-extrabold text-slate-900 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {selectedTemplate.subject}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Template Body</span>
                <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-200 font-sans mt-1">
                  {selectedTemplate.body}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Variable Placeholders
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedTemplate.variables.map(v => (
                    <span key={v} className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setMailTemplatesOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleUseTemplate(selectedTemplate)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20"
              >
                <span>Use in New Email</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
