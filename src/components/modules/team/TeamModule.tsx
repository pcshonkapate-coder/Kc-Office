"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import { Employee, Intern, Freelancer } from '../../../types';
import { Users2, Award, Briefcase, GraduationCap, Download, Plus } from 'lucide-react';

export const TeamModule: React.FC = () => {
  const activeTab = useDemoStore((state) => state.activeTab);
  const employees = useDemoStore((state) => state.employees);
  const interns = useDemoStore((state) => state.interns);
  const freelancers = useDemoStore((state) => state.freelancers);
  const showToast = useDemoStore((state) => state.showToast);

  const [subTab, setSubTab] = useState<'employees' | 'interns' | 'freelancers'>(
    activeTab === 'interns' ? 'interns' : 'employees'
  );

  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(interns[0] || null);

  const setQuickCreateOpen = useDemoStore((state) => state.setQuickCreateOpen);

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            Team & Workforce Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">Full-time engineers, dedicated intern mentorship hub, and specialist contractors</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setSubTab('employees')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                subTab === 'employees' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users2 className="w-3.5 h-3.5" /> Employees ({employees.length})
            </button>
            <button
              onClick={() => setSubTab('interns')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                subTab === 'interns' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" /> Intern Hub ({interns.length})
            </button>
            <button
              onClick={() => setSubTab('freelancers')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                subTab === 'freelancers' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" /> Freelancers ({freelancers.length})
            </button>
          </div>

          <button
            onClick={() => setQuickCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Onboard Team Member
          </button>
        </div>
      </div>

      {/* SUBTAB 1: EMPLOYEES */}
      {subTab === 'employees' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((emp) => (
            <div key={emp.id} className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center font-bold text-white text-base shadow-sm">
                    {emp.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{emp.name}</h3>
                    <div className="text-xs text-blue-600 font-medium">{emp.role}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{emp.department}</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  {emp.status}
                </span>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Technical Skills</div>
                <div className="flex flex-wrap gap-1">
                  {emp.skills.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono border border-slate-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Projects: {emp.projectsCount}</span>
                <span className="font-mono text-blue-600 font-bold">Utilization: {emp.utilization}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 2: DEDICATED INTERN HUB */}
      {subTab === 'interns' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-4 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">Registered Interns ({interns.length})</div>
            {interns.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400">
                No interns enrolled. Click "Add Intern" to register.
              </div>
            ) : (
              interns.map((int) => (
                <div
                  key={int.id}
                  onClick={() => setSelectedIntern(int)}
                  className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                    selectedIntern?.id === int.id
                      ? 'bg-white border-blue-600 shadow-md ring-1 ring-blue-600/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{int.name}</h4>
                      <div className="text-xs text-blue-600 font-medium">{int.role}</div>
                      <div className="text-[10px] text-slate-500">{int.college}</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Mentor: {int.mentor}</span>
                    <span className="font-mono text-emerald-600 font-bold">{int.tasksCompleted} Tasks Done</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {!selectedIntern ? (
            <div className="lg:col-span-8 p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <div className="text-sm font-semibold text-slate-700">No Intern Selected</div>
              <div className="text-xs text-slate-400 mt-1">Select an intern to view their training progress, evaluations, and certificate status.</div>
            </div>
          ) : (
            <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <span className="text-xs font-mono text-emerald-600 font-bold">{selectedIntern.id}</span>
                  <h2 className="text-xl font-bold text-slate-900">{selectedIntern.name}</h2>
                  <div className="text-xs text-slate-500">{selectedIntern.college} • Mentor: {selectedIntern.mentor}</div>
                </div>

                <button
                  onClick={() => showToast(`Generated Certificate of Completion PDF for ${selectedIntern.name}`, 'success')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm"
                >
                  <Download className="w-4 h-4" /> Certificate Generator
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3 text-center text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[10px]">Logged Hours</div>
                  <div className="font-bold text-slate-900 text-sm mt-1 font-mono">{selectedIntern.loggedHours} hrs</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[10px]">Attendance</div>
                  <div className="font-bold text-emerald-600 text-sm mt-1 font-mono">{selectedIntern.attendancePct}%</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[10px]">Tasks Completed</div>
                  <div className="font-bold text-blue-600 text-sm mt-1 font-mono">{selectedIntern.tasksCompleted}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[10px]">Training Progress</div>
                  <div className="font-bold text-teal-600 text-sm mt-1 font-mono">{selectedIntern.trainingProgress}%</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">Mentor Evaluation Matrix</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {Object.entries(selectedIntern.evaluations).map(([key, val]) => (
                    <div key={key} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <span className="capitalize text-slate-700 font-medium">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="font-mono font-bold text-emerald-600">{val} / 100</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Mentor Performance Review</h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200 font-medium">
                  "{selectedIntern.mentorFeedback}"
                </p>
              </div>
            </div>
          )}

        </div>
      )}

      {/* SUBTAB 3: FREELANCERS */}
      {subTab === 'freelancers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {freelancers.map((fl) => (
            <div key={fl.id} className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{fl.name}</h3>
                  <div className="text-xs text-blue-600 font-medium">{fl.skill}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                  {fl.status}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <span className="text-slate-500">Rate:</span>
                <span className="font-mono font-bold text-emerald-600">{fl.hourlyRate}</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
