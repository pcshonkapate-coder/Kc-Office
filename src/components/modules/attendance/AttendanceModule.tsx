"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import { Clock, Send } from 'lucide-react';

export const AttendanceModule: React.FC = () => {
  const attendance = useDemoStore((state) => state.attendance);
  const leaves = useDemoStore((state) => state.leaves);
  const addLeave = useDemoStore((state) => state.addLeave);
  const approveLeave = useDemoStore((state) => state.approveLeave);
  const currentUser = useDemoStore((state) => state.currentUser);
  const showToast = useDemoStore((state) => state.showToast);

  const fetchAttendance = useDemoStore((state) => state.fetchAttendance);

  const [isCheckedIn, setIsCheckedIn] = useState(true);
  const [leaveType, setLeaveType] = useState<'Casual Leave' | 'Sick Leave' | 'Earned Leave'>('Casual Leave');
  const [startDate, setStartDate] = useState('2026-09-22');
  const [endDate, setEndDate] = useState('2026-09-23');
  const [reason, setReason] = useState('Personal work');

  const handleCheckInOut = async () => {
    const nextState = !isCheckedIn;
    setIsCheckedIn(nextState);

    const now = new Date();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const timeStr = `${String(formattedHours).padStart(2, '0')}:${minutes} ${ampm}`;

    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('kapate_token') || localStorage.getItem('kapate_access_token')) : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/v1/workforce/attendance', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          date: now.toISOString().split('T')[0],
          employeeName: currentUser.name,
          status: 'Present',
          checkIn: nextState ? timeStr : '09:00 AM',
          checkOut: nextState ? '—' : timeStr,
          totalHours: nextState ? 0 : 8.5
        })
      });

      await fetchAttendance();
    } catch (err) {
      console.warn('[AttendanceModule] check-in API notice:', err);
    }

    showToast(
      nextState ? `Checked IN successfully at ${timeStr}` : `Checked OUT successfully at ${timeStr}. Total hours: 8.5 hrs`,
      'success'
    );
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addLeave({
      employeeName: currentUser.name,
      leaveType,
      startDate,
      endDate,
      days: 2,
      reason
    });
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            Attendance & Leave Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">Biometric check-in/out simulation, WFH logs, and leave approval portal</p>
        </div>

        <button
          onClick={handleCheckInOut}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs shadow-sm transition-all ${
            isCheckedIn ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          <Clock className="w-4 h-4" /> {isCheckedIn ? 'Simulate Check-OUT' : 'Simulate Check-IN'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Records Table */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Today's Attendance Logs</h3>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 uppercase text-[10px] font-mono text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Check-In</th>
                  <th className="p-3">Check-Out</th>
                  <th className="p-3 text-right">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {attendance.map((a) => (
                  <tr key={a.id} className="hover:bg-white transition-colors">
                    <td className="p-3 font-semibold text-slate-900">{a.employeeName}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        a.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600">{a.checkIn}</td>
                    <td className="p-3 font-mono text-slate-600">{a.checkOut}</td>
                    <td className="p-3 text-right font-mono font-bold text-blue-600">{a.totalHours} h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leave Requests & Form */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Leave Requests & Balance</h3>

          <form onSubmit={handleLeaveSubmit} className="space-y-3 text-xs p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="font-semibold text-blue-600">Request New Leave</div>
            <div>
              <label className="block text-slate-700 mb-1 font-medium">Leave Type</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="Casual Leave">Casual Leave (Balance: 6 days)</option>
                <option value="Sick Leave">Sick Leave (Balance: 4 days)</option>
                <option value="Earned Leave">Earned Leave (Balance: 12 days)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 mb-1 font-medium">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1 font-medium">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-medium">Reason</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center justify-center gap-2 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" /> Submit Leave Request
            </button>
          </form>

          {/* Pending Leave Requests */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Leave Applications</div>
            {leaves.map((l) => (
              <div key={l.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{l.employeeName}</div>
                  <div className="text-[11px] text-slate-500">{l.leaveType} • {l.startDate} to {l.endDate} ({l.days} days)</div>
                </div>

                <div className="flex items-center gap-2">
                  {l.status === 'Pending' ? (
                    <>
                      <button
                        onClick={() => approveLeave(l.id, true)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-xs"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => approveLeave(l.id, false)}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold shadow-xs"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${l.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                      {l.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};
