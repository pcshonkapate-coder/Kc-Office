'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Building,
  FileCheck2,
  FolderGit2,
  KeyRound,
  LayoutDashboard,
  PlusCircle,
  Search,
  Timer,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';

interface SearchResultItem {
  id: string;
  entity_type: string;
  title: string;
  subtitle?: string;
  url: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreate?: () => void;
}

export function CommandPalette({ isOpen, onClose, onOpenCreate }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global Ctrl/Cmd + K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // Controlled by parent
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced API Search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { data } = await apiClient.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(data.results || []);
      } catch (err) {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Quick System Navigation Items
  const staticCommands = [
    {
      title: 'Go to Executive Dashboard',
      category: 'Navigation',
      icon: LayoutDashboard,
      action: () => router.push('/dashboard'),
    },
    {
      title: 'Go to CRM & Pipeline',
      category: 'Navigation',
      icon: Briefcase,
      action: () => router.push('/crm'),
    },
    {
      title: 'Go to People & Workforce',
      category: 'Navigation',
      icon: Users,
      action: () => router.push('/people'),
    },
    {
      title: 'Clock In / Attendance Register',
      category: 'Actions',
      icon: Timer,
      action: () => router.push('/people?tab=attendance'),
    },
    {
      title: 'Open Universal Creation Menu',
      category: 'Actions',
      icon: PlusCircle,
      action: () => {
        onClose();
        if (onOpenCreate) onOpenCreate();
      },
    },
  ];

  const filteredCommands = query
    ? staticCommands.filter((c) =>
        c.title.toLowerCase().includes(query.toLowerCase())
      )
    : staticCommands;

  const allItemsCount = filteredCommands.length + results.length;

  const handleSelectIndex = (index: number) => {
    if (index < filteredCommands.length) {
      filteredCommands[index].action();
      onClose();
    } else {
      const resultItem = results[index - filteredCommands.length];
      if (resultItem) {
        router.push(resultItem.url);
        onClose();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (allItemsCount || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (allItemsCount || 1)) % (allItemsCount || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelectIndex(selectedIndex);
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'ACCOUNT':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'LEAD':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DEAL':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'EMPLOYEE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CONTRACT':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-20 px-4 animate-fade-in">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200 flex items-center space-x-3 bg-slate-50/70">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search accounts, leads, deals, employees..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-100 rounded border border-slate-200 font-semibold">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="p-2 overflow-y-auto flex-1 divide-y divide-slate-100">
          {isLoading && (
            <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Searching Kapate OS enterprise index...
            </div>
          )}

          {/* Quick System Actions / Commands */}
          {filteredCommands.length > 0 && (
            <div className="py-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1 block font-mono">
                Workspace Commands
              </span>
              <div className="space-y-1">
                {filteredCommands.map((cmd, idx) => {
                  const Icon = cmd.icon;
                  const isCurrent = selectedIndex === idx;
                  return (
                    <div
                      key={cmd.title}
                      onClick={() => handleSelectIndex(idx)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-slate-900 text-white font-medium shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className={`w-4 h-4 ${isCurrent ? 'text-blue-400' : 'text-blue-600'}`} />
                        <span>{cmd.title}</span>
                      </div>
                      <span
                        className={`text-[10px] uppercase font-mono ${
                          isCurrent ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        {cmd.category}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dynamic Global Search Matches */}
          {results.length > 0 && (
            <div className="py-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1 block font-mono">
                Enterprise Database Matches ({results.length})
              </span>
              <div className="space-y-1">
                {results.map((res, rIdx) => {
                  const actualIdx = filteredCommands.length + rIdx;
                  const isCurrent = selectedIndex === actualIdx;
                  return (
                    <div
                      key={res.id}
                      onClick={() => handleSelectIndex(actualIdx)}
                      onMouseEnter={() => setSelectedIndex(actualIdx)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-slate-900 text-white font-medium shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <div className={`font-medium ${isCurrent ? 'text-white' : 'text-slate-900'}`}>{res.title}</div>
                        {res.subtitle && (
                          <div
                            className={`text-[11px] ${
                              isCurrent ? 'text-slate-300' : 'text-slate-500'
                            }`}
                          >
                            {res.subtitle}
                          </div>
                        )}
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-mono uppercase ${getBadgeColor(
                          res.entity_type
                        )}`}
                      >
                        {res.entity_type}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!isLoading && allItemsCount === 0 && (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching commands or database entities found for "{query}".
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 shadow-2xs font-semibold">
                ↑
              </kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 shadow-2xs font-semibold">
                ↓
              </kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 shadow-2xs font-semibold">
                ↵
              </kbd>{' '}
              Select
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">Kapate OS Enterprise Index</span>
        </div>
      </div>
    </div>
  );
}
