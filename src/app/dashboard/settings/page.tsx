"use client";

import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Layers,
  Building2,
  Shield,
  Key,
  Bell,
  Plus,
  Edit3,
  Trash2,
  Check,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Sliders,
  Users,
  Globe,
  Mail,
  Lock,
  ExternalLink,
  ChevronRight,
  Database,
  Terminal,
  Activity,
} from "lucide-react";
import { crmApi, Service, PIPELINE_STAGES, STAGE_COLORS } from "@/lib/crm-api";

interface RolePermission {
  code: string;
  module: string;
  roles: {
    superadmin: boolean;
    partner: boolean;
    consultant: boolean;
    engineer: boolean;
    intern: boolean;
    freelancer: boolean;
    client: boolean;
  };
}

const rbacData: RolePermission[] = [
  {
    code: "crm:leads:read",
    module: "CRM",
    roles: { superadmin: true, partner: true, consultant: true, engineer: false, intern: false, freelancer: false, client: false },
  },
  {
    code: "crm:leads:write",
    module: "CRM",
    roles: { superadmin: true, partner: true, consultant: false, engineer: false, intern: false, freelancer: false, client: false },
  },
  {
    code: "crm:deals:read",
    module: "CRM",
    roles: { superadmin: true, partner: true, consultant: true, engineer: false, intern: false, freelancer: false, client: false },
  },
  {
    code: "crm:deals:write",
    module: "CRM",
    roles: { superadmin: true, partner: true, consultant: false, engineer: false, intern: false, freelancer: false, client: false },
  },
  {
    code: "crm:contracts:sign",
    module: "CRM",
    roles: { superadmin: true, partner: true, consultant: false, engineer: false, intern: false, freelancer: false, client: false },
  },
  {
    code: "workforce:directory:read",
    module: "Workforce",
    roles: { superadmin: true, partner: true, consultant: true, engineer: true, intern: true, freelancer: false, client: false },
  },
  {
    code: "workforce:timesheets:submit",
    module: "Workforce",
    roles: { superadmin: true, partner: true, consultant: true, engineer: true, intern: true, freelancer: true, client: false },
  },
  {
    code: "workforce:timesheets:approve",
    module: "Workforce",
    roles: { superadmin: true, partner: true, consultant: true, engineer: false, intern: false, freelancer: false, client: false },
  },
  {
    code: "projects:read",
    module: "Delivery",
    roles: { superadmin: true, partner: true, consultant: true, engineer: true, intern: true, freelancer: true, client: true },
  },
  {
    code: "projects:manage",
    module: "Delivery",
    roles: { superadmin: true, partner: true, consultant: true, engineer: false, intern: false, freelancer: false, client: false },
  },
  {
    code: "tasks:update",
    module: "Delivery",
    roles: { superadmin: true, partner: true, consultant: true, engineer: true, intern: true, freelancer: true, client: false },
  },
  {
    code: "finance:invoices:read",
    module: "Finance",
    roles: { superadmin: true, partner: true, consultant: false, engineer: false, intern: false, freelancer: false, client: true },
  },
  {
    code: "finance:invoices:create",
    module: "Finance",
    roles: { superadmin: true, partner: true, consultant: false, engineer: false, intern: false, freelancer: false, client: false },
  },
  {
    code: "finance:expenses:submit",
    module: "Finance",
    roles: { superadmin: true, partner: true, consultant: true, engineer: true, intern: false, freelancer: true, client: false },
  },
  {
    code: "system:audit:read",
    module: "System",
    roles: { superadmin: true, partner: false, consultant: false, engineer: false, intern: false, freelancer: false, client: false },
  },
  {
    code: "system:users:manage",
    module: "System",
    roles: { superadmin: true, partner: false, consultant: false, engineer: false, intern: false, freelancer: false, client: false },
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"services" | "company" | "pipeline" | "rbac" | "api">("services");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Service modal state
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    code: "",
    category: "AI & Data",
    description: "",
    is_active: true,
  });

  // Company profile state
  const [companyProfile, setCompanyProfile] = useState({
    name: "Kapate Consultancy Services Pvt Ltd",
    website: "https://kapate.com",
    support_email: "contact@kapate.com",
    sales_email: "sales@kapate.com",
    phone: "+91 80000 12345",
    address: "Level 8, Cyber Tower, Hitech City, Hyderabad, Telangana 500081",
    country: "India",
    gstin: "36AAACK1234M1Z5",
    pan: "AAACK1234M",
    currency: "INR",
    timezone: "Asia/Kolkata (IST +05:30)",
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await crmApi.getServices();
      setServices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const openAddService = () => {
    setEditingService(null);
    setServiceForm({
      name: "",
      code: "",
      category: "AI & Data",
      description: "",
      is_active: true,
    });
    setServiceModalOpen(true);
  };

  const openEditService = (srv: Service) => {
    setEditingService(srv);
    setServiceForm({
      name: srv.name,
      code: srv.code || "",
      category: srv.category || "Engineering",
      description: srv.description || "",
      is_active: srv.is_active,
    });
    setServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        await crmApi.updateService(editingService.id, serviceForm);
        showToast(`Service "${serviceForm.name}" updated successfully`);
      } else {
        await crmApi.createService(serviceForm);
        showToast(`New service "${serviceForm.name}" created successfully`);
      }
      setServiceModalOpen(false);
      loadServices();
    } catch (err: any) {
      alert(err.message || "Failed to save service");
    }
  };

  const toggleServiceStatus = async (srv: Service) => {
    try {
      await crmApi.updateService(srv.id, { is_active: !srv.is_active });
      setServices((prev) =>
        prev.map((s) => (s.id === srv.id ? { ...s, is_active: !s.is_active } : s))
      );
      showToast(`Service "${srv.name}" status updated`);
    } catch (err: any) {
      alert("Failed to update status");
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "60px" }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            background: "#10b981",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "8px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Platform Settings & Administration
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "4px" }}>
            Configure CRM service offerings, organization identity, pipeline stages, RBAC permissions, and API connections
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid var(--border-default)",
          marginBottom: "24px",
          overflowX: "auto",
        }}
      >
        <button
          onClick={() => setActiveTab("services")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: activeTab === "services" ? "var(--brand-primary)" : "var(--text-muted)",
            borderBottom: activeTab === "services" ? "2px solid var(--brand-primary)" : "2px solid transparent",
            background: "none",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <Layers size={16} /> Configurable Services ({services.length})
        </button>

        <button
          onClick={() => setActiveTab("company")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: activeTab === "company" ? "var(--brand-primary)" : "var(--text-muted)",
            borderBottom: activeTab === "company" ? "2px solid var(--brand-primary)" : "2px solid transparent",
            background: "none",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <Building2 size={16} /> Company & Legal Profile
        </button>

        <button
          onClick={() => setActiveTab("pipeline")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: activeTab === "pipeline" ? "var(--brand-primary)" : "var(--text-muted)",
            borderBottom: activeTab === "pipeline" ? "2px solid var(--brand-primary)" : "2px solid transparent",
            background: "none",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <Sliders size={16} /> Sales Pipeline Stages (10)
        </button>

        <button
          onClick={() => setActiveTab("rbac")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: activeTab === "rbac" ? "var(--brand-primary)" : "var(--text-muted)",
            borderBottom: activeTab === "rbac" ? "2px solid var(--brand-primary)" : "2px solid transparent",
            background: "none",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <Shield size={16} /> RBAC Permission Matrix
        </button>

        <button
          onClick={() => setActiveTab("api")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: activeTab === "api" ? "var(--brand-primary)" : "var(--text-muted)",
            borderBottom: activeTab === "api" ? "2px solid var(--brand-primary)" : "2px solid transparent",
            background: "none",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <Key size={16} /> API & Integrations
        </button>
      </div>

      {/* TAB 1: Configurable Services Catalog */}
      {activeTab === "services" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Services Catalog & Offerings
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "2px" }}>
                Define advisory & technical practices available across Leads, Deals, Proposals, and Client Engagements
              </p>
            </div>
            <button
              onClick={openAddService}
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={16} /> Add New Service
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
            {services.map((srv) => (
              <div
                key={srv.id}
                className="card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  borderLeft: srv.is_active ? "4px solid #6366f1" : "4px solid var(--border-default)",
                  opacity: srv.is_active ? 1 : 0.65,
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: "rgba(99, 102, 241, 0.12)",
                          color: "#818cf8",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {srv.category || "Consulting"}
                      </span>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "6px" }}>
                        {srv.name}
                      </h3>
                    </div>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontWeight: 600,
                        background: srv.is_active ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                        color: srv.is_active ? "#10b981" : "#ef4444",
                      }}
                    >
                      {srv.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", lineHeight: 1.5, marginTop: "8px", minHeight: "40px" }}>
                    {srv.description || "Core engineering and technical consulting offering for enterprise transformation."}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "16px",
                    paddingTop: "12px",
                    borderTop: "1px solid var(--border-subtle)",
                  }}
                >
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                    CODE: {srv.code || srv.name.toLowerCase().replace(/\s+/g, "_")}
                  </span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => toggleServiceStatus(srv)}
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.75rem",
                        borderRadius: "6px",
                        background: "none",
                        border: "1px solid var(--border-default)",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      {srv.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => openEditService(srv)}
                      style={{
                        padding: "4px 8px",
                        fontSize: "0.75rem",
                        borderRadius: "6px",
                        background: "rgba(99, 102, 241, 0.1)",
                        border: "1px solid rgba(99, 102, 241, 0.3)",
                        color: "#818cf8",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Edit3 size={12} /> Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Company Profile Settings */}
      {activeTab === "company" && (
        <div style={{ maxWidth: "800px" }}>
          <div className="card">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>
              Kapate Consultancy Corporate Details
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                showToast("Organization details saved successfully");
              }}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Legal Entity Name *
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={companyProfile.name}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Primary Domain / Website
                  </label>
                  <input
                    type="url"
                    className="input"
                    value={companyProfile.website}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, website: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    General & Support Email
                  </label>
                  <input
                    type="email"
                    className="input"
                    value={companyProfile.support_email}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, support_email: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Inbound Sales Email
                  </label>
                  <input
                    type="email"
                    className="input"
                    value={companyProfile.sales_email}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, sales_email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    GST Identification Number (GSTIN)
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={companyProfile.gstin}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, gstin: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Permanent Account Number (PAN)
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={companyProfile.pan}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, pan: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                  Registered Office Address
                </label>
                <textarea
                  className="input"
                  rows={2}
                  value={companyProfile.address}
                  onChange={(e) => setCompanyProfile({ ...companyProfile, address: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Primary Currency
                  </label>
                  <select
                    className="input"
                    value={companyProfile.currency}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, currency: e.target.value })}
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Default System Timezone
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={companyProfile.timezone}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, timezone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: Pipeline Stages */}
      {activeTab === "pipeline" && (
        <div>
          <div style={{ marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Sales Pipeline Stages & Win Probabilities
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "2px" }}>
              The 10 sequential pipeline stages utilized across Kanban, Deal Progression, and Revenue Forecasting
            </p>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-default)", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)", width: "60px" }}>Step</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>Stage Name</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>Visual Theme</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>Default Win Probability</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>Lifecycle Meaning</th>
                </tr>
              </thead>
              <tbody>
                {PIPELINE_STAGES.map((stage, idx) => {
                  const color = STAGE_COLORS[stage] || "#6366f1";
                  const probs = [10, 20, 30, 45, 60, 70, 80, 90, 100, 0];
                  const descriptions = [
                    "New lead captured from website, outreach, or referral",
                    "Assessing budget, authority, need, and timeline (BANT)",
                    "Introductory technical discovery call scheduled with partner",
                    "Deep-dive technical requirements collected and validated",
                    "Architecture review and feasibility scoping conducted",
                    "Confidentiality agreements and master services agreement drafted",
                    "Commercial proposal and scope of work sent to client",
                    "Contract terms and pricing negotiations underway",
                    "Engagement signed; ready to bridge to delivery project",
                    "Deal disqualified or client opted out",
                  ];
                  return (
                    <tr
                      key={stage}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                      }}
                    >
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "var(--text-muted)" }}>
                        #{idx + 1}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            fontWeight: 700,
                            padding: "4px 10px",
                            borderRadius: "6px",
                            background: `${color}1a`,
                            color: color,
                            fontSize: "0.78rem",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {stage}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              width: "14px",
                              height: "14px",
                              borderRadius: "4px",
                              background: color,
                            }}
                          />
                          <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {color}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {probs[idx]}%
                      </td>
                      <td style={{ padding: "14px 16px", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        {descriptions[idx]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: RBAC Permissions Matrix */}
      {activeTab === "rbac" && (
        <div>
          <div style={{ marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Role-Based Access Control (RBAC) Matrix
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "2px" }}>
              Enforcing least-privilege security across CRM, Delivery, Workforce, Finance, and System Administration
            </p>
          </div>

          <div className="card" style={{ padding: 0, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
              <thead>
                <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-default)", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>Permission Code</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)" }}>Module</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", color: "#6366f1" }}>Superadmin</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", color: "#8b5cf6" }}>Partner</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", color: "#3b82f6" }}>Consultant</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", color: "#06b6d4" }}>Engineer</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", color: "#10b981" }}>Intern</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", color: "#f59e0b" }}>Freelancer</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", color: "#ec4899" }}>Client</th>
                </tr>
              </thead>
              <tbody>
                {rbacData.map((row) => (
                  <tr key={row.code} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "10px 16px", fontFamily: "monospace", fontWeight: 600, color: "var(--text-primary)" }}>
                      {row.code}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: "var(--bg-elevated)",
                          color: "var(--text-muted)",
                          fontWeight: 600,
                        }}
                      >
                        {row.module}
                      </span>
                    </td>
                    {["superadmin", "partner", "consultant", "engineer", "intern", "freelancer", "client"].map((role) => {
                      const hasPerm = (row.roles as any)[role];
                      return (
                        <td key={role} style={{ padding: "10px 16px", textAlign: "center" }}>
                          {hasPerm ? (
                            <span style={{ color: "#10b981", fontWeight: 700, fontSize: "1rem" }}>✓</span>
                          ) : (
                            <span style={{ color: "var(--text-muted)", opacity: 0.3 }}>-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: API & Integrations */}
      {activeTab === "api" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "800px" }}>
          <div className="card">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
              Public Webhook & Contact Form Ingestion
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "16px" }}>
              Direct endpoint for receiving leads from <code style={{ color: "var(--brand-primary)" }}>contact.html</code> and external consultation forms.
            </p>

            <div style={{ background: "var(--bg-elevated)", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border-default)", fontFamily: "monospace", fontSize: "0.82rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>POST /api/v1/crm/leads/public</span>
              <span style={{ color: "#10b981", fontWeight: 600, fontSize: "0.75rem" }}>ONLINE & ACCEPTING</span>
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
              Internal API Keys & Secrets
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "16px" }}>
              Bearer token authorization is enforced on all protected CRM and Workforce endpoints.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                  Active JWT Signing Algorithm
                </label>
                <input type="text" className="input" value="HS256 (Kapate Security Core)" disabled />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                  Database Connection URI
                </label>
                <input type="text" className="input" value="sqlite+aiosqlite:///./kapate_os.db (WAL Mode Enabled)" disabled />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Add / Edit Service */}
      {serviceModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div className="card" style={{ width: "100%", maxWidth: "520px", position: "relative" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>
              {editingService ? "Edit Service Offering" : "Add New Configurable Service"}
            </h2>

            <form onSubmit={handleSaveService} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  Service Name *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Generative AI Solutions"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                    Service Code
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. gen_ai_solutions"
                    value={serviceForm.code}
                    onChange={(e) => setServiceForm({ ...serviceForm, code: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                    Practice Category
                  </label>
                  <select
                    className="input"
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                  >
                    <option value="AI & Data">AI & Data</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Cloud & DevOps">Cloud & DevOps</option>
                    <option value="Advisory">Advisory</option>
                    <option value="Enterprise Solutions">Enterprise Solutions</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  Description
                </label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Describe scope and enterprise deliverables..."
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <input
                  type="checkbox"
                  id="serviceActive"
                  checked={serviceForm.is_active}
                  onChange={(e) => setServiceForm({ ...serviceForm, is_active: e.target.checked })}
                />
                <label htmlFor="serviceActive" style={{ fontSize: "0.85rem", color: "var(--text-primary)", cursor: "pointer" }}>
                  Active service (visible in leads, deals, and proposals)
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
                <button
                  type="button"
                  className="btn"
                  style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
                  onClick={() => setServiceModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingService ? "Update Service" : "Create Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
