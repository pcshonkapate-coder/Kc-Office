"use client";

import { useState } from "react";
import { Plus, Search, UserCheck, Mail, Phone, Users } from "lucide-react";

export interface Employee {
  id: string;
  code: string;
  name: string;
  role: string;
  dept: string;
  type: "full_time" | "intern" | "freelancer" | "part_time";
  email: string;
  phone: string;
  joined: string;
  status: "active" | "inactive";
}

const initialEmployees: Employee[] = [];

const typeConfig: Record<string, { label: string; badge: string }> = {
  full_time: { label: "Full-Time", badge: "badge-success" },
  intern: { label: "Intern", badge: "badge-info" },
  freelancer: { label: "Freelancer", badge: "badge-warning" },
  part_time: { label: "Part-Time", badge: "badge-gray" },
};

const deptColors: Record<string, string> = {
  Engineering: "#6366f1",
  Consulting: "#8b5cf6",
  Delivery: "#06b6d4",
  Design: "#ec4899",
  Analytics: "#10b981",
  HR: "#f59e0b",
};

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase();
}

export default function WorkforcePage() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = employees.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase()) || e.dept.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || e.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)" }}>Workforce</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "4px" }}>
            {employees.filter(e => e.type === "full_time").length} employees · {employees.filter(e => e.type === "intern").length} interns · {employees.filter(e => e.type === "freelancer").length} freelancers
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn btn-secondary" id="export-workforce-btn">
            Export
          </button>
          <button className="btn btn-primary" id="add-employee-btn">
            <Plus size={16} /> Add Member
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: "24px" }}>
        {[
          { label: "Total Headcount", value: employees.length, sub: "Active members", color: "var(--brand-primary)" },
          { label: "Full-Time Staff", value: employees.filter(e => e.type === "full_time").length, sub: "Engineering & Delivery", color: "#10b981" },
          { label: "Interns", value: employees.filter(e => e.type === "intern").length, sub: "In mentorship program", color: "#06b6d4" },
          { label: "Contractors", value: employees.filter(e => e.type === "freelancer").length, sub: "Specialist resources", color: "#f59e0b" },
        ].map((k) => (
          <div key={k.label} className="card">
            <div style={{ fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "8px" }}>
              {k.label}
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: k.color, letterSpacing: "-0.03em" }}>{k.value}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {["all", "full_time", "intern", "freelancer"].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            style={{
              padding: "6px 16px",
              borderRadius: "20px",
              border: "1px solid",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: 600,
              background: typeFilter === t ? "var(--brand-primary)" : "var(--bg-elevated)",
              color: typeFilter === t ? "white" : "var(--text-muted)",
              borderColor: typeFilter === t ? "var(--brand-primary)" : "var(--border-subtle)",
              transition: "all 0.2s",
            }}
            id={`workforce-filter-${t}`}
          >
            {t.replace("_", " ") === "all" ? "All" : t.replace("_", "-")}
          </button>
        ))}
        <div style={{ marginLeft: "auto", position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            className="input"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "36px", width: "240px", height: "38px" }}
            id="workforce-search"
          />
        </div>
      </div>

      {/* Employee cards or Empty state */}
      {filtered.length === 0 ? (
        <div className="card text-center" style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--text-muted)" }}>
            <Users size={24} />
          </div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>No workforce members found</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", maxWidth: "380px", margin: "0 auto 20px" }}>
            Add your team members, contractors, and interns to manage assignments and timesheets.
          </p>
          <button className="btn btn-primary" style={{ margin: "0 auto" }}>
            <Plus size={16} /> Add Member
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px" }}>
          {filtered.map((emp) => {
            const tc = typeConfig[emp.type] || { label: emp.type, badge: "badge-gray" };
            const deptColor = deptColors[emp.dept] || "#6366f1";
            return (
              <div key={emp.id} className="card hover-lift" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <div
                    className="avatar"
                    style={{
                      width: "48px",
                      height: "48px",
                      fontSize: "1rem",
                      background: `linear-gradient(135deg, ${deptColor}cc, ${deptColor}66)`,
                    }}
                  >
                    {getInitials(emp.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <h3 style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {emp.name}
                      </h3>
                      <span className={`badge ${tc.badge}`} style={{ fontSize: "0.65rem", flexShrink: 0, marginLeft: "8px" }}>{tc.label}</span>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>{emp.role}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          color: deptColor,
                          background: `${deptColor}15`,
                          border: `1px solid ${deptColor}30`,
                          padding: "2px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        {emp.dept}
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{emp.code}</span>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    <Mail size={11} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.email}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    <Phone size={11} />
                    {emp.phone}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Joined: {new Date(emp.joined).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button title="Active" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "5px", cursor: "pointer", padding: "4px", color: "#10b981" }}>
                        <UserCheck size={12} />
                      </button>
                    </div>
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
