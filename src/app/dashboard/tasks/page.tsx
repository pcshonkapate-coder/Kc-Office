"use client";

import { useState } from "react";
import { CheckSquare, Plus, Circle, Clock, AlertCircle } from "lucide-react";

export interface Task {
  id: string;
  title: string;
  project: string;
  assignee: string;
  priority: "high" | "medium" | "low";
  status: "todo" | "in_progress" | "review" | "done";
  due: string;
}

const initialTasks: Task[] = [];

const statusCols = [
  { key: "todo", label: "To Do", color: "#94a3b8", icon: <Circle size={14} /> },
  { key: "in_progress", label: "In Progress", color: "#6366f1", icon: <Clock size={14} /> },
  { key: "review", label: "In Review", color: "#f59e0b", icon: <AlertCircle size={14} /> },
  { key: "done", label: "Done", color: "#10b981", icon: <CheckSquare size={14} /> },
];

const priorityBadge: Record<string, string> = { high: "badge-danger", medium: "badge-warning", low: "badge-gray" };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)" }}>Tasks</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "4px" }}>
            {tasks.filter(t => t.status !== "done").length} open tasks across all projects
          </p>
        </div>
        <button className="btn btn-primary" id="add-task-btn"><Plus size={14} />New Task</button>
      </div>
      <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "16px" }}>
        {statusCols.map((col) => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div key={col.key} style={{ flex: "0 0 280px", minWidth: "260px", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "10px", padding: "14px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <span style={{ color: col.color }}>{col.icon}</span>
                <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)" }}>{col.label}</span>
                <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--text-muted)", background: "var(--bg-hover)", padding: "2px 8px", borderRadius: "10px" }}>
                  {colTasks.length}
                </span>
              </div>
              {colTasks.length === 0 ? (
                <div style={{ padding: "28px 12px", textAlign: "center", border: "1px dashed var(--border-subtle)", borderRadius: "8px", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                  No tasks in {col.label}
                </div>
              ) : (
                colTasks.map((task) => (
                  <div key={task.id} className="pipeline-card" style={{ marginBottom: "10px", padding: "14px" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", marginBottom: "8px" }}>{task.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "10px" }}>{task.project}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div className="avatar" style={{ width: "24px", height: "24px", fontSize: "0.65rem" }}>
                        {task.assignee.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <span className={`badge ${priorityBadge[task.priority]}`} style={{ fontSize: "0.65rem" }}>{task.priority}</span>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{new Date(task.due).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
