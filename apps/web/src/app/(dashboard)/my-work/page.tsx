'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { usePermissions } from '../../../hooks/usePermissions';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Play,
  Square,
  Timer,
  UserCheck,
} from 'lucide-react';

export default function MyWorkWorkspacePage() {
  const queryClient = useQueryClient();
  const { user } = usePermissions();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Fetch My Work data
  const { data: myWork = { today_tasks: [], overdue_tasks: [], active_timer: null }, isLoading } =
    useQuery({
      queryKey: ['my-work'],
      queryFn: async () => {
        const { data } = await apiClient.get('/projects/my-work');
        return data;
      },
      refetchInterval: 10000,
    });

  // Local live ticker for running timer
  useEffect(() => {
    if (myWork.active_timer) {
      setElapsedSeconds(myWork.active_timer.elapsed_seconds || 0);
      const interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [myWork.active_timer]);

  // Stop Timer Mutation
  const stopTimerMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { data } = await apiClient.post(`/projects/tasks/${taskId}/timer/stop`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-work'] });
    },
  });

  // Complete Task Mutation
  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { data } = await apiClient.patch(`/projects/tasks/${taskId}`, { status: 'DONE' });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-work'] });
    },
  });

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            My Work Command Center
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Personalized execution dashboard, active work timers, and priority assignments
          </p>
        </div>

        {/* Live Running Timer Badge */}
        {myWork.active_timer ? (
          <div className="flex items-center space-x-3 bg-blue-50/80 border border-blue-200 px-4 py-2.5 rounded-2xl shadow-xs animate-pulse">
            <Timer className="w-5 h-5 text-blue-600" />
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-700 block">
                Active Timer: {myWork.active_timer.task_title}
              </span>
              <span className="text-base font-mono font-bold text-slate-900">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
            <button
              onClick={() => stopTimerMutation.mutate(myWork.active_timer.task_id)}
              className="p-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer ml-2 shadow-xs transition-colors"
              title="Stop Timer"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-xs text-slate-500 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>No running timer</span>
          </div>
        )}
      </div>

      {/* OVERDUE TASKS BANNER */}
      {myWork.overdue_tasks?.length > 0 && (
        <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Attention Required: {myWork.overdue_tasks.length} Overdue Tasks</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {myWork.overdue_tasks.map((task: any) => (
              <div
                key={task.id}
                className="p-3.5 bg-white border border-rose-200 rounded-xl flex items-center justify-between shadow-xs"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">{task.title}</div>
                  <div className="text-[11px] text-rose-600 font-semibold mt-0.5">Due: {task.due_date}</div>
                </div>
                <button
                  onClick={() => completeTaskMutation.mutate(task.id)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold cursor-pointer shadow-xs"
                >
                  Mark Done
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TODAY'S & ACTIVE TASKS */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          Today's Tasks & Priority Deliverables ({myWork.today_tasks?.length || 0})
        </h3>

        {myWork.today_tasks?.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-xs text-slate-500 shadow-xs">
            No pending tasks assigned for today. You are completely caught up!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myWork.today_tasks.map((task: any) => (
              <div
                key={task.id}
                className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl space-y-3 shadow-xs hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                    {task.project_name}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full border ${
                      task.priority === 'URGENT'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : task.priority === 'HIGH'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-900">{task.title}</div>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Status: <strong className="text-slate-800">{task.status}</strong>
                  </span>
                  <button
                    onClick={() => completeTaskMutation.mutate(task.id)}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Complete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
