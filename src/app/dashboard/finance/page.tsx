"use client";

import { useState } from "react";
import { Plus, Download, Eye, CheckCircle, Clock, AlertCircle, TrendingUp, Receipt, CreditCard } from "lucide-react";

export interface Invoice {
  id: string;
  project: string;
  client: string;
  amount: number;
  issued: string;
  due: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  currency: string;
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  status: "draft" | "pending" | "approved" | "rejected";
  submittedBy: string;
}

const initialInvoices: Invoice[] = [];
const initialExpenses: Expense[] = [];

const statusConfig: Record<string, { badge: string; label: string; icon: React.ReactNode }> = {
  draft: { badge: "badge-gray", label: "Draft", icon: <Clock size={12} /> },
  sent: { badge: "badge-info", label: "Sent", icon: <Eye size={12} /> },
  paid: { badge: "badge-success", label: "Paid", icon: <CheckCircle size={12} /> },
  overdue: { badge: "badge-danger", label: "Overdue", icon: <AlertCircle size={12} /> },
  cancelled: { badge: "badge-gray", label: "Cancelled", icon: <Clock size={12} /> },
  pending: { badge: "badge-warning", label: "Pending", icon: <Clock size={12} /> },
  approved: { badge: "badge-success", label: "Approved", icon: <CheckCircle size={12} /> },
  rejected: { badge: "badge-danger", label: "Rejected", icon: <AlertCircle size={12} /> },
};

function formatINR(val: number) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${val.toLocaleString("en-IN")}`;
}

export default function FinancePage() {
  const [tab, setTab] = useState<"invoices" | "expenses">("invoices");
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((a, b) => a + b.amount, 0);
  const totalPending = invoices.filter(i => i.status === "sent").reduce((a, b) => a + b.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === "overdue").reduce((a, b) => a + b.amount, 0);
  const totalExpenses = expenses.filter(e => e.status === "approved").reduce((a, b) => a + b.amount, 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)" }}>Finance</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "4px" }}>Invoicing, expenses, and financial overview</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn btn-secondary" id="export-finance-btn">
            <Download size={14} />
            Export
          </button>
          <button className="btn btn-primary" id="create-invoice-btn">
            <Plus size={14} />
            {tab === "invoices" ? "New Invoice" : "Log Expense"}
          </button>
        </div>
      </div>

      {/* Finance KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Revenue Collected", value: formatINR(totalRevenue), sub: "This quarter", color: "#10b981", icon: <CheckCircle size={16} /> },
          { label: "Pending Receivable", value: formatINR(totalPending), sub: "Sent, awaiting payment", color: "#06b6d4", icon: <Eye size={16} /> },
          { label: "Overdue Amount", value: formatINR(totalOverdue), sub: "Immediate action needed", color: "#ef4444", icon: <AlertCircle size={16} /> },
          { label: "Total Expenses", value: formatINR(totalExpenses), sub: "Approved this month", color: "#f59e0b", icon: <TrendingUp size={16} /> },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ padding: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{s.label}</span>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0", marginBottom: "20px", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "10px", padding: "4px", width: "fit-content" }}>
        {(["invoices", "expenses"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 24px",
              borderRadius: "7px",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
              textTransform: "capitalize",
              background: tab === t ? "var(--brand-primary)" : "transparent",
              color: tab === t ? "white" : "var(--text-muted)",
              transition: "all 0.2s",
            }}
            id={`finance-tab-${t}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "invoices" && (
        invoices.length === 0 ? (
          <div className="card text-center" style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--text-muted)" }}>
              <Receipt size={24} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>No invoices created yet</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", maxWidth: "380px", margin: "0 auto 20px" }}>
              Generate GST-compliant tax invoices, track client receivables, and manage billing milestones.
            </p>
            <button className="btn btn-primary" style={{ margin: "0 auto" }}>
              <Plus size={14} /> Create Invoice
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Issued</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const sc = statusConfig[inv.status];
                  return (
                    <tr key={inv.id}>
                      <td style={{ fontFamily: "monospace", color: "var(--text-primary)", fontWeight: 700 }}>{inv.id}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{inv.project}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{inv.client}</td>
                      <td style={{ fontWeight: 700, color: inv.status === "paid" ? "#10b981" : inv.status === "overdue" ? "#ef4444" : "var(--text-primary)" }}>
                        {formatINR(inv.amount)}
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>{new Date(inv.issued).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                      <td style={{ color: inv.status === "overdue" ? "#ef4444" : "var(--text-muted)" }}>
                        {new Date(inv.due).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      <td>
                        <span className={`badge ${sc.badge}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          {sc.icon} {sc.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button style={{ background: "none", border: "1px solid var(--border-subtle)", borderRadius: "6px", cursor: "pointer", padding: "5px", color: "var(--text-muted)" }}>
                            <Eye size={12} />
                          </button>
                          <button style={{ background: "none", border: "1px solid var(--border-subtle)", borderRadius: "6px", cursor: "pointer", padding: "5px", color: "var(--text-muted)" }}>
                            <Download size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === "expenses" && (
        expenses.length === 0 ? (
          <div className="card text-center" style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--text-muted)" }}>
              <CreditCard size={24} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>No expenses logged</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", maxWidth: "380px", margin: "0 auto 20px" }}>
              Submit company expenses, software subscriptions, travel, and project disbursements for manager approval.
            </p>
            <button className="btn btn-primary" style={{ margin: "0 auto" }}>
              <Plus size={14} /> Log Expense
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Expense ID</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Submitted By</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => {
                  const sc = statusConfig[exp.status];
                  return (
                    <tr key={exp.id}>
                      <td style={{ fontFamily: "monospace", color: "var(--text-primary)", fontWeight: 700 }}>{exp.id}</td>
                      <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>{exp.description}</td>
                      <td>
                        <span className="badge badge-gray">{exp.category}</span>
                      </td>
                      <td style={{ fontWeight: 700, color: "var(--text-primary)" }}>{formatINR(exp.amount)}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div className="avatar" style={{ width: "24px", height: "24px", fontSize: "0.65rem" }}>
                            {exp.submittedBy.split(" ").map(n => n[0]).join("")}
                          </div>
                          {exp.submittedBy}
                        </div>
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>{new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                      <td>
                        <span className={`badge ${sc.badge}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          {sc.icon} {sc.label}
                        </span>
                      </td>
                      <td>
                        {exp.status === "pending" && (
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "6px", cursor: "pointer", padding: "4px 8px", color: "#10b981", fontSize: "0.72rem", fontWeight: 600 }}>
                              Approve
                            </button>
                            <button style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", cursor: "pointer", padding: "4px 8px", color: "#ef4444", fontSize: "0.72rem", fontWeight: 600 }}>
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
