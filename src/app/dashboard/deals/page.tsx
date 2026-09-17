"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  Building2,
  TrendingUp,
  DollarSign,
  Calendar,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  X,
  Briefcase,
  History,
  Activity as ActivityIcon,
  ExternalLink,
  Eye,
  ChevronRight,
} from "lucide-react";
import {
  crmApi,
  Deal,
  Service,
  Company,
  DealStageHistory,
  Activity,
  PIPELINE_STAGES,
  STAGE_COLORS,
  formatCurrencyINR,
} from "@/lib/crm-api";

const stageProbability: Record<string, number> = {
  "NEW LEAD": 10,
  "QUALIFICATION": 20,
  "DISCOVERY BOOKED": 30,
  "DISCOVERY COMPLETED": 40,
  "TECHNICAL ASSESSMENT": 50,
  "NDA / MSA": 60,
  "PROPOSAL / SOW": 75,
  "NEGOTIATION": 85,
  "CLOSED WON": 100,
  "CLOSED LOST": 0,
};

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");

  // Modals
  const [newDealModal, setNewDealModal] = useState(false);
  const [dealDrawer, setDealDrawer] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [dealHistory, setDealHistory] = useState<DealStageHistory[]>([]);
  const [dealActivities, setDealActivities] = useState<Activity[]>([]);

  // Form
  const [form, setForm] = useState({
    title: "",
    company_id: "",
    primary_contact_id: "",
    service_id: "",
    estimated_value: 1000000,
    currency: "INR",
    pipeline_stage: "NEW LEAD",
    win_probability: 10,
    expected_close_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    notes: "",
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
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [dealsData, servicesData, companiesData] = await Promise.all([
        crmApi.getDeals(),
        crmApi.getServices(),
        crmApi.getCompanies(),
      ]);
      setDeals(dealsData);
      setServices(servicesData);
      setCompanies(companiesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      const matchSearch =
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        (d.company_name && d.company_name.toLowerCase().includes(search.toLowerCase())) ||
        (d.service_name && d.service_name.toLowerCase().includes(search.toLowerCase()));

      const matchStage = stageFilter === "ALL" || d.pipeline_stage === stageFilter;
      const matchCompany = companyFilter === "ALL" || d.company_id === companyFilter;
      const matchService = serviceFilter === "ALL" || d.service_id === serviceFilter;

      return matchSearch && matchStage && matchCompany && matchService;
    });
  }, [deals, search, stageFilter, companyFilter, serviceFilter]);

  // Stats
  const stats = useMemo(() => {
    const openDeals = deals.filter(
      (d) => !["CLOSED WON", "CLOSED LOST"].includes(d.pipeline_stage)
    );
    const wonDeals = deals.filter((d) => d.pipeline_stage === "CLOSED WON");
    const lostDeals = deals.filter((d) => d.pipeline_stage === "CLOSED LOST");
    const pipelineValue = openDeals.reduce((s, d) => s + d.estimated_value, 0);
    const wonRevenue = wonDeals.reduce((s, d) => s + d.estimated_value, 0);
    const avgDealSize = deals.length > 0
      ? Math.round(deals.reduce((s, d) => s + d.estimated_value, 0) / deals.length)
      : 0;
    const winRate = wonDeals.length + lostDeals.length > 0
      ? Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)
      : 0;

    return {
      total: deals.length,
      open: openDeals.length,
      won: wonDeals.length,
      lost: lostDeals.length,
      pipelineValue,
      wonRevenue,
      avgDealSize,
      winRate,
    };
  }, [deals]);

  const handleAddDeal = async () => {
    if (!form.title || !form.company_id) {
      showToast("Title and Company are required");
      return;
    }
    setSubmitting(true);
    try {
      await crmApi.createDeal(form);
      showToast("Deal created successfully!");
      setNewDealModal(false);
      setForm({
        title: "",
        company_id: "",
        primary_contact_id: "",
        service_id: "",
        estimated_value: 1000000,
        currency: "INR",
        pipeline_stage: "NEW LEAD",
        win_probability: 10,
        expected_close_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        notes: "",
      });
      await loadData();
    } catch (err) {
      showToast("Failed to create deal. Ensure the backend is running.");
    } finally {
      setSubmitting(false);
    }
  };

  const openDealDetail = async (deal: Deal) => {
    setSelectedDeal(deal);
    setDealDrawer(true);
    try {
      const [activities] = await Promise.all([
        crmApi.getActivities("deal", deal.id),
      ]);
      setDealActivities(activities);
      setDealHistory(deal.stage_history || []);
    } catch {
      setDealActivities([]);
      setDealHistory([]);
    }
  };

  const handleStageUpdate = async (dealId: string, newStage: string) => {
    try {
      await crmApi.updateDealStage(dealId, newStage, undefined, stageProbability[newStage]);
      showToast(`Deal moved to ${newStage}`);
      await loadData();
      if (selectedDeal?.id === dealId) {
        const updated = deals.find((d) => d.id === dealId);
        if (updated) setSelectedDeal({ ...updated, pipeline_stage: newStage });
      }
    } catch {
      showToast("Failed to update stage");
    }
  };

  const handleLogActivity = async () => {
    if (!selectedDeal || !activityForm.subject) return;
    try {
      await crmApi.createActivity({
        entity_type: "deal",
        entity_id: selectedDeal.id,
        ...activityForm,
        status: "completed",
      });
      showToast("Activity logged!");
      setActivityForm({ activity_type: "call", subject: "", notes: "" });
      const acts = await crmApi.getActivities("deal", selectedDeal.id);
      setDealActivities(acts);
    } catch {
      showToast("Failed to log activity");
    }
  };

  const handleConvertToProject = async (dealId: string) => {
    try {
      await crmApi.convertDealToProject(dealId);
      showToast("Deal converted to Project & Contract!");
    } catch {
      showToast("Failed to convert deal");
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed", top: "80px", right: "32px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "white", padding: "14px 24px", borderRadius: "12px",
            fontSize: "0.85rem", fontWeight: 600, zIndex: 1000,
            boxShadow: "0 8px 32px rgba(99,102,241,0.4)",
            animation: "slideInRight 0.3s ease",
          }}
        >
          {toast}
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(139,92,246,0.3)",
            }}>
              <Briefcase size={18} color="white" />
            </div>
            Deals
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "6px" }}>
            Track and manage your sales pipeline deals
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <a
            href="/dashboard/crm"
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "10px 16px", borderRadius: "10px",
              background: "var(--bg-elevated)", color: "var(--text-secondary)",
              border: "1px solid var(--border-default)",
              fontSize: "0.85rem", fontWeight: 600, textDecoration: "none",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            <TrendingUp size={15} /> Pipeline View
          </a>
          <button
            className="btn btn-primary"
            onClick={() => setNewDealModal(true)}
            id="add-deal-btn"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Plus size={16} />
            New Deal
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          {
            label: "Pipeline Value",
            value: formatCurrencyINR(stats.pipelineValue),
            sub: `${stats.open} open deals`,
            icon: <TrendingUp size={18} />,
            gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            shadow: "rgba(99,102,241,0.3)",
          },
          {
            label: "Won Revenue",
            value: formatCurrencyINR(stats.wonRevenue),
            sub: `${stats.won} won deals`,
            icon: <CheckCircle2 size={18} />,
            gradient: "linear-gradient(135deg, #10b981, #059669)",
            shadow: "rgba(16,185,129,0.3)",
          },
          {
            label: "Win Rate",
            value: `${stats.winRate}%`,
            sub: `${stats.lost} lost`,
            icon: <DollarSign size={18} />,
            gradient: "linear-gradient(135deg, #f59e0b, #f97316)",
            shadow: "rgba(245,158,11,0.3)",
          },
          {
            label: "Avg Deal Size",
            value: formatCurrencyINR(stats.avgDealSize),
            sub: `${stats.total} total deals`,
            icon: <Briefcase size={18} />,
            gradient: "linear-gradient(135deg, #06b6d4, #3b82f6)",
            shadow: "rgba(6,182,212,0.3)",
          },
        ].map((stat, idx) => (
          <div key={idx} className="card" style={{ padding: "20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "14px", right: "14px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: stat.gradient,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 4px 12px ${stat.shadow}`,
              }}>
                {stat.icon}
              </div>
            </div>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
              {stat.label}
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {stat.value}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: "20px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: "320px" }}>
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            className="input"
            placeholder="Search deals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="deals-search"
            style={{ paddingLeft: "36px", height: "38px", fontSize: "0.85rem" }}
          />
        </div>
        <Filter size={14} color="var(--text-muted)" />
        <select
          className="input"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          id="stage-filter"
          style={{ height: "38px", width: "180px", fontSize: "0.85rem" }}
        >
          <option value="ALL">All Stages</option>
          {PIPELINE_STAGES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          className="input"
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          style={{ height: "38px", width: "200px", fontSize: "0.85rem" }}
        >
          <option value="ALL">All Companies</option>
          {companies.map((co) => (
            <option key={co.id} value={co.id}>{co.name}</option>
          ))}
        </select>
        <select
          className="input"
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          style={{ height: "38px", width: "180px", fontSize: "0.85rem" }}
        >
          <option value="ALL">All Services</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {(search || stageFilter !== "ALL" || companyFilter !== "ALL" || serviceFilter !== "ALL") && (
          <button
            onClick={() => { setSearch(""); setStageFilter("ALL"); setCompanyFilter("ALL"); setServiceFilter("ALL"); }}
            style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444", borderRadius: "8px", padding: "8px 14px", cursor: "pointer",
              fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px",
            }}
          >
            <X size={12} /> Clear
          </button>
        )}
        <div style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {filteredDeals.length} deal{filteredDeals.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Deals Table */}
      {loading ? (
        <div className="card" style={{ padding: "60px", textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid var(--border-subtle)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <div style={{ color: "var(--text-muted)" }}>Loading deals...</div>
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="card" style={{ padding: "60px", textAlign: "center" }}>
          <Briefcase size={40} color="var(--text-muted)" style={{ margin: "0 auto 12px", opacity: 0.3 }} />
          <div style={{ color: "var(--text-muted)", fontSize: "0.95rem", fontWeight: 600, marginBottom: "6px" }}>
            No deals found
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
            {search || stageFilter !== "ALL" ? "Try adjusting your filters" : "Click \"New Deal\" to get started"}
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                {["Deal", "Company", "Service", "Value", "Stage", "Probability", "Close Date", "Owner", ""].map((h) => (
                  <th key={h} style={{
                    padding: "14px 16px", fontSize: "0.7rem", fontWeight: 700,
                    color: "var(--text-muted)", textTransform: "uppercase",
                    letterSpacing: "0.08em", textAlign: "left",
                    background: "var(--bg-elevated)",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredDeals.map((d, idx) => (
                <tr
                  key={d.id}
                  style={{
                    borderBottom: idx < filteredDeals.length - 1 ? "1px solid var(--border-subtle)" : "none",
                    cursor: "pointer", transition: "background 0.15s",
                  }}
                  onClick={() => openDealDetail(d)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Deal title */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>
                      {d.title}
                    </div>
                    {d.primary_contact_name && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        {d.primary_contact_name}
                      </div>
                    )}
                  </td>

                  {/* Company */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      <Building2 size={13} color="var(--text-muted)" />
                      {d.company_name || "—"}
                    </div>
                  </td>

                  {/* Service */}
                  <td style={{ padding: "14px 16px" }}>
                    {d.service_name ? (
                      <span style={{
                        padding: "3px 10px", borderRadius: "16px",
                        fontSize: "0.75rem", fontWeight: 600,
                        background: "rgba(139,92,246,0.1)", color: "#8b5cf6",
                        border: "1px solid rgba(139,92,246,0.2)",
                      }}>
                        {d.service_name}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>—</span>
                    )}
                  </td>

                  {/* Value */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                      {formatCurrencyINR(d.estimated_value)}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{d.currency}</div>
                  </td>

                  {/* Stage */}
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "5px",
                        padding: "4px 12px", borderRadius: "20px",
                        fontSize: "0.72rem", fontWeight: 700,
                        background: `${STAGE_COLORS[d.pipeline_stage] || "#6366f1"}15`,
                        color: STAGE_COLORS[d.pipeline_stage] || "#6366f1",
                        border: `1px solid ${STAGE_COLORS[d.pipeline_stage] || "#6366f1"}30`,
                      }}
                    >
                      <span style={{
                        width: "6px", height: "6px", borderRadius: "50%",
                        background: STAGE_COLORS[d.pipeline_stage] || "#6366f1",
                      }} />
                      {d.pipeline_stage}
                    </span>
                  </td>

                  {/* Probability */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{
                        width: "50px", height: "6px", borderRadius: "3px",
                        background: "var(--bg-elevated)",
                      }}>
                        <div style={{
                          width: `${d.win_probability}%`, height: "100%", borderRadius: "3px",
                          background: d.win_probability >= 75 ? "#10b981" : d.win_probability >= 50 ? "#f59e0b" : d.win_probability >= 25 ? "#6366f1" : "#ef4444",
                          transition: "width 0.3s",
                        }} />
                      </div>
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                        {d.win_probability}%
                      </span>
                    </div>
                  </td>

                  {/* Close Date */}
                  <td style={{ padding: "14px 16px" }}>
                    {d.expected_close_date ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                        <Calendar size={12} color="var(--text-muted)" />
                        {new Date(d.expected_close_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>—</span>
                    )}
                  </td>

                  {/* Owner */}
                  <td style={{ padding: "14px 16px" }}>
                    {d.owner_name ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{
                          width: "24px", height: "24px", borderRadius: "6px",
                          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "white", fontSize: "0.6rem", fontWeight: 700,
                        }}>
                          {d.owner_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                          {d.owner_name.split(" ")[0]}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>—</span>
                    )}
                  </td>

                  {/* Action */}
                  <td style={{ padding: "14px 16px" }}>
                    <ChevronRight size={14} color="var(--text-muted)" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── New Deal Modal ── */}
      {newDealModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)", zIndex: 200,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setNewDealModal(false)}
        >
          <div
            className="card"
            style={{
              width: "620px", maxHeight: "85vh", overflow: "auto",
              padding: "28px", animation: "slideInRight 0.3s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Plus size={16} color="white" />
                </div>
                New Deal
              </h2>
              <button onClick={() => setNewDealModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Title */}
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px", display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Deal Title *
                </label>
                <input
                  className="input"
                  placeholder="e.g. AI Risk Assessment Engine"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={{ height: "40px" }}
                />
              </div>

              {/* Company + Service */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px", display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Company *
                  </label>
                  <select
                    className="input"
                    value={form.company_id}
                    onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                    style={{ height: "40px" }}
                  >
                    <option value="">— Select —</option>
                    {companies.map((co) => (
                      <option key={co.id} value={co.id}>{co.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px", display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Service
                  </label>
                  <select
                    className="input"
                    value={form.service_id}
                    onChange={(e) => setForm({ ...form, service_id: e.target.value })}
                    style={{ height: "40px" }}
                  >
                    <option value="">— Select —</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Value + Currency */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px", display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Estimated Value
                  </label>
                  <input
                    className="input"
                    type="number"
                    value={form.estimated_value}
                    onChange={(e) => setForm({ ...form, estimated_value: Number(e.target.value) })}
                    style={{ height: "40px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px", display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Currency
                  </label>
                  <select
                    className="input"
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    style={{ height: "40px" }}
                  >
                    {["INR", "USD", "EUR", "GBP"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stage + Probability */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px", display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Pipeline Stage
                  </label>
                  <select
                    className="input"
                    value={form.pipeline_stage}
                    onChange={(e) => setForm({ ...form, pipeline_stage: e.target.value, win_probability: stageProbability[e.target.value] || form.win_probability })}
                    style={{ height: "40px" }}
                  >
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px", display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Expected Close Date
                  </label>
                  <input
                    className="input"
                    type="date"
                    value={form.expected_close_date}
                    onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })}
                    style={{ height: "40px" }}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px", display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Notes
                </label>
                <textarea
                  className="input"
                  placeholder="Deal notes..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
              <button className="btn" onClick={() => setNewDealModal(false)} style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddDeal}
                disabled={submitting}
                style={{ opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? "Creating..." : "Create Deal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Deal Detail Drawer ── */}
      {dealDrawer && selectedDeal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)", zIndex: 200,
            display: "flex", justifyContent: "flex-end",
          }}
          onClick={() => setDealDrawer(false)}
        >
          <div
            style={{
              width: "520px", height: "100%", background: "var(--bg-surface)",
              borderLeft: "1px solid var(--border-default)",
              overflow: "auto", animation: "slideInRight 0.3s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: "24px 28px",
              borderBottom: "1px solid var(--border-subtle)",
              background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(99,102,241,0.03))",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
                    {selectedDeal.title}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "4px",
                      padding: "3px 10px", borderRadius: "16px", fontSize: "0.72rem", fontWeight: 700,
                      background: `${STAGE_COLORS[selectedDeal.pipeline_stage] || "#6366f1"}15`,
                      color: STAGE_COLORS[selectedDeal.pipeline_stage] || "#6366f1",
                      border: `1px solid ${STAGE_COLORS[selectedDeal.pipeline_stage] || "#6366f1"}30`,
                    }}>
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: STAGE_COLORS[selectedDeal.pipeline_stage] || "#6366f1" }} />
                      {selectedDeal.pipeline_stage}
                    </span>
                    <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      {formatCurrencyINR(selectedDeal.estimated_value)}
                    </span>
                  </div>
                </div>
                <button onClick={() => setDealDrawer(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div style={{ padding: "24px 28px" }}>
              {/* Info grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "28px" }}>
                {[
                  { label: "Company", value: selectedDeal.company_name || "—", icon: Building2, color: "#f59e0b" },
                  { label: "Contact", value: selectedDeal.primary_contact_name || "—", icon: UserCheck, color: "#6366f1" },
                  { label: "Service", value: selectedDeal.service_name || "—", icon: Briefcase, color: "#8b5cf6" },
                  { label: "Probability", value: `${selectedDeal.win_probability}%`, icon: TrendingUp, color: "#10b981" },
                  { label: "Currency", value: selectedDeal.currency, icon: DollarSign, color: "#06b6d4" },
                  { label: "Close Date", value: selectedDeal.expected_close_date ? new Date(selectedDeal.expected_close_date).toLocaleDateString("en-IN") : "—", icon: Calendar, color: "#ef4444" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: `${item.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <item.icon size={14} color={item.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase" }}>{item.label}</div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 600 }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Probability bar */}
              <div style={{ marginBottom: "28px" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                  Win Probability
                </div>
                <div style={{ height: "8px", borderRadius: "4px", background: "var(--bg-elevated)" }}>
                  <div style={{
                    height: "100%", borderRadius: "4px", transition: "width 0.5s",
                    width: `${selectedDeal.win_probability}%`,
                    background: selectedDeal.win_probability >= 75 ? "linear-gradient(90deg, #10b981, #059669)" : selectedDeal.win_probability >= 50 ? "linear-gradient(90deg, #f59e0b, #f97316)" : "linear-gradient(90deg, #6366f1, #8b5cf6)",
                  }} />
                </div>
              </div>

              {/* Stage Update */}
              {!["CLOSED WON", "CLOSED LOST"].includes(selectedDeal.pipeline_stage) && (
                <div style={{ marginBottom: "28px" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                    Update Stage
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {PIPELINE_STAGES.filter((s) => s !== selectedDeal.pipeline_stage).map((stage) => (
                      <button
                        key={stage}
                        onClick={() => handleStageUpdate(selectedDeal.id, stage)}
                        style={{
                          padding: "4px 10px", borderRadius: "14px",
                          fontSize: "0.7rem", fontWeight: 600, cursor: "pointer",
                          background: `${STAGE_COLORS[stage] || "#6366f1"}10`,
                          color: STAGE_COLORS[stage] || "#6366f1",
                          border: `1px solid ${STAGE_COLORS[stage] || "#6366f1"}25`,
                          transition: "all 0.15s",
                        }}
                      >
                        {stage}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Convert to Project (if CLOSED WON) */}
              {selectedDeal.pipeline_stage === "CLOSED WON" && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleConvertToProject(selectedDeal.id)}
                  style={{ width: "100%", marginBottom: "28px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  <CheckCircle2 size={16} />
                  Convert to Project & Contract
                </button>
              )}

              {/* Activity Log */}
              <div style={{ marginBottom: "28px" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                  Log Activity
                </div>
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  {(["call", "email", "meeting", "note", "task"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setActivityForm({ ...activityForm, activity_type: t })}
                      style={{
                        padding: "4px 10px", borderRadius: "14px",
                        fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
                        background: activityForm.activity_type === t ? "#6366f1" : "var(--bg-elevated)",
                        color: activityForm.activity_type === t ? "white" : "var(--text-secondary)",
                        border: activityForm.activity_type === t ? "1px solid #6366f1" : "1px solid var(--border-default)",
                        textTransform: "capitalize",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <input
                  className="input"
                  placeholder="Subject..."
                  value={activityForm.subject}
                  onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })}
                  style={{ height: "36px", fontSize: "0.85rem", marginBottom: "6px" }}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    className="input"
                    placeholder="Notes (optional)"
                    value={activityForm.notes}
                    onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })}
                    style={{ height: "36px", fontSize: "0.85rem", flex: 1 }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleLogActivity}
                    disabled={!activityForm.subject}
                    style={{ padding: "0 16px", fontSize: "0.8rem" }}
                  >
                    Log
                  </button>
                </div>
              </div>

              {/* Activities timeline */}
              {dealActivities.length > 0 && (
                <div style={{ marginBottom: "28px" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                    Activity Timeline
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {dealActivities.slice(0, 8).map((a) => (
                      <div key={a.id} style={{
                        display: "flex", gap: "10px", padding: "10px 14px",
                        borderRadius: "10px", background: "var(--bg-elevated)",
                        border: "1px solid var(--border-subtle)",
                      }}>
                        <ActivityIcon size={14} color="#6366f1" style={{ marginTop: "2px", flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: 600 }}>
                            [{a.activity_type}] {a.subject}
                          </div>
                          {a.notes && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>{a.notes}</div>}
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "3px" }}>
                            {new Date(a.created_at).toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedDeal.notes && (
                <div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                    Notes
                  </div>
                  <div style={{
                    padding: "14px 16px", borderRadius: "10px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6,
                  }}>
                    {selectedDeal.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
