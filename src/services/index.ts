import { useDemoStore } from '../store/demoStore';
import { Lead, Company, Contact, Deal, Project, Task, Invoice, Employee, Intern, Freelancer, TimesheetEntry, AttendanceRecord, LeaveRequest } from '../types';

/**
 * Service layer backed by REST / API v1 endpoints with reactive Zustand sync
 */

export const authService = {
  login: async (credentials: { email: string; password?: string; roleKey?: string }) => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('authService.login error:', err);
      return { error: 'Network connection failed' };
    }
  },
  me: async () => {
    try {
      const res = await fetch('/api/v1/auth/me', { headers: getHeaders() });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('authService.me error:', err);
      return { error: 'Network error' };
    }
  },
  logout: async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST', headers: getHeaders() });
    } catch (err) {
      console.error('authService.logout error:', err);
    }
  }
};

const getHeaders = (withBody = false): Record<string, string> => {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('kapate_token') || localStorage.getItem('kapate_access_token')) : null;
  const headers: Record<string, string> = {};
  if (withBody) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export const leadService = {
  getLeads: async () => {
    try {
      const res = await fetch('/api/v1/crm/leads', { headers: getHeaders() });
      const json = await res.json();
      const list = json.data || json.leads;
      if (Array.isArray(list)) return list as Lead[];
    } catch (e) {
      console.error(e);
    }
    return useDemoStore.getState().leads;
  },
  addLead: async (lead: Omit<Lead, 'id' | 'created'>) => {
    return useDemoStore.getState().addLead(lead);
  },
  updateStatus: async (id: string, status: Lead['status']) => {
    return useDemoStore.getState().updateLeadStatus(id, status);
  }
};

export const dealService = {
  getDeals: async () => {
    try {
      const res = await fetch('/api/v1/crm/deals', { headers: getHeaders() });
      const json = await res.json();
      const list = json.data || json.deals;
      if (Array.isArray(list)) return list as Deal[];
    } catch (e) {
      console.error(e);
    }
    return useDemoStore.getState().deals;
  },
  addDeal: async (deal: Omit<Deal, 'id' | 'created'>) => {
    return useDemoStore.getState().addDeal(deal);
  },
  updateStage: async (id: string, stage: Deal['stage']) => {
    return useDemoStore.getState().updateDealStage(id, stage);
  }
};

export const companyService = {
  getCompanies: async () => {
    try {
      const res = await fetch('/api/v1/crm/companies', { headers: getHeaders() });
      const json = await res.json();
      const list = json.data || json.companies;
      if (Array.isArray(list)) return list as Company[];
    } catch (e) {
      console.error(e);
    }
    return useDemoStore.getState().companies;
  },
  addCompany: async (comp: Omit<Company, 'id' | 'contactsCount' | 'dealsCount' | 'activeProjects' | 'totalRevenue' | 'contacts'>) => {
    return useDemoStore.getState().addCompany(comp);
  }
};

export const projectService = {
  getProjects: async () => {
    try {
      const res = await fetch('/api/v1/projects', { headers: getHeaders() });
      const json = await res.json();
      const list = json.data || json.projects;
      if (Array.isArray(list)) return list as Project[];
    } catch (e) {
      console.error(e);
    }
    return useDemoStore.getState().projects;
  },
  addProject: async (prj: Omit<Project, 'id' | 'spentBudget' | 'progress' | 'status' | 'milestones' | 'profitability'>) => {
    return useDemoStore.getState().addProject(prj);
  }
};

export const taskService = {
  getTasks: async () => {
    try {
      const res = await fetch('/api/v1/tasks', { headers: getHeaders() });
      const json = await res.json();
      const list = json.data || json.tasks;
      if (Array.isArray(list)) return list as Task[];
    } catch (e) {
      console.error(e);
    }
    return useDemoStore.getState().tasks;
  },
  addTask: async (task: Omit<Task, 'id' | 'loggedHours'>) => {
    return useDemoStore.getState().addTask(task);
  },
  updateStatus: async (id: string, status: Task['status']) => {
    return useDemoStore.getState().updateTaskStatus(id, status);
  }
};

export const employeeService = {
  getEmployees: async () => {
    try {
      const res = await fetch('/api/v1/workforce/team?type=employees', { headers: getHeaders() });
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) return json.data as Employee[];
    } catch (e) {
      console.error(e);
    }
    return useDemoStore.getState().employees;
  },
  getInterns: async () => {
    try {
      const res = await fetch('/api/v1/workforce/team?type=interns', { headers: getHeaders() });
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) return json.data as Intern[];
    } catch (e) {
      console.error(e);
    }
    return useDemoStore.getState().interns;
  },
  addEmployee: (emp: Partial<Employee>) => useDemoStore.getState().addEmployee(emp),
  addIntern: (intern: Omit<Intern, 'id' | 'tasksCompleted' | 'tasksPending' | 'loggedHours' | 'attendancePct' | 'trainingProgress' | 'status' | 'evaluations'>) => useDemoStore.getState().addIntern(intern)
};

export const invoiceService = {
  getInvoices: async () => {
    try {
      const res = await fetch('/api/v1/finance/invoices', { headers: getHeaders() });
      const json = await res.json();
      const list = json.data || json.invoices;
      if (Array.isArray(list)) return list as Invoice[];
    } catch (e) {
      console.error(e);
    }
    return useDemoStore.getState().invoices;
  },
  addInvoice: async (inv: Omit<Invoice, 'id' | 'status' | 'amount' | 'tax' | 'total'>) => {
    return useDemoStore.getState().addInvoice(inv);
  },
  markPaid: async (id: string) => {
    return useDemoStore.getState().markInvoicePaid(id);
  }
};

export const notificationService = {
  getNotifications: () => useDemoStore.getState().notifications,
  markRead: (id: string) => useDemoStore.getState().markNotificationRead(id)
};

export const aiService = {
  generateLeadSummary: async (leadInfo: string) => {
    try {
      const res = await fetch('/api/v1/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'lead_summary', content: leadInfo }),
      });
      const json = await res.json();
      if (json.data) return json.data;
    } catch (e) {
      console.error(e);
    }
    return {
      industry: 'Enterprise Software & Financial Tech',
      requirement: 'Automated AI customer support ticketing & agent co-pilot system.',
      potentialProject: 'Kapate OS AI Customer Support Core Module',
      complexity: 'High (Requires LLM Fine-tuning & RAG pipeline)',
      suggestedService: 'AI Solutions / Machine Learning',
      suggestedNextAction: 'Schedule Discovery Call with Senior ML Architect & NDA Review'
    };
  },
  generateMeetingSummary: async (transcript: string) => {
    try {
      const res = await fetch('/api/v1/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'meeting_summary', content: transcript }),
      });
      const json = await res.json();
      if (json.data) return json.data;
    } catch (e) {
      console.error(e);
    }
    return {
      summary: 'Discovery meeting with VP of Tech regarding Zendesk & Salesforce LLM assistant integration.',
      requirements: ['Sub-second latency response', '99.9% uptime SLA', 'HIPAA & SOC 2 compliance', 'Custom prompt guardrails'],
      actionItems: ['Draft SOW for 12-week Phase 1', 'Prepare dataset sample for fine-tuning demo', 'Deliver NDA agreement'],
      risks: 'High API token costs if un-optimized RAG chunking is used.',
      nextSteps: 'Send proposal by Friday.'
    };
  },
  generateProposal: async (client: string, requirement: string, budget: string) => {
    try {
      const res = await fetch('/api/v1/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'proposal', client, content: requirement, budget }),
      });
      const json = await res.json();
      if (json.data) return json.data;
    } catch (e) {
      console.error(e);
    }
    return {
      executiveSummary: `Custom AI Solution tailored for ${client} to automate workflows and optimize operations.`,
      scope: ['Data preparation & annotation', 'Model selection & fine-tuning', 'API backend integration', 'Dashboard interface'],
      deliverables: ['Production Docker image', 'Model benchmark report', 'Integration SDK', 'SLA support'],
      technology: ['Python', 'FastAPI', 'PyTorch', 'Next.js', 'PostgreSQL'],
      timeline: '10-12 Weeks',
      pricingStructure: `Milestone 1: 30% | Milestone 2: 40% | Milestone 3: 30% (${budget})`
    };
  },
  generateTaskBreakdown: async (projectGoal: string) => {
    try {
      const res = await fetch('/api/v1/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'tasks', content: projectGoal }),
      });
      const json = await res.json();
      if (json.data) return json.data;
    } catch (e) {
      console.error(e);
    }
    return [
      { title: 'Requirements & Architectural Design', priority: 'High', estimatedHours: 16 },
      { title: 'Dataset Curation & Data Cleaning Pipeline', priority: 'High', estimatedHours: 24 },
      { title: 'Model Selection & Fine-tuning Benchmark', priority: 'High', estimatedHours: 32 },
      { title: 'FastAPI Backend Endpoints & DB Schema', priority: 'Medium', estimatedHours: 20 },
      { title: 'RAG Vector Indexing (Qdrant/Pinecone)', priority: 'Medium', estimatedHours: 18 },
      { title: 'Frontend UI Dashboard Integration', priority: 'Medium', estimatedHours: 24 },
      { title: 'Security Audit & Load Testing', priority: 'High', estimatedHours: 16 },
      { title: 'Production K8s Deployment & Monitoring', priority: 'Urgent', estimatedHours: 12 }
    ];
  }
};
