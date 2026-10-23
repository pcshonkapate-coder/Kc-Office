"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import {
  Calendar as CalendarIcon, Clock, Plus,
  Play, Users, X
} from 'lucide-react';
import { CalendarEvent } from '../../../types';

export const CalendarModule: React.FC = () => {
  const calendarEvents = useDemoStore((state) => state.calendarEvents);
  const addCalendarEvent = useDemoStore((state) => state.addCalendarEvent);

  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New event form state
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<CalendarEvent['type']>('MEETING');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventTime, setNewEventTime] = useState('10:00 AM - 11:00 AM');
  const [newEventLink, setNewEventLink] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');

  const filteredEvents = calendarEvents.filter(evt => {
    if (selectedType === 'ALL') return true;
    return evt.type === selectedType;
  });

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    addCalendarEvent({
      title: newEventTitle.trim(),
      type: newEventType,
      startDate: newEventDate,
      time: newEventTime,
      meetingLink: newEventLink.trim() || undefined,
      description: newEventDesc.trim() || undefined
    });
    setNewEventTitle('');
    setNewEventDesc('');
    setNewEventLink('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">
            <CalendarIcon className="w-3.5 h-3.5" /> Kapate Schedule & Milestones
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Company Calendar</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track executive briefings, delivery deadlines, engineering milestones, and client sessions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Schedule Event
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs">
          {['ALL', 'MEETING', 'MILESTONE', 'DEADLINE', 'LEAVE'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                selectedType === type
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {type === 'ALL' ? 'All Schedules' : type.charAt(0) + type.slice(1).toLowerCase() + 's'}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-bold text-slate-900">{filteredEvents.length}</span> scheduled events
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvents.map((evt) => {
          const typeBadgeColor = 
            evt.type === 'MEETING' ? 'bg-blue-50 text-blue-700 border-blue-200' :
            evt.type === 'MILESTONE' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
            evt.type === 'DEADLINE' ? 'bg-rose-50 text-rose-700 border-rose-200' :
            'bg-amber-50 text-amber-700 border-amber-200';

          return (
            <div
              key={evt.id}
              className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-blue-300 transition-all flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${typeBadgeColor}`}>
                    {evt.type}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {evt.startDate}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {evt.title}
                </h3>

                {evt.description && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {evt.description}
                  </p>
                )}

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{evt.time || 'All Day'}</span>
                  </div>
                  {evt.assignedTo && evt.assignedTo.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{evt.assignedTo.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              {evt.meetingLink && (
                <div className="mt-5 pt-3 border-t border-slate-100">
                  <a
                    href={evt.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <Play className="w-3.5 h-3.5" /> Launch Video Conference
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Event Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Schedule New Calendar Event</h2>
                <p className="text-xs text-slate-500">Add a meeting, milestone or deadline to the operating calendar.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Executive Strategy Sync"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Event Type</label>
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="MEETING">Meeting</option>
                    <option value="MILESTONE">Milestone</option>
                    <option value="DEADLINE">Deadline</option>
                    <option value="LEAVE">Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Date</label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Time Range</label>
                <input
                  type="text"
                  placeholder="e.g. 11:00 AM - 12:00 PM"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Meeting Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={newEventLink}
                  onChange={(e) => setNewEventLink(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Description</label>
                <textarea
                  rows={2}
                  placeholder="Agenda or context..."
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer shadow-sm"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default CalendarModule;
