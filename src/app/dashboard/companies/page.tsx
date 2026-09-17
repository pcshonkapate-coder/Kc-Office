"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Building2,
  Globe,
  MapPin,
  Users,
  Briefcase,
  FileText,
  X,
  CheckCircle2,
  ExternalLink,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import {
  crmApi,
  Company,
  Contact,
  formatCurrencyINR,
} from "@/lib/crm-api";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("ALL");

  // Modals & Drawers
  const [newCompanyModal, setNewCompanyModal] = useState(false);
  const [newContactModal, setNewContactModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyDrawer, setCompanyDrawer] = useState(false);

  // Forms
  const [companyForm, setCompanyForm] = useState({
    name: "",
    industry: "FinTech",
    website: "",
    domain: "",
    tax_id: "",
    company_size: "51-200",
    source: "Referral",
    country: "India",
    city: "",
    address: "",
    notes: "",
  });

  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    job_title: "",
    role_in_buying_process: "Decision Maker",
    notes: "",
    is_primary: false,
  });

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const data = await crmApi.getCompanies();
      setCompanies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.city && c.city.toLowerCase().includes(search.toLowerCase())) ||
        (c.industry && c.industry.toLowerCase().includes(search.toLowerCase()));

      const matchIndustry = industryFilter === "ALL" || c.industry === industryFilter;
      return matchSearch && matchIndustry;
    });
  }, [companies, search, industryFilter]);

  const handleOpenCompany = async (co: Company) => {
    setSelectedCompany(co);
    setCompanyDrawer(true);
    try {
      const details = await crmApi.getCompanyDetails(co.id);
      setSelectedCompany(details);
    } catch {}
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.name) return;
    try {
      const created = await crmApi.createCompany(companyForm);
      showToast(`Company "${created.name}" registered!`);
      setNewCompanyModal(false);
      setCompanyForm({
        name: "",
        industry: "FinTech",
        website: "",
        domain: "",
        tax_id: "",
        company_size: "51-200",
        source: "Referral",
        country: "India",
        city: "",
        address: "",
        notes: "",
      });
      loadCompanies();
    } catch (err: any) {
      alert(err.message || "Failed to create company");
    }
  };

  const handleAddContactToCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !contactForm.name || !contactForm.email) return;
    try {
      await crmApi.createContact({
        company_id: selectedCompany.id,
        ...contactForm,
      });
      showToast(`Contact "${contactForm.name}" linked to ${selectedCompany.name}!`);
      setNewContactModal(false);
      setContactForm({
        name: "",
        email: "",
        phone: "",
        job_title: "",
        role_in_buying_process: "Decision Maker",
        notes: "",
        is_primary: false,
      });
      handleOpenCompany(selectedCompany);
      loadCompanies();
    } catch (err: any) {
      alert(err.message || "Failed adding contact");
    }
  };

  const industries = Array.from(new Set(companies.map((c) => c.industry).filter(Boolean)));

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
            Client Organizations
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "4px" }}>
            {companies.length} enterprise accounts managed across global jurisdictions
          </p>
        </div>
        <button
          className="btn btn-primary"
          id="add-company-btn"
          onClick={() => setNewCompanyModal(true)}
        >
          <Plus size={15} />
          Add Company
        </button>
      </div>

      {/* Filter Row */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: "240px", maxWidth: "360px" }}>
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
            placeholder="Search company, city, industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "34px", height: "36px", fontSize: "0.82rem" }}
            id="company-search"
          />
        </div>

        {/* Industry Filter */}
        <select
          className="input"
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          style={{ width: "200px", height: "36px", fontSize: "0.8rem" }}
        >
          <option value="ALL">All Industries</option>
          {industries.map((ind) => (
            <option key={ind} value={ind as string}>
              {ind}
            </option>
          ))}
        </select>
      </div>

      {/* Companies Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "16px",
        }}
      >
        {filteredCompanies.map((co) => (
          <div
            key={co.id}
            className="card"
            onClick={() => handleOpenCompany(co)}
            style={{
              padding: "20px",
              cursor: "pointer",
              transition: "transform 0.15s, border-color 0.15s",
              position: "relative",
            }}
          >
            {/* Top row: Logo icon & Company Size */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(99,102,241,0.25)",
                }}
              >
                <Building2 size={20} color="var(--brand-primary)" />
              </div>
              <span className="badge badge-gray">{co.company_size || "50-200 employees"}</span>
            </div>

            {/* Company Name & Industry */}
            <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
              {co.name}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--brand-primary)", fontWeight: 600, marginBottom: "12px" }}>
              {co.industry || "Technology"}
            </div>

            {/* Website & Location */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "16px" }}>
              {co.website && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Globe size={12} />
                  <span style={{ textDecoration: "underline" }}>{co.website.replace("https://", "")}</span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <MapPin size={12} />
                <span>
                  {co.city ? `${co.city}, ` : ""}
                  {co.country}
                </span>
              </div>
              {co.tax_id && (
                <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                  Tax ID / GST: <code style={{ color: "var(--text-primary)" }}>{co.tax_id}</code>
                </div>
              )}
            </div>

            {/* Metric Footer */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                borderTop: "1px solid var(--border-subtle)",
                paddingTop: "12px",
                fontSize: "0.78rem",
              }}
            >
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.7rem" }}>Contacts</span>
                <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                  <Users size={12} color="var(--brand-primary)" />
                  {co.contacts_count || 1}
                </div>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.7rem" }}>Active Deals</span>
                <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                  <Briefcase size={12} color="#10b981" />
                  {co.deals_count || 0} ({formatCurrencyINR(co.total_deal_value || 0)})
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ==================== COMPANY DETAIL DRAWER ==================== */}
      {companyDrawer && selectedCompany && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            width: "500px",
            maxWidth: "100vw",
            background: "var(--bg-elevated)",
            borderLeft: "1px solid var(--border-default)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            boxShadow: "-10px 0 30px rgba(0,0,0,0.5)",
          }}
        >
          {/* Header */}
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
              <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {selectedCompany.name}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                {selectedCompany.industry} · {selectedCompany.city}, {selectedCompany.country}
              </div>
            </div>
            <button
              onClick={() => setCompanyDrawer(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
            {/* Quick Overview */}
            <div className="card" style={{ padding: "16px", marginBottom: "20px" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "10px", color: "var(--text-primary)" }}>
                Account Overview
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.8rem" }}>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Tax ID / GST:</span>
                  <div style={{ fontWeight: 600 }}>{selectedCompany.tax_id || selectedCompany.gst_number || "—"}</div>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Company Size:</span>
                  <div style={{ fontWeight: 600 }}>{selectedCompany.company_size || "—"}</div>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Source:</span>
                  <div style={{ fontWeight: 600 }}>{selectedCompany.source || "Direct"}</div>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Pipeline Value:</span>
                  <div style={{ fontWeight: 700, color: "#10b981" }}>
                    {formatCurrencyINR(selectedCompany.total_deal_value || 0)}
                  </div>
                </div>
              </div>
              {selectedCompany.address && (
                <div style={{ marginTop: "10px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                  Address: {selectedCompany.address}
                </div>
              )}
            </div>

            {/* Associated Contacts List */}
            <div className="card" style={{ padding: "16px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: 700 }}>
                  <Users size={15} color="var(--brand-primary)" />
                  Contacts ({selectedCompany.contacts?.length || 0})
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => setNewContactModal(true)}
                  style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                >
                  <Plus size={12} /> Add Contact
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {selectedCompany.contacts && selectedCompany.contacts.length > 0 ? (
                  selectedCompany.contacts.map((ct) => (
                    <div
                      key={ct.id}
                      style={{
                        padding: "10px",
                        background: "var(--bg-hover)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "8px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)" }}>
                          {ct.name}
                        </div>
                        {ct.role_in_buying_process && (
                          <span className="badge badge-primary" style={{ fontSize: "0.68rem" }}>
                            {ct.role_in_buying_process}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        {ct.job_title || ct.designation} · {ct.email} {ct.phone && `· ${ct.phone}`}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", padding: "12px" }}>
                    No contacts recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ADD COMPANY MODAL ==================== */}
      {newCompanyModal && (
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
          <div className="card" style={{ width: "100%", maxWidth: "520px", padding: "24px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Register Client Organization
              </h2>
              <button onClick={() => setNewCompanyModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCompany}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                  Company Name *
                </label>
                <input
                  className="input"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  placeholder="e.g. Acme Corporation"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                    Industry
                  </label>
                  <input
                    className="input"
                    value={companyForm.industry}
                    onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                    placeholder="FinTech, Healthcare..."
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                    Website
                  </label>
                  <input
                    className="input"
                    value={companyForm.website}
                    onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                    placeholder="https://acme.com"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                    Tax ID / GST Number
                  </label>
                  <input
                    className="input"
                    value={companyForm.tax_id}
                    onChange={(e) => setCompanyForm({ ...companyForm, tax_id: e.target.value })}
                    placeholder="GSTIN or Tax Code"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                    Company Size
                  </label>
                  <select
                    className="input"
                    value={companyForm.company_size}
                    onChange={(e) => setCompanyForm({ ...companyForm, company_size: e.target.value })}
                  >
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                    Country
                  </label>
                  <input
                    className="input"
                    value={companyForm.country}
                    onChange={(e) => setCompanyForm({ ...companyForm, country: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                    City
                  </label>
                  <input
                    className="input"
                    value={companyForm.city}
                    onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                  Office Address
                </label>
                <input
                  className="input"
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                  Notes
                </label>
                <textarea
                  className="input"
                  rows={2}
                  value={companyForm.notes}
                  onChange={(e) => setCompanyForm({ ...companyForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setNewCompanyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ADD CONTACT MODAL ==================== */}
      {newContactModal && selectedCompany && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1001,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div className="card" style={{ width: "100%", maxWidth: "440px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                Add Contact to {selectedCompany.name}
              </h3>
              <button onClick={() => setNewContactModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddContactToCompany}>
              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                  Contact Name *
                </label>
                <input
                  className="input"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                  Email Address *
                </label>
                <input
                  className="input"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                    Phone
                  </label>
                  <input
                    className="input"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                    Job Title
                  </label>
                  <input
                    className="input"
                    value={contactForm.job_title}
                    onChange={(e) => setContactForm({ ...contactForm, job_title: e.target.value })}
                    placeholder="e.g. CTO"
                  />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}>
                  Role in Buying Process
                </label>
                <select
                  className="input"
                  value={contactForm.role_in_buying_process}
                  onChange={(e) => setContactForm({ ...contactForm, role_in_buying_process: e.target.value })}
                >
                  <option value="CEO">CEO</option>
                  <option value="CTO">CTO</option>
                  <option value="VP Product">VP Product</option>
                  <option value="Finance">Finance</option>
                  <option value="Technical Lead">Technical Lead</option>
                  <option value="Decision Maker">Decision Maker</option>
                  <option value="Champion">Champion</option>
                  <option value="Influencer">Influencer</option>
                  <option value="End User">End User</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setNewContactModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
