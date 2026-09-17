"use client";

import React from 'react';
import { useDemoStore } from '../../../store/demoStore';
import { MailFolder } from '../../../types';
import {
  Inbox, Send, FileText, Star, Bookmark, Archive, Trash2,
  AlertOctagon, Plus, Tag, Settings, Layers, HardDrive,
  Users, Building2, Shield, CheckCircle2, ChevronDown, Sparkles
} from 'lucide-react';

export const MailSidebar: React.FC = () => {
  const currentUser = useDemoStore((state) => state.currentUser);
  const emailAccounts = useDemoStore((state) => state.emailAccounts);
  const emailThreads = useDemoStore((state) => state.emailThreads);
  const emailLabels = useDemoStore((state) => state.emailLabels);
  const activeMailFolder = useDemoStore((state) => state.activeMailFolder);
  const selectedMailLabel = useDemoStore((state) => state.selectedMailLabel);
  const activeEmailAccountEmail = useDemoStore((state) => state.activeEmailAccountEmail);
  const setActiveMailFolder = useDemoStore((state) => state.setActiveMailFolder);
  const setSelectedMailLabel = useDemoStore((state) => state.setSelectedMailLabel);
  const setActiveEmailAccountEmail = useDemoStore((state) => state.setActiveEmailAccountEmail);
  const setMailComposeOpen = useDemoStore((state) => state.setMailComposeOpen);
  const setMailTemplatesOpen = useDemoStore((state) => state.setMailTemplatesOpen);
  const setMailSettingsOpen = useDemoStore((state) => state.setMailSettingsOpen);

  // Folder counts
  const inboxUnread = emailThreads.filter(t => t.folder === 'INBOX' && t.isUnread).length;
  const starredCount = emailThreads.filter(t => t.isStarred).length;
  const importantCount = emailThreads.filter(t => t.isImportant).length;
  const draftsCount = emailThreads.filter(t => t.folder === 'DRAFTS').length;
  const sentCount = emailThreads.filter(t => t.folder === 'SENT').length;
  const trashCount = emailThreads.filter(t => t.folder === 'TRASH').length;
  const spamCount = emailThreads.filter(t => t.folder === 'SPAM').length;

  const currentAccount = emailAccounts.find(a => a.email === activeEmailAccountEmail) || emailAccounts[0];

  // Shared department accounts authorized for current user
  const accessibleAccounts = emailAccounts.filter(acc => {
    if (!acc.isShared) return true;
    if (currentUser.role === 'ADMIN') return true;
    if (acc.allowedRoles?.includes(currentUser.role)) return true;
    return false;
  });

  const FOLDERS: { id: MailFolder; label: string; icon: React.FC<{ className?: string }>; count?: number }[] = [
    { id: 'INBOX', label: 'Inbox', icon: Inbox, count: inboxUnread },
    { id: 'STARRED', label: 'Starred', icon: Star, count: starredCount },
    { id: 'IMPORTANT', label: 'Important', icon: Bookmark, count: importantCount },
    { id: 'SENT', label: 'Sent Mail', icon: Send, count: sentCount },
    { id: 'DRAFTS', label: 'Drafts', icon: FileText, count: draftsCount },
    { id: 'ARCHIVE', label: 'Archive', icon: Archive },
    { id: 'SPAM', label: 'Spam', icon: AlertOctagon, count: spamCount },
    { id: 'TRASH', label: 'Trash', icon: Trash2, count: trashCount },
  ];

  return (
    <div className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 select-none">
      
      {/* Compose Button & Account Selector */}
      <div className="p-4 space-y-3 border-b border-slate-100">
        
        {/* COMPOSE BUTTON */}
        <button
          onClick={() => setMailComposeOpen(true)}
          className="w-full py-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer group"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
          <span>Compose Email</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[9px] bg-blue-500/40 rounded text-white font-mono ml-auto">C</kbd>
        </button>

        {/* ACTIVE ACCOUNT SELECTOR (Supports Shared Department Mailboxes) */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block px-1">
            Active Mailbox
          </label>
          <div className="relative">
            <select
              value={activeEmailAccountEmail}
              onChange={(e) => setActiveEmailAccountEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 transition-colors cursor-pointer appearance-none pr-8"
            >
              <optgroup label="Personal Email Accounts">
                {accessibleAccounts.filter(a => !a.isShared).map((acc) => (
                  <option key={acc.id} value={acc.email}>
                    {acc.name} ({acc.email.split('@')[0]})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Shared Department Mailboxes">
                {accessibleAccounts.filter(a => a.isShared).map((acc) => (
                  <option key={acc.id} value={acc.email}>
                    {acc.name} ({acc.email})
                  </option>
                ))}
              </optgroup>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

      </div>

      {/* Main Mailbox Folder Navigation */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar">
        
        {/* Core Folders */}
        <div className="space-y-0.5">
          {FOLDERS.map((f) => {
            const isActive = activeMailFolder === f.id && !selectedMailLabel;
            const Icon = f.icon;

            return (
              <button
                key={f.id}
                onClick={() => setActiveMailFolder(f.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="truncate">{f.label}</span>
                </div>
                {f.count !== undefined && f.count > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {f.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Company Labels */}
        <div className="space-y-1 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <Tag className="w-3 h-3" /> Labels
            </span>
          </div>
          <div className="space-y-0.5">
            {emailLabels.map((lbl) => {
              const isLabelActive = selectedMailLabel === lbl.name;

              return (
                <button
                  key={lbl.id}
                  onClick={() => setSelectedMailLabel(isLabelActive ? null : lbl.name)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-all ${
                    isLabelActive
                      ? 'bg-slate-100 font-bold text-slate-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-2.5 h-2.5 rounded-full ${lbl.bgColor} border ${lbl.borderColor}`} />
                    <span className="truncate">{lbl.name}</span>
                  </div>
                  {isLabelActive && (
                    <span className="text-[10px] text-blue-600 font-bold">Active</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Shortcuts & Utilities */}
        <div className="space-y-1 pt-2 border-t border-slate-100">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-3 py-1">
            Productivity Tools
          </div>
          <button
            onClick={() => setMailTemplatesOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Email Templates</span>
          </button>
          <button
            onClick={() => setMailSettingsOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Signatures & Settings</span>
          </button>
        </div>

      </div>

      {/* Storage Quota Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/70 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" /> Mailbox Storage
          </span>
          <span className="font-mono font-bold text-slate-700">
            {(currentAccount.quotaUsedMB / 1024).toFixed(1)} GB / {(currentAccount.quotaTotalMB / 1024).toFixed(0)} GB
          </span>
        </div>
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (currentAccount.quotaUsedMB / currentAccount.quotaTotalMB) * 100)}%` }}
          />
        </div>
        <div className="text-[10px] text-slate-400 text-center font-mono">
          Kapate OS Mail v2026.9 • Encrypted At Rest
        </div>
      </div>

    </div>
  );
};
