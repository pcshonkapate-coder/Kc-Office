"use client";

import React from 'react';
import { useDemoStore } from '../../store/demoStore';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const toast = useDemoStore((state) => state.toast);
  const clearToast = useDemoStore((state) => state.clearToast);

  if (!toast) return null;

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-400" />,
    error: <XCircle className="w-5 h-5 text-rose-400" />
  };

  const borderMap = {
    success: 'border-emerald-500/30 bg-emerald-950/80 text-emerald-200',
    info: 'border-blue-500/30 bg-blue-950/80 text-blue-200',
    warning: 'border-amber-500/30 bg-amber-950/80 text-amber-200',
    error: 'border-rose-500/30 bg-rose-950/80 text-rose-200'
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200] max-w-md animate-fade-in">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl ${borderMap[toast.type]}`}>
        {iconMap[toast.type]}
        <span className="text-sm font-medium pr-2">{toast.message}</span>
        <button
          onClick={clearToast}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors ml-auto"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
