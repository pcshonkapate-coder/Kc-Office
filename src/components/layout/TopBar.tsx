"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../store/demoStore';
import {
  Search, Plus, Bell, Globe, LogOut, ChevronDown, Shield, Eye, Briefcase
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

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-purple-100 text-purple-800 border-purple-300 font-bold',
    ADMIN: 'bg-slate-100 text-slate-800 border-slate-300',
    EMPLOYEE: 'bg-blue-50 text-blue-700 border-blue-200',
    INTERN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CLIENT: 'bg-amber-50 text-amber-700 border-amber-200',
    FINANCE: 'bg-rose-50 text-rose-700 border-rose-200',
    PROJECT_MANAGER: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const logout = useDemoStore((state) => state.logout);

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
  };

  const handleSwitchRole = (roleKey: string) => {
    switchRole(roleKey);
    setShowUserMenu(false);
    showToast(`Switched view to ${roleKey} persona`, 'info');
  };

  const websiteUrl = process.env.NEXT_PUBLIC_MAIN_SITE_URL || process.env.NEXT_PUBLIC_WEBSITE_URL || '/';

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      
      {/* Global Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all shadow-xs group"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          <span className="flex-1 text-left">Search leads, deals, projects, tasks, invoices...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded text-slate-500 font-mono shadow-2xs">⌘K</kbd>
        </button>
      </div>

      {/* Right Top Bar Actions */}
      <div className="flex items-center gap-3">

        {/* PUBLIC WEBSITE LINK */}
        <a
          href={websiteUrl}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 transition-all shadow-2xs"
        >
          <Globe className="w-3.5 h-3.5 text-blue-600" />
          <span>Public Website</span>
        </a>

        {/* SUPER ADMIN CONSOLE BUTTON */}
        {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') && (
          <button
            onClick={() => useDemoStore.getState().setActiveTab('super-admin')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-all shadow-2xs"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Super Admin</span>
          </button>
        )}

        {/* QUICK CREATE (+) BUTTON */}
        <button
          onClick={() => setQuickCreateOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Quick Create</span>
        </button>

        {/* NOTIFICATIONS DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <span className="font-bold text-xs text-slate-900">Notifications</span>
                <span className="text-[10px] text-slate-500">{unreadCount} unread</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={`p-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                      n.read ? 'bg-slate-50 text-slate-500' : 'bg-blue-50 text-slate-800 border border-blue-200'
                    }`}
                  >
                    <div className="font-semibold text-slate-900 mb-0.5">{n.title}</div>
                    <div className="text-[11px] text-slate-600">{n.message}</div>
                    <div className="text-[9px] text-slate-400 mt-1">{n.timestamp}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* USER PROFILE & LOGOUT & ROLE SWITCHER */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 pl-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
          >
            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">{currentUser.name}</div>
              <div className={`text-[9px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border inline-block mt-0.5 ${roleColors[currentUser.role]}`}>
                {currentUser.role}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center font-bold text-white text-xs shadow-sm">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 z-50 animate-fade-in space-y-2">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                <div className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border inline-block mt-1 ${roleColors[currentUser.role]}`}>
                  Active: {currentUser.role}
                </div>
              </div>

              {/* Quick Persona Switcher — Strictly Restricted to SUPER_ADMIN / Root Admins */}
              {(currentUser.role === 'SUPER_ADMIN' || impersonatedOriginalUser?.role === 'SUPER_ADMIN') && (
                <div className="py-1 border-b border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-400 px-3 mb-1.5 tracking-wider flex items-center gap-1">
                    <Shield className="w-3 h-3 text-purple-600" /> Switch Persona View
                  </div>
                  <button
                    onClick={() => handleSwitchRole('ADMIN')}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      (currentUser.role as string) === 'ADMIN' ? 'bg-slate-100 font-bold text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-purple-600" /> Admin / Manager
                    </span>
                    {(currentUser.role as string) === 'ADMIN' && <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />}
                  </button>
                  <button
                    onClick={() => handleSwitchRole('PROJECT_MANAGER')}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      (currentUser.role as string) === 'PROJECT_MANAGER' ? 'bg-purple-50 font-bold text-purple-700' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-indigo-600" /> Delivery PM
                    </span>
                    {(currentUser.role as string) === 'PROJECT_MANAGER' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                  </button>
                  <button
                    onClick={() => handleSwitchRole('CLIENT')}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      (currentUser.role as string) === 'CLIENT' ? 'bg-amber-50 font-bold text-amber-800' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5 text-amber-600" /> Client Portal
                    </span>
                    {(currentUser.role as string) === 'CLIENT' && <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />}
                  </button>
                  <button
                    onClick={() => handleSwitchRole('EMPLOYEE')}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      (currentUser.role as string) === 'EMPLOYEE' ? 'bg-blue-50 font-bold text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-blue-600" /> Solutions Engineer
                    </span>
                    {(currentUser.role as string) === 'EMPLOYEE' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  </button>
                </div>
              )}

              {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') && (
                <button
                  onClick={() => {
                    useDemoStore.getState().setActiveTab('super-admin');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors font-bold"
                >
                  <Shield className="w-4 h-4 text-indigo-600" /> Super Admin Center
                </button>
              )}

              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Globe className="w-4 h-4 text-blue-600" /> Public Website
              </a>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 transition-colors font-medium"
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
