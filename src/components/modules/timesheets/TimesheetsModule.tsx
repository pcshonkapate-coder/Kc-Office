"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import { Clock, Send } from 'lucide-react';

export const TimesheetsModule: React.FC = () => {
  const timesheets = useDemoStore((state) => state.timesheets);
  const approveTimesheet = useDemoStore((state) => state.approveTimesheet);
  const addTimesheet = useDemoStore((state) => state.addTimesheet);
  const currentUser = useDemoStore((state) => state.currentUser);

  const [project, setProject] = useState('AI Customer Support Platform');
  const [task, setTask] = useState('Model Training & Evaluation');
  const [hours, setHours] = useState(7.5);
  const [isBillable, setIsBillable] = useState(true);
  const [description, setDescription] = useState('Finetuned Llama 3 model on support transcripts.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTimesheet({
      date: new Date().toISOString().split('T')[0],
      day: 'Today',
      projectName: project,
      taskName: task,
      hours: Number(hours),
      isBillable,
      description
    });
  };

  const isManagerOrAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'PROJECT_MANAGER' || currentUser.role === 'EMPLOYEE';

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            Weekly Timesheets & Billable Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-1">Log client billable hours, submit weekly logs, and process manager approvals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Submit Form */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" /> Log Time Entry
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Project</label>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="AI Customer Support Platform">AI Customer Support Platform</option>
                <option value="Computer Vision Inspection System">Computer Vision Inspection System</option>
                <option value="Enterprise Data Analytics Platform">Enterprise Data Analytics Platform</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Task Name</label>
              <input
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hours Logged</label>
                <input
                  type="number"
                  step="0.5"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold">
                  <input
                    type="checkbox"
                    checked={isBillable}
                    onChange={(e) => setIsBillable(e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span>Billable</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              <Send className="w-4 h-4" /> Submit Weekly Timesheet
            </button>
          </form>
        </div>

        {/* Timesheets List & Manager Approval Table */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Submitted Timesheet Entries</h3>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 uppercase text-[10px] font-mono text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Project & Task</th>
                  <th className="p-3">Hours</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {timesheets.map((ts) => (
                  <tr key={ts.id} className="hover:bg-white transition-colors">
                    <td className="p-3 font-semibold text-slate-900">{ts.employeeName}</td>
                    <td className="p-3">
                      <div className="text-slate-900 font-medium">{ts.projectName}</div>
                      <div className="text-[11px] text-slate-500">{ts.taskName}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-blue-600">{ts.hours} hrs</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${ts.isBillable ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                        {ts.isBillable ? 'Billable' : 'Non-billable'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        ts.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {ts.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {ts.status === 'Submitted' && isManagerOrAdmin ? (
                        <button
                          onClick={() => approveTimesheet(ts.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px]"
                        >
                          Approve
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">Approved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
