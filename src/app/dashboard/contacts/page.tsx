"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Mail,
  Phone,
  Building2,
  Briefcase,
  X,
  UserCheck,
  Users,
  Crown,
  Shield,
  ChevronDown,
  ExternalLink,
  Edit3,
  Trash2,
  Star,
  Activity as ActivityIcon,
  Filter,
} from "lucide-react";
import {
  crmApi,
  Contact,
  Company,
  BUYING_ROLES,
  FALLBACK_CONTACTS,
  FALLBACK_COMPANIES,
} from "@/lib/crm-api";

const roleIcons: Record<string, any> = {
  CEO: Crown,
  CTO: Shield,
  "VP Product": Briefcase,
  Finance: Building2,
  "Technical Lead": Shield,
  "Decision Maker": UserCheck,
  Champion: Star,
  Influencer: ActivityIcon,
  "End User": Users,
};

const roleColors: Record<string, string> = {
  CEO: "#f59e0b",
  CTO: "#6366f1",
  "VP Product": "#8b5cf6",
  Finance: "#10b981",
  "Technical Lead": "#3b82f6",
  "Decision Maker": "#ef4444",
  Champion: "#06b6d4",
  Influencer: "#d946ef",
  "End User": "#64748b",
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Modals
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [detailDrawer, setDetailDrawer] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form
  const emptyForm = {
    name: "",
    email: "",
    phone: "",
    job_title: "",
    company_id: "",
    role_in_buying_process: "Decision Maker",
    notes: "",
    is_primary: false,
  };
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [contactsData, companiesData] = await Promise.all([
        crmApi.getContacts(),
        crmApi.getCompanies(),
      ]);
      setContacts(contactsData);
      setCompanies(companiesData);
    } catch (err) {
      console.error(err);
      setContacts(FALLBACK_CONTACTS);
      setCompanies(FALLBACK_COMPANIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        (c.job_title && c.job_title.toLowerCase().includes(search.toLowerCase())) ||
        (c.company_name && c.company_name.toLowerCase().includes(search.toLowerCase()));

      const matchCompany =
        companyFilter === "ALL" || c.company_id === companyFilter;

      const matchRole =
        roleFilter === "ALL" || c.role_in_buying_process === roleFilter;

      return matchSearch && matchCompany && matchRole;
    });
  }, [contacts, search, companyFilter, roleFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = contacts.length;
    const primaryContacts = contacts.filter((c) => c.is_primary).length;
    const uniqueCompanies = new Set(contacts.map((c) => c.company_id)).size;
    const roleDist = contacts.reduce((acc, c) => {
      const role = c.role_in_buying_process || "Other";
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topRole = Object.entries(roleDist).sort(
      (a, b) => b[1] - a[1]
    )[0];
    return { total, primaryContacts, uniqueCompanies, topRole };
  }, [contacts]);

  const handleAddContact = async () => {
    if (!form.name || !form.email) {
      showToast("Name and Email are required");
      return;
    }
    setSubmitting(true);
    try {
      await crmApi.createContact(form);
      showToast("Contact created successfully!");
      setAddModal(false);
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      showToast("Failed to create contact. Make sure the backend is running.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditContact = async () => {
    if (!selectedContact || !form.name || !form.email) return;
    setSubmitting(true);
    try {
      await crmApi.updateContact(selectedContact.id, form);
      showToast("Contact updated successfully!");
      setEditModal(false);
      setSelectedContact(null);
      await loadData();
    } catch (err) {
      showToast("Failed to update contact.");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (c: Contact) => {
    setSelectedContact(c);
    setForm({
      name: c.name,
      email: c.email,
      phone: c.phone || "",
      job_title: c.job_title || "",
      company_id: c.company_id || "",
      role_in_buying_process: c.role_in_buying_process || "Decision Maker",
      notes: c.notes || "",
      is_primary: c.is_primary,
    });
    setEditModal(true);
  };

  const openDetail = (c: Contact) => {
    setSelectedContact(c);
    setDetailDrawer(true);
  };

  const getCompanyName = (id: string) => {
    return companies.find((c) => c.id === id)?.name || "—";
  };

  const RoleIcon = ({ role }: { role?: string }) => {
    const Icon = roleIcons[role || ""] || Users;
    const color = roleColors[role || ""] || "#64748b";
    return <Icon size={14} color={color} />;
  };

  // ─── Shared modal form ───
  const ContactFormFields = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Row: Name + Email */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div>
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px", display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Full Name *
          </label>
          <input
            className="input"
            placeholder="e.g. Arjun Mehta"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{ height: "40px" }}
          />
        </div>
        <div>
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px", display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Email *
          </label>
          <input
            className="input"
            type="email"
            placeholder="e.g. arjun@company.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={{ height: "40px" }}
          />
        </div>
      </div>

      {/* Row: Phone + Job Title */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div>
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px", display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Phone
          </label>
          <input
            className="input"
            placeholder="+91 98234 56789"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            style={{ height: "40px" }}
          />
        </div>
        <div>
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px", display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Job Title
          </label>
          <input
            className="input"
            placeholder="e.g. Chief Technology Officer"
            value={form.job_title}
            onChange={(e) => setForm({ ...form, job_title: e.target.value })}
            style={{ height: "40px" }}
          />
        </div>
      </div>

      {/* Row: Company + Role */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div>
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px", display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Company
          </label>
          <select
            className="input"
            value={form.company_id}
            onChange={(e) => setForm({ ...form, company_id: e.target.value })}
            style={{ height: "40px" }}
          >
            <option value="">— Select Company —</option>
            {companies.map((co) => (
              <option key={co.id} value={co.id}>{co.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px", display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Role in Buying Process
          </label>
          <select
            className="input"
            value={form.role_in_buying_process}
            onChange={(e) => setForm({ ...form, role_in_buying_process: e.target.value })}
            style={{ height: "40px" }}
          >
            {BUYING_ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary checkbox */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <input
          type="checkbox"
          id="is-primary"
          checked={form.is_primary}
          onChange={(e) => setForm({ ...form, is_primary: e.target.checked })}
          style={{ accentColor: "#6366f1", width: "16px", height: "16px" }}
        />
        <label htmlFor="is-primary" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", cursor: "pointer" }}>
          Primary contact for this company
        </label>
      </div>

      {/* Notes */}
      <div>
        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px", display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Notes
        </label>
        <textarea
          className="input"
          placeholder="Additional notes about this contact..."
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          style={{ resize: "vertical" }}
        />
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            right: "32px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "white",
            padding: "14px 24px",
            borderRadius: "12px",
            fontSize: "0.85rem",
            fontWeight: 600,
            zIndex: 1000,
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
              background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(6,182,212,0.3)",
            }}>
              <Users size={18} color="white" />
            </div>
            Contacts Directory
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "6px" }}>
            Manage client contacts across your CRM pipeline
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setForm(emptyForm); setAddModal(true); }}
          id="add-contact-btn"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <Plus size={16} />
          Add Contact
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          {
            label: "Total Contacts",
            value: stats.total,
            icon: <Users size={18} />,
            gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            shadow: "rgba(99,102,241,0.3)",
          },
          {
            label: "Primary Contacts",
            value: stats.primaryContacts,
            icon: <Star size={18} />,
            gradient: "linear-gradient(135deg, #f59e0b, #f97316)",
            shadow: "rgba(245,158,11,0.3)",
          },
          {
            label: "Companies Linked",
            value: stats.uniqueCompanies,
            icon: <Building2 size={18} />,
            gradient: "linear-gradient(135deg, #10b981, #059669)",
            shadow: "rgba(16,185,129,0.3)",
          },
          {
            label: "Top Role",
            value: stats.topRole ? stats.topRole[0] : "—",
            subValue: stats.topRole ? `${stats.topRole[1]} contacts` : "",
            icon: <UserCheck size={18} />,
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
            <div style={{ fontSize: typeof stat.value === 'number' ? "1.6rem" : "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {stat.value}
            </div>
            {stat.subValue && (
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>{stat.subValue}</div>
            )}
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: "20px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: "320px" }}>
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            className="input"
            placeholder="Search contacts by name, email, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="contacts-search"
            style={{ paddingLeft: "36px", height: "38px", fontSize: "0.85rem" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Filter size={14} color="var(--text-muted)" />
        </div>
        <select
          className="input"
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          id="company-filter"
          style={{ height: "38px", width: "200px", fontSize: "0.85rem" }}
        >
          <option value="ALL">All Companies</option>
          {companies.map((co) => (
            <option key={co.id} value={co.id}>{co.name}</option>
          ))}
        </select>
        <select
          className="input"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          id="role-filter"
          style={{ height: "38px", width: "180px", fontSize: "0.85rem" }}
        >
          <option value="ALL">All Roles</option>
          {BUYING_ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        {(search || companyFilter !== "ALL" || roleFilter !== "ALL") && (
          <button
            onClick={() => { setSearch(""); setCompanyFilter("ALL"); setRoleFilter("ALL"); }}
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444",
              borderRadius: "8px",
              padding: "8px 14px",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <X size={12} /> Clear
          </button>
        )}
        <div style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {filteredContacts.length} contact{filteredContacts.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Contacts Table */}
      {loading ? (
        <div className="card" style={{ padding: "60px", textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid var(--border-subtle)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading contacts...</div>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="card" style={{ padding: "60px", textAlign: "center" }}>
          <Users size={40} color="var(--text-muted)" style={{ margin: "0 auto 12px", opacity: 0.3 }} />
          <div style={{ color: "var(--text-muted)", fontSize: "0.95rem", fontWeight: 600, marginBottom: "6px" }}>
            No contacts found
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
            {search || companyFilter !== "ALL" || roleFilter !== "ALL" ? "Try adjusting your filters" : "Click \"Add Contact\" to get started"}
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                {["Contact", "Company", "Job Title", "Role", "Phone", "Primary", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "14px 16px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      textAlign: "left",
                      background: "var(--bg-elevated)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((c, idx) => (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: idx < filteredContacts.length - 1 ? "1px solid var(--border-subtle)" : "none",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onClick={() => openDetail(c)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Contact */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "10px",
                        background: `linear-gradient(135deg, ${roleColors[c.role_in_buying_process || ""] || "#6366f1"}22, ${roleColors[c.role_in_buying_process || ""] || "#6366f1"}44)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: roleColors[c.role_in_buying_process || ""] || "#6366f1",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        flexShrink: 0,
                      }}>
                        {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>
                          {c.name}
                          {c.is_primary && (
                            <Star size={12} fill="#f59e0b" color="#f59e0b" style={{ marginLeft: "6px", verticalAlign: "middle" }} />
                          )}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Mail size={10} /> {c.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Company */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Building2 size={13} color="var(--text-muted)" />
                      <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        {c.company_name || getCompanyName(c.company_id)}
                      </span>
                    </div>
                  </td>

                  {/* Job Title */}
                  <td style={{ padding: "14px 16px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {c.job_title || "—"}
                  </td>

                  {/* Role */}
                  <td style={{ padding: "14px 16px" }}>
                    {c.role_in_buying_process ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background: `${roleColors[c.role_in_buying_process] || "#64748b"}15`,
                          color: roleColors[c.role_in_buying_process] || "#64748b",
                          border: `1px solid ${roleColors[c.role_in_buying_process] || "#64748b"}30`,
                        }}
                      >
                        <RoleIcon role={c.role_in_buying_process} />
                        {c.role_in_buying_process}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>—</span>
                    )}
                  </td>

                  {/* Phone */}
                  <td style={{ padding: "14px 16px" }}>
                    {c.phone ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        <Phone size={12} color="var(--text-muted)" />
                        {c.phone}
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>—</span>
                    )}
                  </td>

                  {/* Primary */}
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    {c.is_primary ? (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        padding: "3px 10px", borderRadius: "16px", fontSize: "0.72rem", fontWeight: 700,
                        background: "rgba(245,158,11,0.12)", color: "#f59e0b",
                        border: "1px solid rgba(245,158,11,0.25)",
                      }}>
                        <Star size={10} fill="#f59e0b" /> Primary
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: "6px" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEdit(c)}
                        title="Edit"
                        style={{
                          width: "30px", height: "30px", borderRadius: "8px",
                          background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#6366f1", transition: "all 0.15s",
                        }}
                      >
                        <Edit3 size={13} />
                      </button>
                      <a
                        href={`mailto:${c.email}`}
                        title="Send Email"
                        style={{
                          width: "30px", height: "30px", borderRadius: "8px",
                          background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#10b981", textDecoration: "none",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail size={13} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add Contact Modal ── */}
      {addModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)", zIndex: 200,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setAddModal(false)}
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
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Plus size={16} color="white" />
                </div>
                New Contact
              </h2>
              <button onClick={() => setAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                <X size={18} />
              </button>
            </div>
            <ContactFormFields />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
              <button className="btn" onClick={() => setAddModal(false)} style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddContact}
                disabled={submitting}
                style={{ opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? "Creating..." : "Create Contact"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Contact Modal ── */}
      {editModal && selectedContact && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)", zIndex: 200,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setEditModal(false)}
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
                  background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Edit3 size={16} color="white" />
                </div>
                Edit Contact
              </h2>
              <button onClick={() => setEditModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                <X size={18} />
              </button>
            </div>
            <ContactFormFields />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
              <button className="btn" onClick={() => setEditModal(false)} style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleEditContact}
                disabled={submitting}
                style={{ opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Contact Detail Drawer ── */}
      {detailDrawer && selectedContact && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)", zIndex: 200,
            display: "flex", justifyContent: "flex-end",
          }}
          onClick={() => setDetailDrawer(false)}
        >
          <div
            style={{
              width: "480px", height: "100%", background: "var(--bg-surface)",
              borderLeft: "1px solid var(--border-default)",
              overflow: "auto", animation: "slideInRight 0.3s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: "24px 28px",
              borderBottom: "1px solid var(--border-subtle)",
              background: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.03))",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{
                    width: "56px", height: "56px", borderRadius: "14px",
                    background: `linear-gradient(135deg, ${roleColors[selectedContact.role_in_buying_process || ""] || "#6366f1"}, ${roleColors[selectedContact.role_in_buying_process || ""] || "#8b5cf6"}cc)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontWeight: 700, fontSize: "1.1rem",
                    boxShadow: `0 6px 20px ${roleColors[selectedContact.role_in_buying_process || ""] || "#6366f1"}40`,
                  }}>
                    {selectedContact.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                      {selectedContact.name}
                      {selectedContact.is_primary && <Star size={14} fill="#f59e0b" color="#f59e0b" />}
                    </h3>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      {selectedContact.job_title || "No title"}
                    </div>
                  </div>
                </div>
                <button onClick={() => setDetailDrawer(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Info Sections */}
            <div style={{ padding: "24px 28px" }}>
              {/* Contact Info */}
              <div style={{ marginBottom: "28px" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>
                  Contact Information
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Mail size={14} color="#6366f1" />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Email</div>
                      <a href={`mailto:${selectedContact.email}`} style={{ fontSize: "0.88rem", color: "#6366f1", textDecoration: "none" }}>
                        {selectedContact.email}
                      </a>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Phone size={14} color="#10b981" />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Phone</div>
                      <div style={{ fontSize: "0.88rem", color: "var(--text-primary)" }}>
                        {selectedContact.phone || "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company & Role */}
              <div style={{ marginBottom: "28px" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>
                  Company & Role
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Building2 size={14} color="#f59e0b" />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Company</div>
                      <div style={{ fontSize: "0.88rem", color: "var(--text-primary)", fontWeight: 600 }}>
                        {selectedContact.company_name || getCompanyName(selectedContact.company_id)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${roleColors[selectedContact.role_in_buying_process || ""] || "#64748b"}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <RoleIcon role={selectedContact.role_in_buying_process} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Role in Buying Process</div>
                      <div style={{ fontSize: "0.88rem", color: "var(--text-primary)" }}>
                        {selectedContact.role_in_buying_process || "—"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(139,92,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Briefcase size={14} color="#8b5cf6" />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Job Title</div>
                      <div style={{ fontSize: "0.88rem", color: "var(--text-primary)" }}>
                        {selectedContact.job_title || "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedContact.notes && (
                <div style={{ marginBottom: "28px" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
                    Notes
                  </div>
                  <div style={{
                    padding: "14px 16px", borderRadius: "10px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6,
                  }}>
                    {selectedContact.notes}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className="btn btn-primary"
                  onClick={() => { setDetailDrawer(false); openEdit(selectedContact); }}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                >
                  <Edit3 size={14} /> Edit Contact
                </button>
                <a
                  href={`mailto:${selectedContact.email}`}
                  className="btn"
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    background: "rgba(16,185,129,0.1)", color: "#10b981",
                    border: "1px solid rgba(16,185,129,0.2)", textDecoration: "none",
                  }}
                >
                  <Mail size={14} /> Send Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spin animation */}
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
