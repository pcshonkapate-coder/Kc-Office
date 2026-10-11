'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';
import { apiClient } from '../../lib/api-client';
import Link from 'next/link';
import { WorkspaceNav } from '../../components/layout/WorkspaceNav';
import { CommandPalette } from '../../components/layout/CommandPalette';
import { UniversalCreateModal } from '../../components/modals/UniversalCreateModal';
import { AICopilotDrawer } from '../../components/ai/AICopilotDrawer';
import { LogOut, ShieldCheck, Sparkles, User } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAiCopilotOpen, setIsAiCopilotOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      // Proceed with client logout even if backend token expired
    } finally {
      logout();
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top OS Navigation Bar */}
      <header className="h-16 border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        {/* Left: Branding & Workspace Nav */}
        <div className="flex items-center space-x-3.5">
          <Link href="/" className="flex items-center space-x-2 shrink-0">
            <img
              src="/assets/images/KapateConsultancy-Logo-Cropped.png"
              alt="Kapate Consultancy"
              className="h-8 w-auto object-contain"
            />
            <span className="hidden xl:inline-block text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold border border-blue-200">
              OS 3.0
            </span>
          </Link>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Workspace Switcher + Universal CREATE */}
          <WorkspaceNav
            onOpenCommand={() => setIsCommandOpen(true)}
            onOpenCreate={() => setIsCreateOpen(true)}
          />
        </div>

        {/* Right: AI Copilot, User Status & Logout */}
        <div className="flex items-center space-x-2.5">
          {/* AI Copilot Trigger */}
          <button
            onClick={() => setIsAiCopilotOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all"
            title="Open KAPATE AI Copilot"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">KAPATE AI</span>
          </button>

          <div className="hidden sm:flex items-center space-x-2 text-xs bg-slate-100/90 py-1.5 px-3 rounded-xl border border-slate-200">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-800 font-medium">{user?.fullName || 'Active User'}</span>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>{user?.roles?.[0] || 'Staff'}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="flex items-center space-x-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 py-1.5 px-2.5 rounded-xl transition-colors cursor-pointer font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">{children}</main>

      {/* Universal Command Palette (Ctrl/Cmd + K) */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onOpenCreate={() => setIsCreateOpen(true)}
      />

      {/* Universal Create Modal */}
      <UniversalCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* AI Copilot Drawer */}
      <AICopilotDrawer
        isOpen={isAiCopilotOpen}
        onClose={() => setIsAiCopilotOpen(false)}
      />
    </div>
  );
}
