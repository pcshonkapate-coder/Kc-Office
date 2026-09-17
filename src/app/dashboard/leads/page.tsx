"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Building2,
  Globe,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  X,
  UserCheck,
  Tag,
  Activity as ActivityIcon,
} from "lucide-react";
import {
  crmApi,
  Lead,
  Service,
  LEAD_SOURCES,
  formatCurrencyINR,
} from "@/lib/crm-api";

const statusBadges: Record<string, string> = {
  "NEW LEAD": "badge-info",
  "QUALIFICATION": "badge-primary",
  "DISCOVERY BOOKED": "badge-warning",
  "DISCOVERY COMPLETED": "badge-warning",
  qualified: "badge-success",
  contacted: "badge-warning",
  converted: "badge-success",
  disqualified: "badge-danger",
};

const priorityColors: Record<string, string> = {
  urgent: "#ef4444",
  high: "#f97316",
  medium: "#6366f1",
  low: "#64748b",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Modals & Drawers
  const [newLeadModal, setNewLeadModal] = useState(false);
  const [convertModal, setConvertModal] = useState(false);
  const [activityModal, setActivityModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Forms
  const [newLeadForm, setNewLeadForm] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    country: "India",
    city: "",
    job_title: "",
    service_interest: "AI Development",
    budget: "₹25L - ₹50L",
    currency: "INR",
    project_description: "",
    source: "Website contact form",
    priority: "medium" as const,
    lead_score: 75,
    status: "NEW LEAD",
    notes: "",
  });

  const [convertForm, setConvertForm] = useState({
    deal_title: "",
    estimated_value: 2500000,
    currency: "INR",
    pipeline_stage: "QUALIFICATION",
  });

  const [activityForm, setActivityForm] = useState<{
    activity_type: "call" | "email" | "meeting" | "note" | "follow_up" | "task";
    subject: string;
    notes: string;
  }>({
    activity_type: "call",
    subject: "",
    notes: "",
  });

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [leadsData, servicesData] = await Promise.all([
        crmApi.getLeads(),
        crmApi.getServices(),
      ]);
      setLeads(leadsData);
      setServices(servicesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchSearch =
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.company_name.toLowerCase().includes(search.toLowerCase()) ||
        l.email.toLowerCase().includes(search.toLowerCase()) ||
        l.lead_code.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "ALL" || l.status === statusFilter;
      const matchSource = sourceFilter === "ALL" || l.source === sourceFilter;
      const matchPriority = priorityFilter === "ALL" || l.priority === priorityFilter;

      return matchSearch && matchStatus && matchSource && matchPriority;
    });
  }, [leads, search, statusFilter, sourceFilter, priorityFilter]);

  // Submit New Lead
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await crmApi.createLead(newLeadForm);
      showToast(`Lead ${created.lead_code} created successfully!`);
      setNewLeadModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create lead");
    }
  };

  // Open Convert Modal
  const handleOpenConvert = (lead: Lead) => {
    setSelectedLead(lead);
    setConvertForm({
      deal_title: `${lead.company_name} - ${lead.service_interest || "Engagement"}`,
      estimated_value: 2500000,
      currency: lead.currency || "INR",
      pipeline_stage: "QUALIFICATION",
    });
    setConvertModal(true);
  };

  // Submit Convert
  const handleConvertLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    try {
      const deal = await crmApi.convertLead(selectedLead.id, convertForm);
      showToast(`Lead converted to Deal "${deal.title}"!`);
      setConvertModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to convert lead");
    }
  };

  // Open Activity Modal
  const handleOpenActivity = (lead: Lead) => {
    setSelectedLead(lead);
    setActivityForm({
      activity_type: "call",
      subject: `Call with ${lead.name}`,
      notes: "",
    });
    setActivityModal(true);
  };

  // Submit Activity
  const handleSubmitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !activityForm.subject) return;
    try {
      await crmApi.createActivity({
        entity_type: "lead",
        entity_id: selectedLead.id,
        activity_type: activityForm.activity_type,
        subject: activityForm.subject,
        notes: activityForm.notes || "Lead outreach",
        status: "completed",
      });
      showToast(`Activity logged for ${selectedLead.name}`);
      setActivityModal(false);
    } catch (err: any) {
      alert(err.message || "Failed logging activity");
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "40px" }}>
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "white",
            padding: "12px 20px",
            borderRadius: "10px",
            boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            zIndex: 1000,
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="page-header" style={{ marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Inbound & Qualified Leads
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "4px" }}>
            {leads.length} total captured leads ·{" "}
            {leads.filter((l) => l.status === "converted").length} converted to active deals
          </p>
        </div>
        <button
          className="btn btn-primary"
          id="add-lead-btn"
          onClick={() => setNewLeadModal(true)}
        >
          <Plus size={15} />
          Add Lead
        </button>
      </div>

      {/* Quick Status Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {["ALL", "NEW LEAD", "QUALIFICATION", "DISCOVERY BOOKED", "converted"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: "1px solid",
              cursor: "pointer",
              fontSize: "0.78rem",
              fontWeight: 600,
              background: statusFilter === st ? "var(--brand-primary)" : "var(--bg-elevated)",
              color: statusFilter === st ? "white" : "var(--text-muted)",
              borderColor: statusFilter === st ? "var(--brand-primary)" : "var(--border-subtle)",
              transition: "all 0.15s",
            }}
          >
            {st === "ALL"
              ? `All (${leads.length})`
              : `${st} (${leads.filter((l) => l.status === st).length})`}
          </button>
        ))}
      </div>

      {/* Filter Row */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: "240px", maxWidth: "340px" }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            className="input"
            placeholder="Search name, company, email, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "34px", height: "36px", fontSize: "0.82rem" }}
            id="leads-search"
          />
        </div>

        {/* Source Filter */}
        <select
          className="input"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          style={{ width: "180px", height: "36px", fontSize: "0.8rem" }}
        >
          <option value="ALL">All Sources</option>
          {LEAD_SOURCES.map((src) => (
            <option key={src} value={src}>
              {src}
            </option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          className="input"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{ width: "140px", height: "36px", fontSize: "0.8rem" }}
        >
          <option value="ALL">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Leads Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Lead ID</th>
              <th>Contact & Company</th>
              <th>Service Interest</th>
              <th>Budget Range</th>
              <th>Lead Source</th>
              <th>Priority</th>
              <th>Score</th>
              <th>Status</th>
              <th>Follow-up</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => {
              const prioColor = priorityColors[lead.priority] || "#6366f1";
              return (
                <tr key={lead.id}>
                  {/* Lead ID */}
                  <td>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--brand-primary)",
                        background: "rgba(99,102,241,0.1)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      {lead.lead_code}
                    </span>
                  </td>

                  {/* Name & Company */}
                  <td>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.875rem" }}>
                        {lead.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        <Building2 size={11} /> {lead.company_name}
                        {lead.job_title && <span>· {lead.job_title}</span>}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        {lead.email} {lead.phone && `· ${lead.phone}`}
                      </div>
                    </div>
                  </td>

                  {/* Service */}
                  <td>
                    <span className="badge badge-gray">{lead.service_interest || "AI Consulting"}</span>
                  </td>

                  {/* Budget */}
                  <td>
                    <span style={{ fontWeight: 600, color: "#10b981", fontSize: "0.82rem" }}>
                      {lead.budget || "—"}
                    </span>
                  </td>

                  {/* Source */}
                  <td>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        background: "var(--bg-hover)",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {lead.source}
                    </span>
                  </td>

                  {/* Priority */}
                  <td>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: prioColor,
                      }}
                    >
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: prioColor }} />
                      {lead.priority}
                    </span>
                  </td>

                  {/* Lead Score */}
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          color: lead.lead_score >= 80 ? "#10b981" : lead.lead_score >= 50 ? "#f59e0b" : "#64748b",
                        }}
                      >
                        {lead.lead_score}
                      </div>
                      <div className="progress-bar" style={{ width: "45px", height: "4px" }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${lead.lead_score}%`,
                            background: lead.lead_score >= 80 ? "#10b981" : "#f59e0b",
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    <span className={`badge ${statusBadges[lead.status] || "badge-gray"}`}>
                      {lead.status}
                    </span>
                  </td>

                  {/* Follow up */}
                  <td style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {lead.next_follow_up_at ? new Date(lead.next_follow_up_at).toLocaleDateString() : "—"}
                  </td>

                  {/* Actions */}
                  <td>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <button
                        onClick={() => handleOpenActivity(lead)}
                        title="Log Activity"
                        style={{
                          background: "none",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "6px",
                          padding: "5px",
                          cursor: "pointer",
                          color: "var(--text-muted)",
                        }}
                      >
                        <Phone size={12} />
                      </button>

                      {lead.status !== "converted" ? (
                        <button
                          onClick={() => handleOpenConvert(lead)}
                          title="Convert to Deal"
                          style={{
                            background: "rgba(16,185,129,0.12)",
                            border: "1px solid rgba(16,185,129,0.35)",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            color: "#10b981",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Convert
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.7rem", color: "#10b981", fontWeight: 600 }}>
                          Converted
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ==================== CREATE LEAD MODAL ==================== */}
      {newLeadModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "540px",
              padding: "24px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Add Inbound Lead
              </h2>
              <button onClick={() => setNewLeadModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateLead}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                    Contact Name *
                  </label>
                  <input
                    className="input"
                    value={newLeadForm.name}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                    Company Name *
                  </label>
                  <input
                    className="input"
                    value={newLeadForm.company_name}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, company_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                    Email *
                  </label>
                  <input
                    className="input"
                    type="email"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                    Phone
                  </label>
                  <input
                    className="input"
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                    Country
                  </label>
                  <input
                    className="input"
                    value={newLeadForm.country}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, country: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                    City
                  </label>
                  <input
                    className="input"
                    value={newLeadForm.city}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, city: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                    Job Title
                  </label>
                  <input
                    className="input"
                    value={newLeadForm.job_title}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, job_title: e.target.value })}
                    placeholder="e.g. VP Engineering"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                    Service Interest
                  </label>
                  <select
                    className="input"
                    value={newLeadForm.service_interest}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, service_interest: e.target.value })}
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                    Lead Source
                  </label>
                  <select
                    className="input"
                    value={newLeadForm.source}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, source: e.target.value })}
                  >
                    {LEAD_SOURCES.map((src) => (
                      <option key={src} value={src}>
                        {src}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                    Priority
                  </label>
                  <select
                    className="input"
                    value={newLeadForm.priority}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, priority: e.target.value as any })}
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                    Budget
                  </label>
                  <input
                    className="input"
                    value={newLeadForm.budget}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, budget: e.target.value })}
                    placeholder="e.g. ₹30L - ₹50L"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                    Lead Score (0-100)
                  </label>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    max={100}
                    value={newLeadForm.lead_score}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, lead_score: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                  Project Description / Brief
                </label>
                <textarea
                  className="input"
                  rows={3}
                  value={newLeadForm.project_description}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, project_description: e.target.value })}
                  placeholder="Outline client challenges and expected deliverables..."
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setNewLeadModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CONVERT LEAD MODAL ==================== */}
      {convertModal && selectedLead && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div className="card" style={{ width: "100%", maxWidth: "480px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Convert Lead to Pipeline Opportunity
                </h2>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Generates Company #{selectedLead.company_name}, Contact #{selectedLead.name}, and Deal
                </p>
              </div>
              <button onClick={() => setConvertModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConvertLead}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                  Deal Title
                </label>
                <input
                  className="input"
                  value={convertForm.deal_title}
                  onChange={(e) => setConvertForm({ ...convertForm, deal_title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                    Estimated Value (INR)
                  </label>
                  <input
                    className="input"
                    type="number"
                    value={convertForm.estimated_value}
                    onChange={(e) => setConvertForm({ ...convertForm, estimated_value: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                    Stage
                  </label>
                  <select
                    className="input"
                    value={convertForm.pipeline_stage}
                    onChange={(e) => setConvertForm({ ...convertForm, pipeline_stage: e.target.value })}
                  >
                    <option value="QUALIFICATION">QUALIFICATION</option>
                    <option value="DISCOVERY BOOKED">DISCOVERY BOOKED</option>
                    <option value="TECHNICAL ASSESSMENT">TECHNICAL ASSESSMENT</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setConvertModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: "#10b981", borderColor: "#10b981" }}>
                  Confirm Conversion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ACTIVITY MODAL ==================== */}
      {activityModal && selectedLead && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div className="card" style={{ width: "100%", maxWidth: "440px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Log Outreach Activity</h3>
              <button onClick={() => setActivityModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitActivity}>
              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                  Activity Type
                </label>
                <select
                  className="input"
                  value={activityForm.activity_type}
                  onChange={(e) => setActivityForm({ ...activityForm, activity_type: e.target.value as any })}
                >
                  <option value="call">Phone Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Consultation Meeting</option>
                  <option value="note">Internal Note</option>
                  <option value="task">Follow-up Task</option>
                </select>
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                  Subject
                </label>
                <input
                  className="input"
                  value={activityForm.subject}
                  onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                  Notes
                </label>
                <textarea
                  className="input"
                  rows={3}
                  value={activityForm.notes}
                  onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActivityModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
