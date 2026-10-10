"use client";

import React from 'react';
import { useDemoStore } from '../../../store/demoStore';
import {
  Zap, Play, Power, CheckCircle2, AlertTriangle,
  ArrowRight, ShieldCheck, Sparkles, Clock, RefreshCw
} from 'lucide-react';

export const AutomationsModule: React.FC = () => {
  const automationRules = useDemoStore((state) => state.automationRules);
  const toggleAutomationRule = useDemoStore((state) => state.toggleAutomationRule);
  const showToast = useDemoStore((state) => state.showToast);

  const handleTestRun = (ruleName: string) => {
    showToast(`Simulation dry-run executed for "${ruleName}". Conditions verified!`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> Intelligence Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Cross-System Automations</h1>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous event triggers connecting Leads, Projects, Timesheets, Invoices, and Team Notifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Engine Active &amp; Watching
          </span>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {automationRules.map((rule) => {
          return (
            <div
              key={rule.id}
              className={`p-6 rounded-3xl border transition-all shadow-xl ${
                rule.enabled 
                  ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700' 
                  : 'bg-slate-950/40 border-slate-850 opacity-60'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl border shrink-0 ${
                    rule.enabled 
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' 
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}>
                    <Zap className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-base font-bold text-white">{rule.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {rule.trigger}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                      {rule.description}
                    </p>

                    {/* Logic Box */}
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300">
                      <span className="text-slate-500">WHEN</span> {rule.condition}
                    </div>

                    {/* Actions List */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-500">THEN DO:</span>
                      {rule.actions.map((act, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-xl bg-slate-800 text-[11px] text-slate-300 border border-slate-700/60 flex items-center gap-1"
                        >
                          <ArrowRight className="w-3 h-3 text-cyan-400" /> {act}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Action Controls */}
                <div className="flex md:flex-col items-center md:items-end justify-between gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleTestRun(rule.name)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      <Play className="w-3 h-3 text-cyan-400" /> Dry Run
                    </button>

                    <button
                      onClick={() => toggleAutomationRule(rule.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        rule.enabled
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-rose-500/10 hover:text-rose-300 hover:border-rose-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  <div className="text-right text-[11px] text-slate-500">
                    <div>Executions: <span className="font-bold text-slate-300">{rule.executionCount}</span></div>
                    {rule.lastTriggered && (
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Last run: {new Date(rule.lastTriggered).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default AutomationsModule;
