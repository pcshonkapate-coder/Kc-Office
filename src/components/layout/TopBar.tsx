"use client";

import React, { useState, useEffect } from 'react';
import { useDemoStore } from '../../store/demoStore';
import {
  Search, Plus, Bell, Globe, LogOut, ChevronDown, Shield, Eye,
  Briefcase, Clock, Square, GraduationCap, Sparkles, FolderPlus,
  CheckSquare, UserPlus, Receipt, Mail, FileText, ArrowRight
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const currentUser = useDemoStore((state) => state.currentUser);
  const notifications = useDemoStore((state) => state.notifications);
  const markNotificationRead = useDemoStore((state) => state.markNotificationRead);
  const setQuickCreateOpen = useDemoStore((state) => state.setQuickCreateOpen);
  const setGlobalSearchOpen = useDemoStore((state) => state.setGlobalSearchOpen);
  const switchRole = useDemoStore((state) => state.switchRole);
  const showToast = useDemoStore((state) => state.showToast);
  const impersonatedOriginalUser = useDemoStore((state) => state.impersonatedOriginalUser);
  const setActiveTab = useDemoStore((state) => state.setActiveTab);
  const setMailComposeOpen = useDemoStore((state) => state.setMailComposeOpen);
  const logout = useDemoStore((state) => state.logout);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showQuickCreateMenu, setShowQuickCreateMenu] = useState(false);
  const [aiInputText, setAiInputText] = useState('');

  // Server-Authoritative Clock-In / Clock-Out Timer
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [serverStartTime, setServerStartTime] = useState<number | null>(null);

  // Sync active session from server on mount or user change
  useEffect(() => {
    let isMounted = true;
    const checkServerClock = async () => {
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('kapate_token') || localStorage.getItem('kapate_access_token')) : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/v1/workforce/attendance?status=active', { headers });
        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            if (json.active && json.session) {
              setIsClockedIn(true);
              setServerStartTime(json.session.clockInTimestamp);
              setElapsedSeconds(json.session.elapsedSeconds || Math.max(0, Math.floor((Date.now() - json.session.clockInTimestamp) / 1000)));
            } else {
              setIsClockedIn(false);
              setServerStartTime(null);
              setElapsedSeconds(0);
            }
          }
        }
      } catch (err) {
        console.warn('[TopBar] Attendance sync notice:', err);
      }
    };

    checkServerClock();
    return () => { isMounted = false; };
  }, [currentUser.id]);

  // Smooth local second counter while clocked in
  useEffect(() => {
    if (!isClockedIn || !serverStartTime) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - serverStartTime) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [isClockedIn, serverStartTime]);

  const handleToggleClock = async () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('kapate_token') || localStorage.getItem('kapate_access_token')) : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    if (!isClockedIn) {
      try {
        const res = await fetch('/api/v1/workforce/attendance', {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'CLOCK_IN' })
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setIsClockedIn(true);
          const start = json.clockInTimestamp || Date.now();
          setServerStartTime(start);
          setElapsedSeconds(0);
          showToast(`Clocked in successfully at ${json.clockInFormatted || 'now'}. Server session active.`, 'success');
        } else {
          showToast(json.error || 'Failed to clock in on server.', 'error');
        }
      } catch (err: any) {
        showToast(err.message || 'Network error during Clock-In', 'error');
      }
    } else {
      try {
        const res = await fetch('/api/v1/workforce/attendance', {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'CLOCK_OUT' })
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setIsClockedIn(false);
          setServerStartTime(null);
          setElapsedSeconds(0);
          showToast(`Clocked out. ${json.totalHours} hrs logged to authoritative timesheet.`, 'success');
          // Refresh store timesheets
          useDemoStore.getState().fetchTimesheets?.();
        } else {
          showToast(json.error || 'Failed to clock out on server.', 'error');
        }
      } catch (err: any) {
        showToast(err.message || 'Network error during Clock-Out', 'error');
      }
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-purple-950 text-purple-300 border-purple-800 font-bold',
    ADMIN: 'bg-slate-800 text-slate-200 border-slate-700',
    EMPLOYEE: 'bg-blue-950 text-blue-300 border-blue-800',
    INTERN: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    CLIENT: 'bg-amber-950 text-amber-300 border-amber-800',
    FINANCE: 'bg-rose-950 text-rose-300 border-rose-800',
    PROJECT_MANAGER: 'bg-indigo-950 text-indigo-300 border-indigo-800',
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
  };

  const handleSwitchRole = (roleKey: string) => {
    switchRole(roleKey);
    setShowUserMenu(false);
    showToast(`Switched view to ${roleKey} persona`, 'info');
  };

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInputText.trim()) {
      setActiveTab('ai-assistant');
      return;
    }
    useDemoStore.getState().setAiPromptQuery(aiInputText.trim());
    setActiveTab('ai-assistant');
    setAiInputText('');
  };

  const websiteUrl = process.env.NEXT_PUBLIC_MAIN_SITE_URL || process.env.NEXT_PUBLIC_WEBSITE_URL || '/';

  return (
    <header className="h-16 bg-slate-950/95 backdrop-blur-md border-b border-slate-850 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xl">
      
      {/* Search & AI Command Input */}
      <div className="flex items-center gap-3 flex-1 max-w-xl min-w-0">
        {/* Global Search Trigger */}
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-white hover:border-slate-700 transition-all shadow-inner group shrink-0"
          title="Search enterprise records (⌘K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          <span className="hidden md:inline font-mono text-[10px] text-slate-500">⌘K</span>
        </button>

        {/* Prominent Natural Language ✨ Ask Kapate AI Input */}
        <form onSubmit={handleAiSubmit} className="flex-1 relative min-w-0">
          <div className="relative flex items-center">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Ask Kapate AI or search any contract, invoice, code, sprint..."
              value={aiInputText}
              onChange={(e) => setAiInputText(e.target.value)}
              className="w-full pl-8 pr-12 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:bg-slate-900 transition-all shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-bold transition-all"
            >
              Ask
            </button>
          </div>
        </form>
      </div>

      {/* Right Top Bar Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 ml-3">

        {/* SERVER-AUTHORITATIVE CLOCK-IN / CLOCK-OUT WIDGET (For internal team) */}
        {currentUser.role !== 'CLIENT' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-800 bg-slate-900/90 shadow-sm">
            {isClockedIn ? (
              <>
                <div className="flex items-center gap-1.5 px-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-400">{formatTimer(elapsedSeconds)}</span>
                </div>
                <button
                  onClick={handleToggleClock}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition-all shadow-sm cursor-pointer"
                  title="Clock out and record hours"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span className="hidden sm:inline">Clock Out</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleToggleClock}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-all shadow-sm cursor-pointer"
                title="Clock in to track active working hours"
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clock In</span>
              </button>
            )}
          </div>
        )}

        {/* QUICK CREATE (+) DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setShowQuickCreateMenu(!showQuickCreateMenu)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Create</span>
            <ChevronDown className="w-3 h-3 opacity-80" />
          </button>

          {showQuickCreateMenu && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-fade-in space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Quick Action
              </div>
              <button
                onClick={() => {
                  setShowQuickCreateMenu(false);
                  setQuickCreateOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
              >
                <FolderPlus className="w-4 h-4 text-cyan-400" /> New Project
              </button>
              <button
                onClick={() => {
                  setShowQuickCreateMenu(false);
                  setQuickCreateOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
              >
                <CheckSquare className="w-4 h-4 text-emerald-400" /> New Task
              </button>
              <button
                onClick={() => {
                  setShowQuickCreateMenu(false);
                  setQuickCreateOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
              >
                <UserPlus className="w-4 h-4 text-indigo-400" /> Inbound Lead
              </button>
              <button
                onClick={() => {
                  setShowQuickCreateMenu(false);
                  setQuickCreateOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
              >
                <Receipt className="w-4 h-4 text-amber-400" /> New Invoice
              </button>
              <button
                onClick={() => {
                  setShowQuickCreateMenu(false);
                  setMailComposeOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
              >
                <Mail className="w-4 h-4 text-blue-400" /> Draft Email
              </button>
            </div>
          )}
        </div>

        {/* NOTIFICATIONS DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white transition-colors relative"
            title="System notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="font-bold text-xs text-white">System Notifications</span>
                <span className="text-[10px] text-slate-400">{unreadCount} unread</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">No new notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                        n.read ? 'bg-slate-950/40 text-slate-500' : 'bg-slate-950 text-slate-200 border border-cyan-500/30'
                      }`}
                    >
                      <div className="font-semibold text-white mb-0.5">{n.title}</div>
                      <div className="text-[11px] text-slate-400">{n.message}</div>
                      <div className="text-[9px] text-slate-500 mt-1">{n.timestamp}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* USER PROFILE & PERSONA SWITCHER */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 transition-colors"
          >
            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-white leading-tight">{currentUser.name}</div>
              <div className={`text-[9px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.2 rounded border inline-block mt-0.5 ${roleColors[currentUser.role]}`}>
                {currentUser.role}
              </div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-50 animate-fade-in space-y-2">
              <div className="px-3 py-2 border-b border-slate-800">
                <div className="text-xs font-bold text-white">{currentUser.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{currentUser.email}</div>
                <div className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border inline-block mt-1 ${roleColors[currentUser.role]}`}>
                  Active: {currentUser.role}
                </div>
              </div>

              {/* Persona Switcher (For testing & super admins) */}
              {(currentUser.role === 'SUPER_ADMIN' || impersonatedOriginalUser?.role === 'SUPER_ADMIN') && (
                <div className="py-1 border-b border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400 px-3 mb-1.5 tracking-wider flex items-center gap-1">
                    <Shield className="w-3 h-3 text-purple-400" /> Switch Persona View
                  </div>
                  {[
                    { role: 'ADMIN', label: 'Admin / Manager', icon: Shield, color: 'text-purple-400' },
                    { role: 'PROJECT_MANAGER', label: 'Delivery PM', icon: Shield, color: 'text-indigo-400' },
                    { role: 'CLIENT', label: 'Client Portal', icon: Eye, color: 'text-amber-400' },
                    { role: 'EMPLOYEE', label: 'Solutions Engineer', icon: Briefcase, color: 'text-blue-400' },
                    { role: 'INTERN', label: 'Technical Intern', icon: GraduationCap, color: 'text-emerald-400' },
                  ].map((p) => (
                    <button
                      key={p.role}
                      onClick={() => handleSwitchRole(p.role)}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        (currentUser.role as string) === p.role ? 'bg-slate-800 font-bold text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <p.icon className={`w-3.5 h-3.5 ${p.color}`} /> {p.label}
                      </span>
                      {(currentUser.role as string) === p.role && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                    </button>
                  ))}
                </div>
              )}

              {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') && (
                <button
                  onClick={() => {
                    useDemoStore.getState().setActiveTab('super-admin');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-900 transition-colors font-bold"
                >
                  <Shield className="w-4 h-4 text-indigo-400" /> Super Admin Center
                </button>
              )}

              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <Globe className="w-4 h-4 text-cyan-400" /> Public Website
              </a>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-950/40 transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
export default TopBar;
