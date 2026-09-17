"use client";

import { useState } from "react";
import { Plus, Search, MoreHorizontal, Users, Calendar, DollarSign, AlertCircle, Briefcase } from "lucide-react";

export interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  pm: string;
  type: string;
  status: "active" | "on_hold" | "completed" | "discovery" | "archived";
  budget: number;
  spent: number;
  progress: number;
  start: string;
  end: string;
  team: number;
}

const initialProjects: Project[] = [];

const statusConfig: Record<string, { label: string; badge: string; dot: string }> = {
  active: { label: "Active", badge: "badge-success", dot: "#10b981" },
  on_hold: { label: "On Hold", badge: "badge-warning", dot: "#f59e0b" },
  completed: { label: "Completed", badge: "badge-primary", dot: "#6366f1" },
  discovery: { label: "Discovery", badge: "badge-info", dot: "#06b6d4" },
  archived: { label: "Archived", badge: "badge-gray", dot: "#64748b" },
};

function formatINR(val: number) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${val.toLocaleString("en-IN")}`;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.client.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)" }}>Projects</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "4px" }}>
            {projects.filter(p => p.status === "active").length} active · {projects.filter(p => p.status === "completed").length} completed
          </p>
        </div>
        <button className="btn btn-primary" id="new-project-btn">
          <Plus size={14} />
          New Project
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {["all", "active", "on_hold", "completed"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: "6px 16px",
              borderRadius: "20px",
              border: "1px solid",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: 600,
              textTransform: "capitalize",
              background: statusFilter === s ? "var(--brand-primary)" : "var(--bg-elevated)",
              color: statusFilter === s ? "white" : "var(--text-muted)",
              borderColor: statusFilter === s ? "var(--brand-primary)" : "var(--border-subtle)",
              transition: "all 0.2s",
            }}
            id={`project-filter-${s}`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
        <div style={{ marginLeft: "auto", position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            className="input"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "36px", width: "280px", height: "38px" }}
            id="projects-search"
          />
        </div>
      </div>

      {/* Project cards grid or empty state */}
      {filtered.length === 0 ? (
        <div className="card text-center" style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--text-muted)" }}>
            <Briefcase size={24} />
          </div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>No active projects yet</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", maxWidth: "380px", margin: "0 auto 20px" }}>
            Create your first client engagement to track milestones, budgets, time allocation, and delivery sprints.
          </p>
          <button className="btn btn-primary" style={{ margin: "0 auto" }}>
            <Plus size={14} /> New Project
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "16px" }}>
          {filtered.map((project) => {
            const sc = statusConfig[project.status];
            const budgetUsed = Math.round((project.spent / (project.budget || 1)) * 100);
            const overBudget = budgetUsed > 95;

            return (
              <div key={project.id} className="card hover-lift" style={{ cursor: "pointer", transition: "all 0.2s" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700, fontFamily: "monospace", letterSpacing: "0.05em" }}>{project.code}</span>
                      <span className={`badge ${sc.badge}`} style={{ fontSize: "0.7rem" }}>{sc.label}</span>
                    </div>
                    <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", margin: 0 }}>{project.name}</h3>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "3px" }}>{project.client}</div>
                  </div>
                  <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                {/* Progress */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Completion</span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: project.progress >= 100 ? "#10b981" : "var(--text-primary)" }}>{project.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${project.progress}%`,
                        background: project.progress >= 100 ? "#10b981" : project.progress < 30 ? "#f59e0b" : "linear-gradient(90deg, #6366f1, #8b5cf6)",
                      }}
                    />
                  </div>
                </div>

                {/* Budget */}
                <div style={{ marginBottom: "14px", padding: "10px 12px", background: "var(--bg-elevated)", borderRadius: "8px", border: overBudget ? "1px solid rgba(239,68,68,0.3)" : "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <DollarSign size={11} /> Budget Utilization
                      {overBudget && <AlertCircle size={11} color="#ef4444" />}
                    </span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: overBudget ? "#ef4444" : "var(--text-secondary)" }}>{budgetUsed}%</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Spent: <strong style={{ color: overBudget ? "#ef4444" : "var(--text-primary)" }}>{formatINR(project.spent)}</strong></span>
                    <span style={{ color: "var(--text-muted)" }}>of {formatINR(project.budget)}</span>
                  </div>
                </div>

                {/* Meta */}
                <div style={{ display: "flex", gap: "16px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Users size={12} />
                    {project.team} members
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Calendar size={12} />
                    Due: {new Date(project.end).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </div>
                  <div style={{ marginLeft: "auto", fontWeight: 600, color: "var(--text-secondary)" }}>
                    PM: {project.pm ? project.pm.split(" ")[0] : "—"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
