'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Briefcase,
  Command,
  FileCheck2,
  FileText,
  FolderGit2,
  Home,
  MessageSquare,
  Plus,
  Receipt,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';

interface WorkspaceNavProps {
  onOpenCommand: () => void;
  onOpenCreate: () => void;
}

export function WorkspaceNav({ onOpenCommand, onOpenCreate }: WorkspaceNavProps) {
  const pathname = usePathname();

  const workspaces = [
    { label: 'HOME', href: '/dashboard', icon: Home },
    { label: 'WORK', href: '/projects', icon: FolderGit2 },
    { label: 'MY WORK', href: '/my-work', icon: UserCheck },
    { label: 'CLIENTS', href: '/crm', icon: Briefcase },
    { label: 'PEOPLE', href: '/people', icon: Users },
    { label: 'FINANCE', href: '/finance', icon: Receipt },
    { label: 'APPROVALS', href: '/approvals', icon: FileCheck2 },
    { label: 'CHAT', href: '/chat', icon: MessageSquare },
    { label: 'DOCS', href: '/documents', icon: FileText },
    { label: 'ANALYTICS', href: '/analytics', icon: Activity },
    { label: 'SECURITY', href: '/security', icon: ShieldCheck },
  ];

  return (
    <div className="flex items-center space-x-1 sm:space-x-2">
      {/* Workspace Switcher Pills */}
      <nav className="flex items-center space-x-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-[280px] sm:max-w-none shadow-2xs">
        {workspaces.map((ws) => {
          const Icon = ws.icon;
          const isActive = pathname === ws.href || (ws.href === '/dashboard' && pathname === '/');
          return (
            <Link
              key={ws.label}
              href={ws.href}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>{ws.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Universal Search / Command Palette Trigger */}
      <button
        onClick={onOpenCommand}
        className="hidden md:flex items-center space-x-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 shadow-2xs transition-colors cursor-pointer"
      >
        <Command className="w-3.5 h-3.5 text-blue-600" />
        <span>Search / Actions...</span>
        <kbd className="text-[10px] font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-semibold">
          ⌘K
        </kbd>
      </button>

      {/* Universal CREATE Button */}
      <button
        onClick={onOpenCreate}
        className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wide shadow-xs transition-all cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>CREATE</span>
      </button>
    </div>
  );
}
