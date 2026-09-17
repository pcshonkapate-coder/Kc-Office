"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Building2,
  TrendingUp,
  DollarSign,
  Calendar,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  History,
  FileText,
  Activity as ActivityIcon,
  Phone,
  Mail,
  Users,
  Settings as SettingsIcon,
  X,
  Layers,
} from "lucide-react";
import {
  crmApi,
  Deal,
  Service,
  Company,
  Contact,
  CRMDashboardMetrics,
  PIPELINE_STAGES,
  STAGE_COLORS,
  formatCurrencyINR,
} from "@/lib/crm-api";

export default function CRMPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [metrics, setMetrics] = useState<CRMDashboardMetrics | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  // View & Filter states
  const [view, setView] = useState<"pipeline" | "list">("pipeline");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [minValFilter, setMinValFilter] = useState<number | "">("");

  // Modals & Drawers
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [dealDetailDrawer, setDealDetailDrawer] = useState(false);
  const [newDealModal, setNewDealModal] = useState(false);
  const [servicesModal, setServicesModal] = useState(false);
  const [perfModal, setPerfModal] = useState(false);

  // Drag and Drop state
  const [draggingDealId, setDraggingDealId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Form states for New Deal
  const [newDealForm, setNewDealForm] = useState({
    title: "",
    company_id: "",
    primary_contact_id: "",
    service_id: "",
    estimated_value: 1000000,
    currency: "INR",
    pipeline_stage: "NEW LEAD",
    win_probability: 20,
    expected_close_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    notes: "",
  });

  // Form state for New Service
  const [newServiceForm, setNewServiceForm] = useState({
    name: "",
    category: "Engineering",
    description: "",
  });

  // New Activity Form inside Deal Drawer
  const [activityForm, setActivityForm] = useState<{
    activity_type: "call" | "email" | "meeting" | "note" | "follow_up" | "task";
    subject: string;
    notes: string;
  }>({
    activity_type: "call",
    subject: "",
    notes: "",
  });

  // Notification feedback
  const [banner, setBanner] = useState<string | null>(null);

  const showBanner = (msg: string) => {
    setBanner(msg);
    setTimeout(() => setBanner(null), 4500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [dealsData, metricsData, servicesData, companiesData, contactsData] =
        await Promise.all([
          crmApi.getDeals(),
          crmApi.getDashboardMetrics(),
          crmApi.getServices(),
          crmApi.getCompanies(),
          crmApi.getContacts(),
        ]);
      setDeals(dealsData);
      setMetrics(metricsData);
      setServices(servicesData);
      setCompanies(companiesData);
      setContacts(contactsData);
    } catch (err) {
      console.error("Failed loading CRM data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered deals
  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      const matchSearch =
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        (d.company_name && d.company_name.toLowerCase().includes(search.toLowerCase())) ||
        (d.primary_contact_name && d.primary_contact_name.toLowerCase().includes(search.toLowerCase()));

      const matchStage = stageFilter === "ALL" || d.pipeline_stage === stageFilter;
      const matchService = serviceFilter === "ALL" || d.service_name === serviceFilter;
      const matchCompany = companyFilter === "ALL" || d.company_id === companyFilter;
      const matchMinVal = minValFilter === "" || d.estimated_value >= Number(minValFilter);

      return matchSearch && matchStage && matchService && matchCompany && matchMinVal;
    });
  }, [deals, search, stageFilter, serviceFilter, companyFilter, minValFilter]);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData("text/plain", dealId);
    setDraggingDealId(dealId);
  };

  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    setDragOverStage(null);
    const dealId = e.dataTransfer.getData("text/plain") || draggingDealId;
    if (!dealId) return;

    const currentDeal = deals.find((d) => d.id === dealId);
    if (!currentDeal || currentDeal.pipeline_stage === targetStage) return;

    // Optimistic UI update
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? {
              ...d,
              pipeline_stage: targetStage,
              win_probability:
                targetStage === "CLOSED WON" ? 100 : targetStage === "CLOSED LOST" ? 0 : d.win_probability,
            }
          : d
      )
    );

    try {
      await crmApi.updateDealStage(
        dealId,
        targetStage,
        `Stage dragged from ${currentDeal.pipeline_stage} to ${targetStage}`
      );
      showBanner(`Moved "${currentDeal.title}" to ${targetStage}`);
      // Refresh metrics
      const newMetrics = await crmApi.getDashboardMetrics();
      setMetrics(newMetrics);
    } catch (err) {
      console.error(err);
      loadData(); // Revert on failure
    } finally {
      setDraggingDealId(null);
    }
  };

  // Inspect deal in drawer
  const handleOpenDeal = async (deal: Deal) => {
    setSelectedDeal(deal);
    setDealDetailDrawer(true);
    try {
      const fullDeal = await crmApi.getDealDetails(deal.id);
      setSelectedDeal(fullDeal);
    } catch {}
  };

  // Create Deal handler
  const handleCreateDealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealForm.title || !newDealForm.company_id) {
      alert("Please provide Deal Title and select a Company");
      return;
    }
    try {
      const created = await crmApi.createDeal(newDealForm);
      showBanner(`Deal "${created.title}" successfully added!`);
      setNewDealModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed creating deal");
    }
  };

  // Create Service handler
  const handleCreateServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceForm.name) return;
    try {
      const created = await crmApi.createService(newServiceForm);
      showBanner(`New service "${created.name}" configured!`);
      setNewServiceForm({ name: "", category: "Engineering", description: "" });
      const updatedServices = await crmApi.getServices();
      setServices(updatedServices);
    } catch (err: any) {
      alert(err.message || "Failed configuring service");
    }
  };

  // Bridge Won deal to Project & Contract
  const handleBridgeToProject = async (dealId: string) => {
    if (!confirm("Confirm creating active Delivery Project and signed Contract from this won deal?")) return;
    try {
      const res = await crmApi.convertDealToProject(dealId);
      showBanner(res.message || "Successfully initiated Project & Contract!");
      if (selectedDeal) {
        handleOpenDeal(selectedDeal);
      }
    } catch (err: any) {
      alert(err.message || "Failed bridging deal to project");
    }
  };

  // Add Activity to Deal
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal || !activityForm.subject) return;
    try {
      await crmApi.createActivity({
        entity_type: "deal",
        entity_id: selectedDeal.id,
        activity_type: activityForm.activity_type,
        subject: activityForm.subject,
        notes: activityForm.notes || "Activity logged via CRM deal drawer",
        status: "completed",
      });
      showBanner(`Activity logged: ${activityForm.subject}`);
      setActivityForm({ activity_type: "call", subject: "", notes: "" });
      handleOpenDeal(selectedDeal);
    } catch (err: any) {
      alert(err.message || "Failed logging activity");
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "40px" }}>
      {/* Toast Banner */}
      {banner && (
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
          <span>{banner}</span>
        </div>
      )}

      {/* Header */}
      <div className="page-header" style={{ marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Sales Pipeline
            </h1>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "3px 10px",
                borderRadius: "12px",
                background: "rgba(99, 102, 241, 0.15)",
                color: "var(--brand-primary)",
                fontWeight: 600,
              }}
            >
              10 Pipeline Stages
            </span>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "4px" }}>
            Real-time Lead-to-Contract lifecycle · Total Pipeline:{" "}
            <strong style={{ color: "var(--brand-primary)" }}>
              {formatCurrencyINR(metrics?.pipeline_value || 0)}
            </strong>
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* Performance Leaderboard */}
          <button
            className="btn btn-secondary"
            id="crm-perf-btn"
            onClick={() => setPerfModal(true)}
            title="Salesperson Performance Leaderboard"
          >
            <Users size={14} />
            Performance
          </button>

          {/* Configurable Services */}
          <button
            className="btn btn-secondary"
            id="crm-services-btn"
            onClick={() => setServicesModal(true)}
            title="Configure Consultancy Services"
          >
            <SettingsIcon size={14} />
            Services ({services.length})
          </button>

          {/* View Toggle */}
          <div
            style={{
              display: "flex",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            {(["pipeline", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: "8px 14px",
                  background: view === v ? "var(--brand-primary)" : "none",
                  border: "none",
                  cursor: "pointer",
                  color: view === v ? "white" : "var(--text-muted)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  textTransform: "capitalize",
                }}
                id={`view-${v}`}
              >
                {v === "pipeline" ? "Kanban" : "Table"}
              </button>
            ))}
          </div>

          {/* Add Deal Button */}
          <button
            className="btn btn-primary"
            id="add-deal-btn"
            onClick={() => setNewDealModal(true)}
          >
            <Plus size={15} />
            New Deal
          </button>
        </div>
      </div>

      {/* Real-time KPI Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {[
          {
            label: "Total Pipeline Value",
            value: formatCurrencyINR(metrics?.pipeline_value || 0),
            icon: <DollarSign size={16} />,
            color: "#6366f1",
          },
          {
            label: "Won Revenue",
            value: formatCurrencyINR(metrics?.won_revenue || 0),
            icon: <TrendingUp size={16} />,
            color: "#10b981",
          },
          {
            label: "Open Deals",
            value: String(metrics?.open_deals || 0),
            icon: <Briefcase size={16} />,
            color: "#8b5cf6",
          },
          {
            label: "Conversion Rate",
            value: `${metrics?.conversion_rate || 0}%`,
            icon: <ShieldCheck size={16} />,
            color: "#06b6d4",
          },
          {
            label: "Avg. Deal Size",
            value: formatCurrencyINR(metrics?.average_deal_value || 0),
            icon: <ArrowRight size={16} />,
            color: "#f59e0b",
          },
          {
            label: "Active Inbound Leads",
            value: String((metrics?.new_leads || 0) + (metrics?.qualified_leads || 0)),
            icon: <Clock size={16} />,
            color: "#ec4899",
          },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: "14px 16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500 }}>
                {s.label}
              </span>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div
              style={{
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Multi-Dimensional Filter Bar */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
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
            placeholder="Search deals, company, contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "34px", height: "36px", fontSize: "0.82rem" }}
            id="crm-search"
          />
        </div>

        {/* Company Filter */}
        <select
          className="input"
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          style={{ width: "170px", height: "36px", fontSize: "0.8rem" }}
          id="crm-filter-company"
        >
          <option value="ALL">All Companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Service Filter */}
        <select
          className="input"
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          style={{ width: "180px", height: "36px", fontSize: "0.8rem" }}
          id="crm-filter-service"
        >
          <option value="ALL">All Services</option>
          {services.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Stage Filter */}
        <select
          className="input"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          style={{ width: "180px", height: "36px", fontSize: "0.8rem" }}
          id="crm-filter-stage"
        >
          <option value="ALL">All Stages (10)</option>
          {PIPELINE_STAGES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>

        {/* Min Value Filter */}
        <input
          className="input"
          type="number"
          placeholder="Min ₹ Value"
          value={minValFilter}
          onChange={(e) => setMinValFilter(e.target.value ? Number(e.target.value) : "")}
          style={{ width: "130px", height: "36px", fontSize: "0.8rem" }}
        />

        {(search || stageFilter !== "ALL" || serviceFilter !== "ALL" || companyFilter !== "ALL" || minValFilter !== "") && (
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSearch("");
              setStageFilter("ALL");
              setServiceFilter("ALL");
              setCompanyFilter("ALL");
              setMinValFilter("");
            }}
            style={{ height: "36px", fontSize: "0.75rem", padding: "0 12px" }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Main View: Kanban Pipeline vs Table */}
      {view === "pipeline" ? (
        /* Visual Kanban Pipeline across all 10 stages */
        <div
          style={{
            display: "flex",
            gap: "12px",
            overflowX: "auto",
            paddingBottom: "20px",
            alignItems: "flex-start",
          }}
        >
          {PIPELINE_STAGES.map((stage) => {
            const stageDeals = filteredDeals.filter((d) => d.pipeline_stage === stage);
            const stageTotal = stageDeals.reduce((a, b) => a + Number(b.estimated_value), 0);
            const color = STAGE_COLORS[stage] || "#6366f1";
            const isDragOver = dragOverStage === stage;

            return (
              <div
                key={stage}
                className="pipeline-stage"
                onDragOver={(e) => handleDragOver(e, stage)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage)}
                style={{
                  flex: "0 0 270px",
                  borderRadius: "10px",
                  background: isDragOver ? "rgba(99, 102, 241, 0.08)" : "var(--bg-surface)",
                  border: isDragOver ? `2px dashed ${color}` : "1px solid var(--border-subtle)",
                  transition: "all 0.15s ease",
                  minHeight: "450px",
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid var(--border-subtle)",
                    borderTop: `3px solid ${color}`,
                    borderRadius: "10px 10px 0 0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          letterSpacing: "0.03em",
                        }}
                      >
                        {stage}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        color: color,
                        background: `${color}18`,
                        padding: "2px 7px",
                        borderRadius: "10px",
                      }}
                    >
                      {stageDeals.length}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>
                    {formatCurrencyINR(stageTotal)}
                  </div>
                </div>

                {/* Cards Container */}
                <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {stageDeals.length === 0 ? (
                    <div
                      style={{
                        padding: "24px 10px",
                        textAlign: "center",
                        color: "var(--text-muted)",
                        fontSize: "0.75rem",
                        border: "1px dashed var(--border-subtle)",
                        borderRadius: "8px",
                      }}
                    >
                      Drop deals here
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        onClick={() => handleOpenDeal(deal)}
                        className="pipeline-card"
                        style={{
                          cursor: "grab",
                          padding: "12px",
                          borderRadius: "8px",
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border-subtle)",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.08)",
                          transition: "transform 0.15s, border-color 0.15s",
                        }}
                      >
                        {/* Company & More */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "6px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              fontSize: "0.72rem",
                              color: "var(--brand-primary)",
                              fontWeight: 600,
                            }}
                          >
                            <Building2 size={12} />
                            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "160px" }}>
                              {deal.company_name || "Enterprise"}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDeal(deal);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--text-muted)",
                              padding: "2px",
                            }}
                          >
                            <MoreHorizontal size={14} />
                          </button>
                        </div>

                        {/* Deal Title */}
                        <div
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            lineHeight: 1.3,
                            marginBottom: "8px",
                          }}
                        >
                          {deal.title}
                        </div>

                        {/* Service pill */}
                        {deal.service_name && (
                          <div style={{ marginBottom: "8px" }}>
                            <span
                              style={{
                                fontSize: "0.68rem",
                                background: "var(--bg-hover)",
                                color: "var(--text-secondary)",
                                padding: "2px 7px",
                                borderRadius: "4px",
                                border: "1px solid var(--border-subtle)",
                              }}
                            >
                              {deal.service_name}
                            </span>
                          </div>
                        )}

                        {/* Value & Probability */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "6px",
                          }}
                        >
                          <span style={{ fontSize: "0.875rem", fontWeight: 700, color: color }}>
                            {formatCurrencyINR(deal.estimated_value)}
                          </span>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--text-muted)",
                              background: "var(--bg-hover)",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {deal.win_probability}% win
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="progress-bar" style={{ height: "4px", marginBottom: "8px" }}>
                          <div
                            className="progress-fill"
                            style={{ width: `${deal.win_probability}%`, background: color }}
                          />
                        </div>

                        {/* Footer: Owner & Close Date */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "0.7rem",
                            color: "var(--text-muted)",
                            borderTop: "1px solid var(--border-subtle)",
                            paddingTop: "6px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <div
                              className="avatar"
                              style={{ width: "20px", height: "20px", fontSize: "0.6rem" }}
                            >
                              {deal.owner_name
                                ? deal.owner_name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                : "SA"}
                            </div>
                            <span style={{ maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {deal.owner_name || "Admin"}
                            </span>
                          </div>
                          {deal.expected_close_date && (
                            <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                              <Calendar size={10} />
                              <span>{deal.expected_close_date.slice(5)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Quick Add Button in column */}
                  {stage !== "CLOSED WON" && stage !== "CLOSED LOST" && (
                    <button
                      onClick={() => {
                        setNewDealForm((prev) => ({ ...prev, pipeline_stage: stage }));
                        setNewDealModal(true);
                      }}
                      style={{
                        padding: "6px",
                        background: "none",
                        border: "1px dashed var(--border-subtle)",
                        borderRadius: "6px",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                        fontSize: "0.75rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        marginTop: "4px",
                      }}
                    >
                      <Plus size={12} /> Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Deal Title</th>
                <th>Company</th>
                <th>Primary Contact</th>
                <th>Service</th>
                <th>Estimated Value</th>
                <th>Stage</th>
                <th>Probability</th>
                <th>Expected Close</th>
                <th>Owner</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredDeals.map((deal) => {
                const color = STAGE_COLORS[deal.pipeline_stage] || "#6366f1";
                return (
                  <tr
                    key={deal.id}
                    onClick={() => handleOpenDeal(deal)}
                    style={{ cursor: "pointer" }}
                  >
                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{deal.title}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Building2 size={13} color="var(--text-muted)" />
                        {deal.company_name}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        {deal.primary_contact_name || "—"}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gray">{deal.service_name || "Consulting"}</span>
                    </td>
                    <td style={{ fontWeight: 700, color }}>
                      {formatCurrencyINR(deal.estimated_value)}
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color,
                          background: `${color}15`,
                          border: `1px solid ${color}35`,
                          padding: "2px 8px",
                          borderRadius: "14px",
                        }}
                      >
                        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: color }} />
                        {deal.pipeline_stage}
                      </span>
                    </td>
                    <td>{deal.win_probability}%</td>
                    <td style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {deal.expected_close_date || "—"}
                    </td>
                    <td>{deal.owner_name || "Admin"}</td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDeal(deal);
                        }}
                        style={{
                          background: "none",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "6px",
                          cursor: "pointer",
                          padding: "4px 8px",
                          color: "var(--text-muted)",
                          fontSize: "0.75rem",
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================== DEAL DETAIL DRAWER ==================== */}
      {dealDetailDrawer && selectedDeal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            width: "520px",
            maxWidth: "100vw",
            background: "var(--bg-elevated)",
            borderLeft: "1px solid var(--border-default)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            boxShadow: "-10px 0 30px rgba(0,0,0,0.5)",
          }}
        >
          {/* Drawer Header */}
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {selectedDeal.title}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Company: {selectedDeal.company_name}
              </div>
            </div>
            <button
              onClick={() => setDealDetailDrawer(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
            {/* Quick Actions */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "20px",
                flexWrap: "wrap",
              }}
            >
              {selectedDeal.pipeline_stage === "CLOSED WON" ? (
                <button
                  className="btn btn-primary"
                  onClick={() => handleBridgeToProject(selectedDeal.id)}
                  style={{ flex: 1, justifyContent: "center", background: "#10b981", borderColor: "#10b981" }}
                >
                  <Briefcase size={14} /> Bridge to Delivery Project
                </button>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={async () => {
                    await crmApi.updateDealStage(selectedDeal.id, "CLOSED WON");
                    showBanner("Marked deal as CLOSED WON!");
                    handleOpenDeal({ ...selectedDeal, pipeline_stage: "CLOSED WON" });
                    loadData();
                  }}
                  style={{ flex: 1, justifyContent: "center", color: "#10b981" }}
                >
                  <CheckCircle2 size={14} /> Mark Won
                </button>
              )}
              {selectedDeal.pipeline_stage !== "CLOSED LOST" && (
                <button
                  className="btn btn-secondary"
                  onClick={async () => {
                    await crmApi.updateDealStage(selectedDeal.id, "CLOSED LOST", "Marked lost by user");
                    showBanner("Marked deal as CLOSED LOST");
                    handleOpenDeal({ ...selectedDeal, pipeline_stage: "CLOSED LOST" });
                    loadData();
                  }}
                  style={{ color: "#ef4444" }}
                >
                  <XCircle size={14} /> Mark Lost
                </button>
              )}
            </div>

            {/* Stage Selector */}
            <div className="card" style={{ padding: "16px", marginBottom: "20px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Current Pipeline Stage
              </label>
              <select
                className="input"
                value={selectedDeal.pipeline_stage}
                onChange={async (e) => {
                  const newStg = e.target.value;
                  await crmApi.updateDealStage(selectedDeal.id, newStg);
                  showBanner(`Stage updated to ${newStg}`);
                  handleOpenDeal({ ...selectedDeal, pipeline_stage: newStg });
                  loadData();
                }}
                style={{ marginTop: "8px", fontWeight: 600, color: STAGE_COLORS[selectedDeal.pipeline_stage] }}
              >
                {PIPELINE_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Deal Snapshot Details */}
            <div className="card" style={{ padding: "16px", marginBottom: "20px" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "12px", color: "var(--text-primary)" }}>
                Engagement Parameters
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.8rem" }}>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Deal Value:</span>
                  <div style={{ fontWeight: 700, fontSize: "1rem", color: STAGE_COLORS[selectedDeal.pipeline_stage] }}>
                    {formatCurrencyINR(selectedDeal.estimated_value)}
                  </div>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Win Probability:</span>
                  <div style={{ fontWeight: 700 }}>{selectedDeal.win_probability}%</div>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Service:</span>
                  <div style={{ fontWeight: 600 }}>{selectedDeal.service_name || "AI Consulting"}</div>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Primary Contact:</span>
                  <div style={{ fontWeight: 600 }}>{selectedDeal.primary_contact_name || "—"}</div>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Owner:</span>
                  <div style={{ fontWeight: 600 }}>{selectedDeal.owner_name || "Admin"}</div>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Expected Close:</span>
                  <div style={{ fontWeight: 600 }}>{selectedDeal.expected_close_date || "—"}</div>
                </div>
              </div>
            </div>

            {/* Stage Change History Timeline */}
            <div className="card" style={{ padding: "16px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: 700, marginBottom: "12px" }}>
                <History size={15} color="var(--brand-primary)" />
                Stage-Change Audit History
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {selectedDeal.stage_history && selectedDeal.stage_history.length > 0 ? (
                  selectedDeal.stage_history.map((h, i) => (
                    <div
                      key={h.id || i}
                      style={{
                        paddingLeft: "14px",
                        borderLeft: `2px solid ${STAGE_COLORS[h.to_stage] || "var(--border-subtle)"}`,
                        fontSize: "0.8rem",
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {h.from_stage ? `${h.from_stage} ➔ ` : "Initiated at "}
                        <span style={{ color: STAGE_COLORS[h.to_stage] }}>{h.to_stage}</span>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        {h.notes} · by {h.changed_by_name || "Admin"} · {new Date(h.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Initial entry recorded.
                  </div>
                )}
              </div>
            </div>

            {/* Multi-Channel Activity Logger */}
            <div className="card" style={{ padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: 700, marginBottom: "12px" }}>
                <ActivityIcon size={15} color="#10b981" />
                Log Activity
              </div>
              <form onSubmit={handleAddActivity}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                  {(["call", "email", "meeting", "note", "task"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setActivityForm((prev) => ({ ...prev, activity_type: t }))}
                      style={{
                        flex: 1,
                        padding: "6px 0",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        textTransform: "capitalize",
                        borderRadius: "6px",
                        border: "1px solid",
                        cursor: "pointer",
                        background: activityForm.activity_type === t ? "var(--brand-primary)" : "var(--bg-hover)",
                        color: activityForm.activity_type === t ? "white" : "var(--text-muted)",
                        borderColor: activityForm.activity_type === t ? "var(--brand-primary)" : "var(--border-subtle)",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <input
                  className="input"
                  placeholder="Subject / summary..."
                  value={activityForm.subject}
                  onChange={(e) => setActivityForm((prev) => ({ ...prev, subject: e.target.value }))}
                  required
                  style={{ marginBottom: "8px", fontSize: "0.8rem" }}
                />
                <textarea
                  className="input"
                  placeholder="Discussion details or next steps..."
                  value={activityForm.notes}
                  onChange={(e) => setActivityForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  style={{ marginBottom: "10px", fontSize: "0.8rem" }}
                />
                <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                  Save Activity
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ==================== NEW DEAL MODAL ==================== */}
      {newDealModal && (
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
              maxWidth: "520px",
              padding: "24px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Create Pipeline Deal
              </h2>
              <button onClick={() => setNewDealModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDealSubmit}>
              {/* Deal Title */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Deal Name / Title *
                </label>
                <input
                  className="input"
                  placeholder="e.g. Enterprise AI Diagnostics Integration"
                  value={newDealForm.title}
                  onChange={(e) => setNewDealForm({ ...newDealForm, title: e.target.value })}
                  required
                />
              </div>

              {/* Company Selection */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Company Organization *
                </label>
                <select
                  className="input"
                  value={newDealForm.company_id}
                  onChange={(e) => setNewDealForm({ ...newDealForm, company_id: e.target.value })}
                  required
                >
                  <option value="">Select Company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Primary Contact */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Primary Contact
                </label>
                <select
                  className="input"
                  value={newDealForm.primary_contact_id}
                  onChange={(e) => setNewDealForm({ ...newDealForm, primary_contact_id: e.target.value })}
                >
                  <option value="">Select Contact</option>
                  {contacts
                    .filter((ct) => !newDealForm.company_id || ct.company_id === newDealForm.company_id)
                    .map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.name} ({ct.role_in_buying_process || ct.job_title || "Contact"})
                      </option>
                    ))}
                </select>
              </div>

              {/* Service Selection */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Service Focus
                </label>
                <select
                  className="input"
                  value={newDealForm.service_id}
                  onChange={(e) => setNewDealForm({ ...newDealForm, service_id: e.target.value })}
                >
                  <option value="">Select Service</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Estimated Value & Currency */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Estimated Value
                  </label>
                  <input
                    className="input"
                    type="number"
                    value={newDealForm.estimated_value}
                    onChange={(e) => setNewDealForm({ ...newDealForm, estimated_value: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Currency
                  </label>
                  <select
                    className="input"
                    value={newDealForm.currency}
                    onChange={(e) => setNewDealForm({ ...newDealForm, currency: e.target.value })}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              {/* Stage & Probability */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Pipeline Stage
                  </label>
                  <select
                    className="input"
                    value={newDealForm.pipeline_stage}
                    onChange={(e) => setNewDealForm({ ...newDealForm, pipeline_stage: e.target.value })}
                  >
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Win Prob. %
                  </label>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    max={100}
                    value={newDealForm.win_probability}
                    onChange={(e) => setNewDealForm({ ...newDealForm, win_probability: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Close date */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Expected Close Date
                </label>
                <input
                  className="input"
                  type="date"
                  value={newDealForm.expected_close_date}
                  onChange={(e) => setNewDealForm({ ...newDealForm, expected_close_date: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setNewDealModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Opportunity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CONFIGURABLE SERVICES MODAL (ADMIN) ==================== */}
      {servicesModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
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
              maxWidth: "680px",
              padding: "24px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Configurable Consultancy Services
                </h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Admin catalog of Kapate Consultancy practices
                </p>
              </div>
              <button onClick={() => setServicesModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>

            {/* Add Service Section */}
            <form onSubmit={handleCreateServiceSubmit} style={{ marginBottom: "24px", padding: "14px", background: "var(--bg-hover)", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "8px", color: "var(--text-primary)" }}>
                Add New Practice / Service
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px", marginBottom: "8px" }}>
                <input
                  className="input"
                  placeholder="Service Name (e.g. AI Consulting)"
                  value={newServiceForm.name}
                  onChange={(e) => setNewServiceForm({ ...newServiceForm, name: e.target.value })}
                  required
                />
                <select
                  className="input"
                  value={newServiceForm.category}
                  onChange={(e) => setNewServiceForm({ ...newServiceForm, category: e.target.value })}
                >
                  <option value="AI & Data">AI & Data</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Advisory">Advisory</option>
                  <option value="Cloud & DevOps">Cloud & DevOps</option>
                </select>
              </div>
              <input
                className="input"
                placeholder="Brief practice description..."
                value={newServiceForm.description}
                onChange={(e) => setNewServiceForm({ ...newServiceForm, description: e.target.value })}
                style={{ marginBottom: "8px" }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
                <Plus size={14} /> Add Service
              </button>
            </form>

            {/* Existing Services List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {services.map((svc) => (
                <div
                  key={svc.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>
                      {svc.name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {svc.description || "Active practice area"}
                    </div>
                  </div>
                  <span className="badge badge-primary">{svc.category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== SALESPERSON PERFORMANCE MODAL ==================== */}
      {perfModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
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
              maxWidth: "680px",
              padding: "24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Salesperson Performance Leaderboard
              </h2>
              <button onClick={() => setPerfModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Salesperson</th>
                    <th>Deals Managed</th>
                    <th>Deals Won</th>
                    <th>Pipeline Managed</th>
                    <th>Won Revenue</th>
                    <th>Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics?.salesperson_performance && metrics.salesperson_performance.length > 0 ? (
                    metrics.salesperson_performance.map((sp) => (
                      <tr key={sp.user_id}>
                        <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{sp.full_name}</td>
                        <td>{sp.deals_count}</td>
                        <td style={{ color: "#10b981", fontWeight: 600 }}>{sp.won_deals_count}</td>
                        <td>{formatCurrencyINR(sp.pipeline_value)}</td>
                        <td style={{ color: "#10b981", fontWeight: 700 }}>{formatCurrencyINR(sp.won_revenue)}</td>
                        <td>
                          <span className="badge badge-success">{sp.win_rate}%</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                        No individual salesperson records yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
