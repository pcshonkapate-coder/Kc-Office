'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import {
  Bot,
  CheckCircle,
  Clock,
  Database,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from 'lucide-react';

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MessageItem {
  sender: 'user' | 'assistant';
  text: string;
  tools?: any[];
  records?: string[];
  latency?: number;
}

export function AICopilotDrawer({ isOpen, onClose }: AICopilotDrawerProps) {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      sender: 'assistant',
      text: 'Hello! I am your KAPATE OS Enterprise Copilot. Ask me about active project health, overdue invoices, team capacity, or CRM pipeline metrics.',
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');

  const chatMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const { data } = await apiClient.post('/ai/chat', { prompt });
      return data;
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: data.response_text,
          tools: data.tools_executed,
          records: data.records_accessed,
          latency: data.latency_ms,
        },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Encountered an operational error communicating with the enterprise model.',
        },
      ]);
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || chatMutation.isPending) return;

    const currentPrompt = inputPrompt;
    setInputPrompt('');
    setMessages((prev) => [...prev, { sender: 'user', text: currentPrompt }]);
    chatMutation.mutate(currentPrompt);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col animate-fade-in font-sans">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              KAPATE Copilot <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">RBAC Guarded</span>
            </h3>
            <p className="text-[11px] text-slate-500">Enterprise Context Intelligence</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-2.5 shadow-2xs ${
                m.sender === 'user'
                  ? 'bg-slate-900 text-white rounded-br-none'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>

              {/* Tools & RBAC Audit Pill */}
              {m.tools && m.tools.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                    Executed Functions & Access Verification:
                  </span>
                  {m.tools.map((t, tIdx) => (
                    <div
                      key={tIdx}
                      className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded border border-slate-200 text-[10px] font-mono"
                    >
                      <span className="text-blue-700 font-semibold">{t.tool_name}()</span>
                      <span
                        className={`inline-flex items-center gap-1 ${
                          t.rbac_passed ? 'text-emerald-700 font-medium' : 'text-rose-600 font-medium'
                        }`}
                      >
                        {t.rbac_passed ? <ShieldCheck className="w-3 h-3 text-emerald-600" /> : <ShieldAlert className="w-3 h-3 text-rose-500" />}
                        {t.rbac_passed ? 'RBAC Verified' : 'Access Denied'}
                      </span>
                    </div>
                  ))}
                  {m.latency && (
                    <div className="text-[10px] font-mono text-slate-400 text-right">
                      Response time: {m.latency}ms
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {chatMutation.isPending && (
          <div className="flex items-center space-x-2 text-xs text-slate-500 bg-white border border-slate-200 p-3 rounded-2xl max-w-[60%] shadow-2xs">
            <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Consulting enterprise records...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder="Ask: 'Show overdue invoices' or 'Check project health'..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
        />
        <button
          type="submit"
          disabled={!inputPrompt.trim() || chatMutation.isPending}
          className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 cursor-pointer shadow-xs transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
