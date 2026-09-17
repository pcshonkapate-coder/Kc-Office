"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import { aiService } from '../../../services';
import { Bot, Sparkles, CheckCircle2, FileText, CheckSquare, MessageSquare } from 'lucide-react';

export const AIAssistantModule: React.FC = () => {
  const addTask = useDemoStore((state) => state.addTask);
  const showToast = useDemoStore((state) => state.showToast);

  const [activeTab, setActiveTab] = useState<'lead' | 'meeting' | 'proposal' | 'tasks'>('tasks');
  const [loading, setLoading] = useState(false);

  const [taskPrompt, setTaskPrompt] = useState('Build AI chatbot for customer support with Zendesk CRM sync');
  const [generatedTasks, setGeneratedTasks] = useState<any[]>([]);

  const [leadInput, setLeadInput] = useState('Enterprise client looking to audit ML models for fraud detection in real-time banking.');
  const [leadSummary, setLeadSummary] = useState<any>(null);

  const handleGenerateTasks = async () => {
    setLoading(true);
    const tasks = await aiService.generateTaskBreakdown(taskPrompt);
    setGeneratedTasks(tasks);
    setLoading(false);
  };

  const handleApproveTasks = () => {
    generatedTasks.forEach((t) => {
      addTask({
        title: t.title,
        projectId: 'PRJ-001',
        projectName: 'AI Customer Support Platform',
        assignedTo: 'Amit Patil',
        priority: t.priority as any,
        status: 'TODO',
        dueDate: '2026-10-15',
        estimatedHours: t.estimatedHours,
        description: 'AI Generated Task'
      });
    });
    showToast(`${generatedTasks.length} tasks approved and pushed to Project Task Board!`, 'success');
  };

  const handleSummarizeLead = async () => {
    setLoading(true);
    const res = await aiService.generateLeadSummary(leadInput);
    setLeadSummary(res);
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">
            <Bot className="w-4 h-4" /> AI Operations Co-Pilot Simulation
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Kapate Intelligence Assistant
          </h1>
          <p className="text-xs text-slate-500 mt-1">Automated lead scoring, meeting transcripts, proposal drafting, and task breakdown</p>
        </div>

        <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
          AI-generated draft — requires human review.
        </span>
      </div>

      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-fit">
        {[
          { id: 'tasks', label: 'AI Task Generator', icon: CheckSquare },
          { id: 'lead', label: 'AI Lead Summarizer', icon: Bot },
          { id: 'meeting', label: 'AI Meeting Summarizer', icon: MessageSquare },
          { id: 'proposal', label: 'AI Proposal Builder', icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === tab.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Generate Project Task Breakdown</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Project Goal / Requirement Prompt</label>
              <textarea
                value={taskPrompt}
                onChange={(e) => setTaskPrompt(e.target.value)}
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <button
              onClick={handleGenerateTasks}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4" /> {loading ? 'Generating Tasks...' : 'Generate Task Breakdown'}
            </button>
          </div>

          <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">AI Generated Sprint Tasks</h3>
              {generatedTasks.length > 0 && (
                <button
                  onClick={handleApproveTasks}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve Tasks
                </button>
              )}
            </div>

            {generatedTasks.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-mono">
                Click "Generate Task Breakdown" to generate engineering sprint tasks.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {generatedTasks.map((t, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900">{t.title}</div>
                      <div className="text-[11px] text-slate-500">Est: {t.estimatedHours} hrs</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-mono font-bold border border-blue-200">
                      {t.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'lead' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Input Raw Lead Inquiry</h3>
            <textarea
              value={leadInput}
              onChange={(e) => setLeadInput(e.target.value)}
              rows={5}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 focus:outline-none"
            />
            <button
              onClick={handleSummarizeLead}
              className="w-full py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold"
            >
              Analyze Lead & Qualify
            </button>
          </div>

          {leadSummary && (
            <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200 space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-200">AI Intelligence Analysis</h3>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Industry:</span> <span className="font-semibold text-slate-900">{leadSummary.industry}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Complexity:</span> <span className="font-semibold text-amber-700">{leadSummary.complexity}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Suggested Action:</span> <span className="font-semibold text-emerald-700">{leadSummary.suggestedNextAction}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
