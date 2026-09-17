"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import { MailSidebar } from './MailSidebar';
import { MailList } from './MailList';
import { MailDetail } from './MailDetail';
import { MailComposeModal } from './MailComposeModal';
import { MailTemplatesModal } from './MailTemplatesModal';
import { MailSettingsModal } from './MailSettingsModal';
import { Shield, Lock, Mail, ArrowLeft } from 'lucide-react';

export const MailModule: React.FC = () => {
  const currentUser = useDemoStore((state) => state.currentUser);
  const selectedEmailThreadId = useDemoStore((state) => state.selectedEmailThreadId);
  const setSelectedEmailThreadId = useDemoStore((state) => state.setSelectedEmailThreadId);

  // Security Check: External Client Portal accounts are strictly restricted from internal mail
  if (currentUser.role === 'CLIENT') {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-amber-200 shadow-sm max-w-xl mx-auto mt-12 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="font-extrabold text-slate-900 text-base">Internal Mail Restricted</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          The Internal Mail Module is exclusively available to authorized Kapate Consultancy personnel (Employees, Interns, Contractors, and Leadership). Clients should communicate through the Client Portal messaging and action items.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden animate-fade-in text-slate-900 relative">
      
      {/* 3-Pane Desktop Layout & Responsive Mobile Flow */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        
        {/* Left Pane: Mailbox & Folder Navigation */}
        <div className="hidden md:flex shrink-0">
          <MailSidebar />
        </div>

        {/* Center Pane: Message List */}
        <div
          className={`flex-1 lg:flex-none transition-all ${
            selectedEmailThreadId ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <MailList />
        </div>

        {/* Right Pane: Thread Detail View */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all ${
            selectedEmailThreadId ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Mobile Back Button */}
          {selectedEmailThreadId && (
            <div className="lg:hidden p-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <button
                onClick={() => setSelectedEmailThreadId(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Inbox</span>
              </button>
            </div>
          )}

          <MailDetail />
        </div>

      </div>

      {/* Global Modals */}
      <MailComposeModal />
      <MailTemplatesModal />
      <MailSettingsModal />

    </div>
  );
};
