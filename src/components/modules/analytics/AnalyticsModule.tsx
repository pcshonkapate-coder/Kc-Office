"use client";

import React from 'react';

export const AnalyticsModule: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Cross-Functional Analytics & BI</h1>
          <p className="text-xs text-slate-500 mt-1">Lead conversion rates, engineering delivery efficiency, and revenue reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 text-base">Sales Conversion Funnel</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-700"><span>Leads Received</span><span className="font-bold text-slate-900">31</span></div>
            <div className="flex justify-between text-slate-700"><span>Discovery Calls Completed</span><span className="font-bold text-slate-900">22 (70.9%)</span></div>
            <div className="flex justify-between text-slate-700"><span>Proposals Dispatched</span><span className="font-bold text-slate-900">14 (45.1%)</span></div>
            <div className="flex justify-between text-emerald-700 font-bold"><span>Deals Closed Won</span><span>9 (29.0%)</span></div>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 text-base">Engineering Delivery SLA</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-700"><span>On-Time Milestone Delivery</span><span className="font-bold text-emerald-700">94.2%</span></div>
            <div className="flex justify-between text-slate-700"><span>Average Task Cycle Time</span><span className="font-bold text-slate-900">3.4 Days</span></div>
            <div className="flex justify-between text-slate-700"><span>Code Review Speed</span><span className="font-bold text-blue-600">4.2 Hours</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
