"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import { X, Settings, Shield, HardDrive, Key, Save, CheckCircle2 } from 'lucide-react';

export const MailSettingsModal: React.FC = () => {
  const isMailSettingsOpen = useDemoStore((state) => state.isMailSettingsOpen);
  const currentUser = useDemoStore((state) => state.currentUser);
  const emailSignatures = useDemoStore((state) => state.emailSignatures);
  const setMailSettingsOpen = useDemoStore((state) => state.setMailSettingsOpen);
  const updateEmailSignature = useDemoStore((state) => state.updateEmailSignature);
  const showToast = useDemoStore((state) => state.showToast);

  const defaultSig = emailSignatures.find(s => s.userId === currentUser.id) || emailSignatures[0];
  const [signatureText, setSignatureText] = useState(defaultSig?.content || '');
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [retentionDays, setRetentionDays] = useState('365');
  const [maxAttachmentMB, setMaxAttachmentMB] = useState('25');

  if (!isMailSettingsOpen) return null;

  const handleSaveSignature = () => {
    updateEmailSignature(currentUser.id, signatureText);
    setMailSettingsOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-700" /> Mailbox Configuration & Signature
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalized signatures, corporate retention policies, and administrative quotas
            </p>
          </div>
          <button onClick={() => setMailSettingsOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-xs">
          
          {/* Signature Editor */}
          <div className="space-y-2">
            <label className="font-extrabold text-slate-900 block text-sm">
              Default Email Signature
            </label>
            <p className="text-slate-500 text-[11px]">
              Automatically appended to the end of all outbound internal emails and replies.
            </p>
            <textarea
              rows={5}
              value={signatureText}
              onChange={(e) => setSignatureText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-600 leading-relaxed"
            />
          </div>

          {/* Out of Office / Auto Responder */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-xs">Out-of-Office Automatic Reply</span>
                <span className="text-[11px] text-slate-500">Notify colleagues automatically when you are on leave or traveling.</span>
              </div>
              <input
                type="checkbox"
                checked={autoReplyEnabled}
                onChange={(e) => setAutoReplyEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Corporate Admin Policy (Admin Role Only) */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Corporate Compliance & Storage Governance</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Max Attachment Cap (MB)</label>
                <select
                  value={maxAttachmentMB}
                  onChange={(e) => setMaxAttachmentMB(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none"
                >
                  <option value="15">15 MB</option>
                  <option value="25">25 MB (Recommended)</option>
                  <option value="50">50 MB</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Audit Log Retention</label>
                <select
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none"
                >
                  <option value="90">90 Days</option>
                  <option value="180">180 Days</option>
                  <option value="365">365 Days (1 Year)</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-3 bg-slate-50/70">
          <button
            type="button"
            onClick={() => setMailSettingsOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveSignature}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>

      </div>
    </div>
  );
};
