"use client";

import React from 'react';
import { useDemoStore } from '../../../store/demoStore';
import { PieChart } from 'lucide-react';

export const ResourceModule: React.FC = () => {
  const resources = useDemoStore((state) => state.resources);
  const employees = useDemoStore((state) => state.employees);

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            Resource Management & Workload Allocation
          </h1>
          <p className="text-xs text-slate-500 mt-1">Capacity planning, project allocation percentages, and workload balancing</p>
        </div>
      </div>

      {/* Allocation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {resources.map((res) => (
          <div key={res.id} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-600" /> {res.projectName}
            </h3>

            <div className="space-y-3">
              {res.allocations.map((alloc, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900">{alloc.name}</span>
                      <span className="text-[11px] text-slate-500 ml-2">({alloc.role})</span>
                    </div>
                    <span className="font-mono font-bold text-blue-600">{alloc.percentage}% Allocated ({alloc.allocatedHours}h/wk)</span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full ${
                        alloc.percentage > 80 ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${alloc.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Workload Capacity Breakdown Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Engineer Workload Balance</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {employees.map((e) => (
            <div key={e.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">{e.name}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  e.utilization >= 90 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {e.utilization}% Allocated
                </span>
              </div>
              <div className="text-[11px] text-slate-500">{e.role}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
