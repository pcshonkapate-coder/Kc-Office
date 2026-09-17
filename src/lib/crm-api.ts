const getBaseApiUrl = (): string => {
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return raw.endsWith("/api/v1") ? raw : `${raw.replace(/\/+$/, "")}/api/v1`;
};

export const API_BASE_URL = getBaseApiUrl();

export interface Service {
  id: string;
  name: string;
  code?: string;
  description?: string;
  category: string;
  is_active: boolean;
  created_at?: string;
}

export interface Company {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  website?: string;
  gst_number?: string;
  tax_id?: string;
  company_size?: string;
  source?: string;
  address?: string;
  city?: string;
  country: string;
  notes?: string;
  contacts_count: number;
  deals_count: number;
  total_deal_value: number;
  created_at: string;
  contacts?: Contact[];
}

export interface Contact {
  id: string;
  company_id: string;
  company_name?: string;
  name: string;
  email: string;
  phone?: string;
  job_title?: string;
  designation?: string;
  role_in_buying_process?: string;
  notes?: string;
  is_primary: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  lead_code: string;
  name: string;
  contact_name: string;
  company_name: string;
  email: string;
  phone?: string;
  country: string;
  city?: string;
  job_title?: string;
  service_id?: string;
  service_name?: string;
  service_interest?: string;
  budget?: string;
  currency: string;
  project_description?: string;
  source: string;
  priority: "low" | "medium" | "high" | "urgent";
  lead_score: number;
  assigned_salesperson_id?: string;
  assigned_salesperson_name?: string;
  status: string;
  last_contacted_at?: string;
  next_follow_up_at?: string;
  notes?: string;
  converted_deal_id?: string;
  created_at: string;
}

export interface DealStageHistory {
  id: string;
  deal_id: string;
  from_stage?: string;
  to_stage: string;
  notes?: string;
  changed_by_name?: string;
  created_at: string;
}

export interface Deal {
  id: string;
  title: string;
  company_id: string;
  company_name?: string;
  primary_contact_id?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  service_id?: string;
  service_name?: string;
  estimated_value: number;
  currency: string;
  expected_close_date?: string;
  pipeline_stage: string;
  win_probability: number;
  owner_user_id?: string;
  owner_name?: string;
  notes?: string;
  created_at: string;
  stage_history?: DealStageHistory[];
  activities?: Activity[];
}

export interface Activity {
  id: string;
  entity_type: "lead" | "deal" | "company" | "contact";
  entity_id: string;
  activity_type: "call" | "email" | "meeting" | "note" | "follow_up" | "task";
  subject: string;
  notes: string;
  status: "pending" | "completed" | "cancelled";
  due_date?: string;
  completed_at?: string;
  created_by_user_id?: string;
  created_by_name?: string;
  created_at: string;
}

export interface SalespersonPerformance {
  user_id: string;
  full_name: string;
  deals_count: number;
  won_deals_count: number;
  won_revenue: number;
  pipeline_value: number;
  win_rate: number;
}

export interface CRMDashboardMetrics {
  new_leads: number;
  qualified_leads: number;
  open_deals: number;
  pipeline_value: number;
  won_revenue: number;
  lost_deals: number;
  conversion_rate: number;
  average_deal_value: number;
  salesperson_performance: SalespersonPerformance[];
  stage_distribution: Record<string, number>;
}

export const PIPELINE_STAGES = [
  "NEW LEAD",
  "QUALIFICATION",
  "DISCOVERY BOOKED",
  "DISCOVERY COMPLETED",
  "TECHNICAL ASSESSMENT",
  "NDA / MSA",
  "PROPOSAL / SOW",
  "NEGOTIATION",
  "CLOSED WON",
  "CLOSED LOST",
] as const;

export const STAGE_COLORS: Record<string, string> = {
  "NEW LEAD": "#6366f1",
  "QUALIFICATION": "#8b5cf6",
  "DISCOVERY BOOKED": "#06b6d4",
  "DISCOVERY COMPLETED": "#0284c7",
  "TECHNICAL ASSESSMENT": "#3b82f6",
  "NDA / MSA": "#d946ef",
  "PROPOSAL / SOW": "#f59e0b",
  "NEGOTIATION": "#ea580c",
  "CLOSED WON": "#10b981",
  "CLOSED LOST": "#ef4444",
};

export const LEAD_SOURCES = [
  "Website contact form",
  "Consultation form",
  "Referral",
  "Email",
  "LinkedIn",
  "Cold outreach",
  "Manual entry",
  "Other",
] as const;

export const BUYING_ROLES = [
  "CEO",
  "CTO",
  "VP Product",
  "Finance",
  "Technical Lead",
  "Decision Maker",
  "Champion",
  "Influencer",
  "End User",
] as const;

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("kapate_token") : null;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// Fallback seed demo data in case backend API is unreachable in client
export const FALLBACK_SERVICES: Service[] = [
  { id: "s1", name: "AI Development", code: "ai_development", category: "AI & Data", is_active: true },
  { id: "s2", name: "Machine Learning", code: "machine_learning", category: "AI & Data", is_active: true },
  { id: "s3", name: "Custom Software Development", code: "custom_software", category: "Engineering", is_active: true },
  { id: "s4", name: "Web Development", code: "web_development", category: "Engineering", is_active: true },
  { id: "s5", name: "Mobile Development", code: "mobile_development", category: "Engineering", is_active: true },
  { id: "s6", name: "Data Engineering", code: "data_engineering", category: "AI & Data", is_active: true },
  { id: "s7", name: "Cloud Solutions", code: "cloud_solutions", category: "Cloud & DevOps", is_active: true },
  { id: "s8", name: "Automation", code: "automation", category: "Cloud & DevOps", is_active: true },
  { id: "s9", name: "AI Consulting", code: "ai_consulting", category: "Advisory", is_active: true },
  { id: "s10", name: "IT Consulting", code: "it_consulting", category: "Advisory", is_active: true },
  { id: "s11", name: "Enterprise Solutions", code: "enterprise_solutions", category: "Engineering", is_active: true },
];

export const FALLBACK_COMPANIES: Company[] = [];
export const FALLBACK_CONTACTS: Contact[] = [];
export const FALLBACK_DEALS: Deal[] = [];
export const FALLBACK_LEADS: Lead[] = [];

// ==================== API SERVICE CLIENT ====================
export const crmApi = {
  // Metrics
  async getDashboardMetrics(): Promise<CRMDashboardMetrics> {
    try {
      const res = await fetch(`${API_BASE_URL}/crm/dashboard`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {}
    // Calculate fallback metrics from demo data
    const openDeals = FALLBACK_DEALS.filter(
      (d) => !["CLOSED WON", "CLOSED LOST"].includes(d.pipeline_stage)
    );
    const wonDeals = FALLBACK_DEALS.filter((d) => d.pipeline_stage === "CLOSED WON");
    const pipelineVal = openDeals.reduce((a, b) => a + b.estimated_value, 0);
    const wonRev = wonDeals.reduce((a, b) => a + b.estimated_value, 0);
    return {
      new_leads: FALLBACK_LEADS.filter((l) => l.status === "NEW LEAD").length,
      qualified_leads: FALLBACK_LEADS.filter((l) => l.status !== "NEW LEAD").length,
      open_deals: openDeals.length,
      pipeline_value: pipelineVal,
      won_revenue: wonRev,
      lost_deals: 0,
      conversion_rate: 66.7,
      average_deal_value: Math.round((pipelineVal + wonRev) / FALLBACK_DEALS.length),
      salesperson_performance: [
        {
          user_id: "admin",
          full_name: "Kapate Master Admin",
          deals_count: FALLBACK_DEALS.length,
          won_deals_count: wonDeals.length,
          won_revenue: wonRev,
          pipeline_value: pipelineVal,
          win_rate: 75.0,
        },
      ],
      stage_distribution: FALLBACK_DEALS.reduce((acc, d) => {
        acc[d.pipeline_stage] = (acc[d.pipeline_stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  },

  // Services
  async getServices(): Promise<Service[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/crm/services`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {}
    return FALLBACK_SERVICES;
  },

  async createService(payload: Partial<Service>): Promise<Service> {
    const res = await fetch(`${API_BASE_URL}/crm/services`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || err.detail || "Failed to create service");
    }
    return await res.json();
  },

  async updateService(id: string, payload: Partial<Service>): Promise<Service> {
    const res = await fetch(`${API_BASE_URL}/crm/services/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update service");
    return await res.json();
  },

  // Companies
  async getCompanies(params?: { search?: string; industry?: string; country?: string }): Promise<Company[]> {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.append("search", params.search);
      if (params?.industry) query.append("industry", params.industry);
      if (params?.country) query.append("country", params.country);

      const res = await fetch(`${API_BASE_URL}/crm/companies?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {}
    return FALLBACK_COMPANIES;
  },

  async getCompanyDetails(id: string): Promise<Company> {
    const res = await fetch(`${API_BASE_URL}/crm/companies/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch company details");
    return await res.json();
  },

  async createCompany(payload: Partial<Company>): Promise<Company> {
    const res = await fetch(`${API_BASE_URL}/crm/companies`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.error?.message || "Failed to create company");
    }
    return await res.json();
  },

  async updateCompany(id: string, payload: Partial<Company>): Promise<Company> {
    const res = await fetch(`${API_BASE_URL}/crm/companies/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update company");
    return await res.json();
  },

  // Contacts
  async getContacts(params?: { company_id?: string; search?: string; role?: string }): Promise<Contact[]> {
    try {
      const query = new URLSearchParams();
      if (params?.company_id) query.append("company_id", params.company_id);
      if (params?.search) query.append("search", params.search);
      if (params?.role) query.append("role", params.role);

      const res = await fetch(`${API_BASE_URL}/crm/contacts?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {}
    return FALLBACK_CONTACTS;
  },

  async createContact(payload: Partial<Contact>): Promise<Contact> {
    const res = await fetch(`${API_BASE_URL}/crm/contacts`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create contact");
    return await res.json();
  },

  async updateContact(id: string, payload: Partial<Contact>): Promise<Contact> {
    const res = await fetch(`${API_BASE_URL}/crm/contacts/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update contact");
    return await res.json();
  },

  // Leads
  async getLeads(params?: {
    search?: string;
    source?: string;
    service_id?: string;
    status?: string;
    priority?: string;
  }): Promise<Lead[]> {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.append("search", params.search);
      if (params?.source) query.append("source", params.source);
      if (params?.service_id) query.append("service_id", params.service_id);
      if (params?.status) query.append("status", params.status);
      if (params?.priority) query.append("priority", params.priority);

      const res = await fetch(`${API_BASE_URL}/crm/leads?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {}
    return FALLBACK_LEADS;
  },

  async createLead(payload: Partial<Lead>): Promise<Lead> {
    const res = await fetch(`${API_BASE_URL}/crm/leads`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create lead");
    return await res.json();
  },

  async updateLead(id: string, payload: Partial<Lead>): Promise<Lead> {
    const res = await fetch(`${API_BASE_URL}/crm/leads/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update lead");
    return await res.json();
  },

  async convertLead(id: string, payload: { deal_title?: string; estimated_value?: number; pipeline_stage?: string }): Promise<Deal> {
    const res = await fetch(`${API_BASE_URL}/crm/leads/${id}/convert`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to convert lead to deal");
    return await res.json();
  },

  // Deals
  async getDeals(params?: {
    search?: string;
    company_id?: string;
    service_id?: string;
    stage?: string;
    min_value?: number;
    max_value?: number;
  }): Promise<Deal[]> {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.append("search", params.search);
      if (params?.company_id) query.append("company_id", params.company_id);
      if (params?.service_id) query.append("service_id", params.service_id);
      if (params?.stage) query.append("stage", params.stage);
      if (params?.min_value) query.append("min_value", String(params.min_value));
      if (params?.max_value) query.append("max_value", String(params.max_value));

      const res = await fetch(`${API_BASE_URL}/crm/deals?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {}
    return FALLBACK_DEALS;
  },

  async getDealDetails(id: string): Promise<Deal> {
    const res = await fetch(`${API_BASE_URL}/crm/deals/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch deal details");
    return await res.json();
  },

  async createDeal(payload: Partial<Deal>): Promise<Deal> {
    const res = await fetch(`${API_BASE_URL}/crm/deals`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create deal");
    return await res.json();
  },

  async updateDeal(id: string, payload: Partial<Deal>): Promise<Deal> {
    const res = await fetch(`${API_BASE_URL}/crm/deals/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update deal");
    return await res.json();
  },

  async updateDealStage(id: string, stage: string, notes?: string, win_probability?: number): Promise<DealStageHistory> {
    const res = await fetch(`${API_BASE_URL}/crm/deals/${id}/stage`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ pipeline_stage: stage, notes, win_probability }),
    });
    if (!res.ok) throw new Error("Failed to update deal stage");
    return await res.json();
  },

  async convertDealToProject(id: string, projectName?: string): Promise<any> {
    const url = projectName
      ? `${API_BASE_URL}/crm/deals/${id}/convert-to-project?project_name=${encodeURIComponent(projectName)}`
      : `${API_BASE_URL}/crm/deals/${id}/convert-to-project`;
    const res = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to bridge deal to project");
    return await res.json();
  },

  // Activities
  async getActivities(entity_type?: string, entity_id?: string): Promise<Activity[]> {
    try {
      const query = new URLSearchParams();
      if (entity_type) query.append("entity_type", entity_type);
      if (entity_id) query.append("entity_id", entity_id);

      const res = await fetch(`${API_BASE_URL}/crm/activities?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  async createActivity(payload: Partial<Activity>): Promise<Activity> {
    const res = await fetch(`${API_BASE_URL}/crm/activities`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to log activity");
    return await res.json();
  },
};

export function formatCurrencyINR(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${val.toLocaleString("en-IN")}`;
}
