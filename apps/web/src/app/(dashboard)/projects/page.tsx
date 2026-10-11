'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { usePermissions } from '../../../hooks/usePermissions';
import { ColumnDef, DataTable } from '../../../components/ui/DataTable';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileCheck2,
  FolderGit2,
  Layers,
  ListTodo,
  MessageSquare,
  Play,
  Plus,
  Square,
  Timer,
  User,
  X,
} from 'lucide-react';

const TASK_COLUMNS = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

export default function ProjectsWorkspacePage() {
  const queryClient = useQueryClient();
  const { can, user } = usePermissions();

  const [activeTab, setActiveTab] = useState<'projects' | 'board' | 'milestones'>('projects');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [newSubtask, setNewSubtask] = useState('');

  // 1. Fetch Projects
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await apiClient.get('/projects');
      return data;
    },
    enabled: can('project.read'),
  });

  // Default select first project if not selected
  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // 2. Fetch Tasks for selected Project
  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['projects', selectedProjectId, 'tasks'],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const { data } = await apiClient.get(`/projects/${selectedProjectId}/tasks`);
      return data;
    },
    enabled: !!selectedProjectId,
  });

  // 3. Fetch Milestones
  const { data: milestones = [], isLoading: loadingMilestones } = useQuery({
    queryKey: ['projects', selectedProjectId, 'milestones'],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const { data } = await apiClient.get(`/projects/${selectedProjectId}/milestones`);
      return data;
    },
    enabled: !!selectedProjectId,
  });

  // 4. Fetch Task Comments if drawer open
  const { data: taskComments = [] } = useQuery({
    queryKey: ['tasks', selectedTaskId, 'comments'],
    queryFn: async () => {
      if (!selectedTaskId) return [];
      const { data } = await apiClient.get(`/projects/tasks/${selectedTaskId}/comments`);
      return data;
    },
    enabled: !!selectedTaskId,
  });

  // Mutations
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const { data } = await apiClient.patch(`/projects/tasks/${taskId}`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', selectedProjectId, 'tasks'] });
    },
  });

  const startTimerMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { data } = await apiClient.post(`/projects/tasks/${taskId}/timer/start`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-work'] });
    },
  });

  const stopTimerMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { data } = await apiClient.post(`/projects/tasks/${taskId}/timer/stop`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-work'] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTaskId || !newComment.trim()) return;
      const { data } = await apiClient.post(`/projects/tasks/${selectedTaskId}/comments`, {
        content: newComment,
        mentions: [],
      });
      return data;
    },
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['tasks', selectedTaskId, 'comments'] });
    },
  });

  const addSubtaskMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTaskId || !newSubtask.trim()) return;
      const { data } = await apiClient.post(`/projects/tasks/${selectedTaskId}/subtasks`, {
        title: newSubtask,
      });
      return data;
    },
    onSuccess: () => {
      setNewSubtask('');
      queryClient.invalidateQueries({ queryKey: ['projects', selectedProjectId, 'tasks'] });
    },
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: async (subtaskId: string) => {
      const { data } = await apiClient.patch(`/projects/tasks/subtasks/${subtaskId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', selectedProjectId, 'tasks'] });
    },
  });

  // Table Columns
  const projectColumns: ColumnDef<any>[] = [
    { key: 'project_code', header: 'Code', sortable: true },
    { key: 'name', header: 'Project Name', sortable: true },
    {
      key: 'billing_type',
      header: 'Billing Type',
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
          {row.billing_type}
        </span>
      ),
    },
    {
      key: 'health_status',
      header: 'Health Metric',
      sortable: true,
      render: (row) => {
        const isHealthy = row.health_status === 'ON_TRACK';
        const isRisk = row.health_status === 'AT_RISK';
        const color = isHealthy
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : isRisk
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-rose-50 text-rose-700 border-rose-200';
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border ${color}`}>
            {row.health_status}
          </span>
        );
      },
    },
    {
      key: 'total_budget',
      header: 'Budget',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-semibold text-slate-900">
          ₹{Number(row.total_budget).toLocaleString()}
        </span>
      ),
    },
    { key: 'target_end_date', header: 'Deadline', sortable: true },
    {
      key: 'actions',
      header: 'Action',
      render: (row) => (
        <button
          onClick={() => {
            setSelectedProjectId(row.id);
            setActiveTab('board');
          }}
          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold shadow-xs cursor-pointer"
        >
          View Kanban
        </button>
      ),
    },
  ];

  const milestoneColumns: ColumnDef<any>[] = [
    { key: 'title', header: 'Milestone Title', sortable: true },
    {
      key: 'billing_percentage',
      header: 'Billing %',
      render: (row) => `${row.billing_percentage}%`,
    },
    { key: 'due_date', header: 'Due Date', sortable: true },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">
          {row.status}
        </span>
      ),
    },
  ];

  const selectedTask = tasks.find((t: any) => t.id === selectedTaskId);

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-xs">
              <FolderGit2 className="w-5 h-5" />
            </div>
            Project Management & Delivery Workspace
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Agile sprints, interactive Kanban boards, milestone billing, and live timers
          </p>
        </div>

        {/* Project Selector Dropdown */}
        {projects.length > 0 && (
          <div className="flex items-center space-x-2 bg-white border border-slate-200 p-2 rounded-2xl shadow-xs">
            <span className="text-xs font-semibold text-slate-600 ml-1">Active Project:</span>
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
            >
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.project_code} — {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Workspace Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'projects'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <FolderGit2 className="w-3.5 h-3.5" />
          <span>All Projects ({projects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('board')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'board'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Sprint Kanban Board ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('milestones')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'milestones'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Milestones & Billing ({milestones.length})</span>
        </button>
      </div>

      {/* ALL PROJECTS OVERVIEW TABLE */}
      {activeTab === 'projects' && (
        <DataTable
          data={projects}
          columns={projectColumns}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Search projects by code, name, billing type..."
          searchableKeys={['project_code', 'name', 'billing_type', 'health_status']}
          isLoading={loadingProjects}
        />
      )}

      {/* SPRINT KANBAN BOARD */}
      {activeTab === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {TASK_COLUMNS.map((colStatus) => {
            const colTasks = tasks.filter((t: any) => t.status === colStatus);

            return (
              <div
                key={colStatus}
                className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-3.5 flex flex-col min-h-[500px] shadow-xs"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                  <span className="text-xs font-bold text-slate-900 tracking-wide">{colStatus}</span>
                  <span className="text-[11px] font-mono text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-xs font-medium">
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Task Cards */}
                <div className="space-y-2.5 flex-1">
                  {colTasks.map((task: any) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`p-3.5 bg-white border rounded-xl shadow-xs transition-all cursor-pointer space-y-2 ${
                        selectedTaskId === task.id
                          ? 'border-blue-600 ring-2 ring-blue-500/20'
                          : 'border-slate-200/90 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${
                            task.priority === 'URGENT'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : task.priority === 'HIGH'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {task.priority}
                        </span>
                        {task.estimated_hours > 0 && (
                          <span className="text-[10px] text-slate-500 font-mono font-medium">
                            {task.estimated_hours}h est.
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-bold text-slate-900">{task.title}</div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="font-medium text-slate-700">{task.assignee_name || 'Unassigned'}</span>
                        </div>
                        {task.subtasks?.length > 0 && (
                          <div className="flex items-center gap-1 font-mono text-slate-500 font-medium">
                            <ListTodo className="w-3 h-3" />
                            <span>
                              {task.subtasks.filter((st: any) => st.is_completed).length}/
                              {task.subtasks.length}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Advance Task Quick Trigger */}
                      {colStatus !== 'DONE' && (
                        <div className="pt-1 flex items-center justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const idx = TASK_COLUMNS.indexOf(colStatus);
                              const next = TASK_COLUMNS[idx + 1];
                              if (next) {
                                updateTaskStatusMutation.mutate({ taskId: task.id, status: next });
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-0.5 rounded-lg cursor-pointer transition-colors"
                          >
                            <span>Move</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MILESTONES TABLE */}
      {activeTab === 'milestones' && (
        <DataTable
          data={milestones}
          columns={milestoneColumns}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Search milestones..."
          searchableKeys={['title', 'status']}
          isLoading={loadingMilestones}
        />
      )}

      {/* TASK DETAILS SLIDE-OVER DRAWER */}
      {selectedTask && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl z-50 p-6 overflow-y-auto space-y-6 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-mono uppercase text-blue-600 font-semibold tracking-wider">Task Details</span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedTask.title}</h3>
            </div>
            <button
              onClick={() => setSelectedTaskId(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Time Tracking Widget */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-blue-600" />
                Live Task Timer
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => startTimerMutation.mutate(selectedTask.id)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Start</span>
                </button>
                <button
                  onClick={() => stopTimerMutation.mutate(selectedTask.id)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop</span>
                </button>
              </div>
            </div>
          </div>

          {/* Subtasks Checklist */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-800 block">Subtasks Checklist</span>
            <div className="space-y-1.5">
              {selectedTask.subtasks?.map((st: any) => (
                <div
                  key={st.id}
                  onClick={() => toggleSubtaskMutation.mutate(st.id)}
                  className="flex items-center space-x-2 text-xs text-slate-800 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={st.is_completed}
                    onChange={() => {}}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span className={st.is_completed ? 'line-through text-slate-400' : 'font-medium'}>
                    {st.title}
                  </span>
                </div>
              ))}
            </div>

            {/* Add Subtask Input */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="New subtask..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
              <button
                onClick={() => addSubtaskMutation.mutate()}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Task Comments Section */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <span className="text-xs font-semibold text-slate-800 block">Comments & Mentions</span>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {taskComments.map((c: any) => (
                <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="font-semibold text-slate-900">{c.author_name}</span>
                    <span>{new Date(c.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>

            {/* New Comment Input */}
            <div className="space-y-2">
              <textarea
                rows={2}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment or mention @team..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
              <button
                onClick={() => addCommentMutation.mutate()}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Post Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
