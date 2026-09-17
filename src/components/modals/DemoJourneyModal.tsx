"use client";

import React from 'react';
import { useDemoStore } from '../../store/demoStore';
import { X, Play, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Building2, UserCheck, Shield, FileText, FolderKanban, CheckSquare, Clock, Receipt, DollarSign, Eye } from 'lucide-react';

const JOURNEY_STEPS = [
  { step: 1, title: 'Inbound Website Lead', module: 'CRM / Leads', icon: UserCheck, desc: 'A new enterprise client inquiry KAP-001 (Rahul Sharma from TechNova) is received via the Kapate website form seeking AI Solutions.' },
  { step: 2, title: 'Lead Qualification & Scoring', module: 'CRM / Leads', icon: Sparkles, desc: 'Lead score algorithm rates the lead at 88/100 based on budget (₹8L) and tech fit. Lead is assigned to ML Lead Amit Patil.' },
  { step: 3, title: 'Discovery Booking & Call', module: 'CRM / Activities', icon: Building2, desc: 'Discovery call is completed. Technical requirements for LLM fine-tuning and Zendesk CRM sync are documented.' },
  { step: 4, title: 'Deal Created in Pipeline', module: 'CRM / Deals Kanban', icon: DollarSign, desc: 'Deal DEAL-101 created for ₹15,00,000 and advanced to "TECHNICAL ASSESSMENT" stage.' },
  { step: 5, title: 'Mutual NDA Execution', module: 'Sales / Contracts', icon: Shield, desc: 'Mutual NDA CTR-NDA-001 sent to client, viewed online, and digitally signed by both parties.' },
  { step: 6, title: 'Proposal & SOW Generation', module: 'Sales / Proposals', icon: FileText, desc: 'AI Proposal Generator drafts proposal PROP-2026-01 with 12-week timeline, tech stack, and milestone pricing.' },
  { step: 7, title: 'Closed Won Contract', module: 'Sales / Pipeline', icon: CheckCircle2, desc: 'Client accepts proposal. SOW is executed and deal moves to "CLOSED WON".' },
  { step: 8, title: 'Project Initialization', module: 'Projects / All Projects', icon: FolderKanban, desc: 'Project PRJ-001 "AI Customer Support Platform" is automatically provisioned with 6 milestones and budget tracking.' },
  { step: 9, title: 'Team Allocation', module: 'Resource Management', icon: UserCheck, desc: 'Amit Patil (ML Lead - 50%), Rahul Deshmukh (PM - 60%), and Sneha Joshi (UI Lead - 40%) are allocated.' },
  { step: 10, title: 'Intern Mentorship Assigned', module: 'Team / Intern Hub', icon: Sparkles, desc: 'Riya Sharma (AI Intern from COEP) is assigned under mentor Amit Patil for PyTorch dataset preparation.' },
  { step: 11, title: 'Task Kanban Board Setup', module: 'Projects / Tasks', icon: CheckSquare, desc: 'Tasks TSK-101 to TSK-107 are assigned. Task TSK-102 assigned to intern Riya Sharma.' },
  { step: 12, title: 'Weekly Timesheet Submission', module: 'Timesheets', icon: Clock, desc: 'Riya logs 38.5 billable hours for dataset curation. Manager Amit Patil reviews and approves the timesheet.' },
  { step: 13, title: 'Milestone Completed', module: 'Projects / Milestones', icon: CheckCircle2, desc: 'UI/UX Design Mockups milestone reaches 100% completion.' },
  { step: 14, title: 'Invoice Generation', module: 'Finance / Invoices', icon: Receipt, desc: 'Invoice INV-2026-001 generated for ₹8,85,000 (incl 18% GST) and dispatched to client billing contact.' },
  { step: 15, title: 'Payment Processing', module: 'Finance / Payments', icon: DollarSign, desc: 'Client payment received via Bank Transfer (Ref: BANK-TRF-998822). Invoice marked as PAID.' },
  { step: 16, title: 'Project Profitability Audit', module: 'Finance / Profitability', icon: DollarSign, desc: 'Real-time financial audit: Revenue ₹15L vs Total Cost ₹6.5L = Gross Profit ₹8.5L (56.7% Gross Margin).' },
  { step: 17, title: 'Client Portal Synchronized', module: 'Client Portal', icon: Eye, desc: 'Client logs into isolated portal view to see project progress (68%), completed milestones, and paid invoices.' }
];

export const DemoJourneyModal: React.FC = () => {
  const isOpen = useDemoStore((state) => state.isDemoJourneyOpen);
  const setOpen = useDemoStore((state) => state.setDemoJourneyOpen);
  const step = useDemoStore((state) => state.demoJourneyStep);
  const nextStep = useDemoStore((state) => state.nextDemoJourneyStep);
  const prevStep = useDemoStore((state) => state.prevDemoJourneyStep);
  const setActiveTab = useDemoStore((state) => state.setActiveTab);
  const switchRole = useDemoStore((state) => state.switchRole);

  if (!isOpen) return null;

  const current = JOURNEY_STEPS[step - 1];

  const handleJumpToModule = () => {
    if (step === 17) {
      switchRole('CLIENT');
      setActiveTab('client-portal');
    } else if (step === 12) {
      switchRole('EMPLOYEE');
      setActiveTab('timesheets');
    } else if (step === 10) {
      switchRole('ADMIN');
      setActiveTab('interns');
    } else if (step >= 14 && step <= 16) {
      switchRole('FINANCE');
      setActiveTab('finance');
    } else if (step >= 8 && step <= 11) {
      switchRole('PROJECT_MANAGER');
      setActiveTab('projects');
    } else {
      switchRole('ADMIN');
      setActiveTab('crm');
    }
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Play className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="font-extrabold text-white text-base flex items-center gap-2">
                Kapate OS Interactive Business Journey
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                  Step {step} of 17
                </span>
              </div>
              <div className="text-xs text-slate-400">Complete End-to-End Enterprise Lifecycle Simulation</div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Visual Progress Bar */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800/80">
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(step / 17) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Detail Body */}
        <div className="p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <current.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">{current.module}</div>
              <h2 className="text-xl font-bold text-white mt-1">{current.title}</h2>
              <p className="text-sm text-slate-300 leading-relaxed mt-3 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
                {current.desc}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 flex items-center justify-between">
            <span>Click below to immediately open and view this exact module state in the app.</span>
            <button
              onClick={handleJumpToModule}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shrink-0"
            >
              Open Module View ➔
            </button>
          </div>
        </div>

        {/* Footer Navigation Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>

          <span className="text-xs text-slate-500 font-mono font-medium">Step {step} / 17</span>

          <button
            onClick={nextStep}
            disabled={step === 17}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 disabled:opacity-40 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all"
          >
            Next Step <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
