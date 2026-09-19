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
      const res = await fetch('/api/v1/auth/me');
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('authService.me error:', err);
      return { error: 'Network error' };
    }
  },
  logout: async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('authService.logout error:', err);
    }
  }
};

export const leadService = {
  getLeads: async () => {
    try {
      const res = await fetch('/api/v1/crm/leads');
      const json = await res.json();
      if (json.data) return json.data as Lead[];
    } catch (e) {
      console.error(e);
    }
    return useDemoStore.getState().leads;
  },
  addLead: async (lead: Omit<Lead, 'id' | 'created'>) => {
    try {
      const res = await fetch('/api/v1/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
      const json = await res.json();
      if (json.data) {
        useDemoStore.getState().addLead(lead);
        return json.data;
      }
    } catch (e) {
      console.error(e);
    }
    useDemoStore.getState().addLead(lead);
  },
  updateStatus: async (id: string, status: Lead['status']) => {
    try {
      await fetch('/api/v1/crm/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
    } catch (e) {
      console.error(e);
    }
    useDemoStore.getState().updateLeadStatus(id, status);
  }
};

export const dealService = {
  getDeals: async () => {
    try {
      const res = await fetch('/api/v1/crm/deals');
      const json = await res.json();
      if (json.data) return json.data as Deal[];
    } catch (e) {
      console.error(e);
    }
    return useDemoStore.getState().deals;
  },
  addDeal: async (deal: Omit<Deal, 'id' | 'created'>) => {
    try {
      const res = await fetch('/api/v1/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deal),
      });
      const json = await res.json();
      if (json.data) {
        useDemoStore.getState().addDeal(deal);
        return json.data;
      }
    } catch (e) {
      console.error(e);
    }
    useDemoStore.getState().addDeal(deal);
  },
  updateStage: async (id: string, stage: Deal['stage']) => {
    try {
      await fetch('/api/v1/crm/deals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, stage }),
      });
    } catch (e) {
      console.error(e);
    }
    useDemoStore.getState().updateDealStage(id, stage);
  }
};

export const companyService = {
  getCompanies: async () => {
    try {
      const res = await fetch('/api/v1/crm/companies');
      const json = await res.json();
      if (json.data) return json.data as Company[];
    } catch (e) {
      console.error(e);
    }
    return useDemoStore.getState().companies;
  },
  addCompany: async (comp: Omit<Company, 'id' | 'contactsCount' | 'dealsCount' | 'activeProjects' | 'totalRevenue' | 'contacts'>) => {
    try {
      await fetch('/api/v1/crm/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comp),
      });
    } catch (e) {
      console.error(e);
    }
    useDemoStore.getState().addCompany(comp);
  }
};

export const projectService = {
  getProjects: async () => {
    try {
      const res = await fetch('/api/v1/projects');
      const json = await res.json();
      if (json.data) return json.data as Project[];
    } catch (e) {
      console.error(e);
    }
    return useDemoStore.getState().projects;
  },
  addProject: async (prj: Omit<Project, 'id' | 'spentBudget' | 'progress' | 'status' | 'milestones' | 'profitability'>) => {
    try {
      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prj),
      });
      const json = await res.json();
      if (json.data) {
        useDemoStore.getState().addProject(prj);
        return json.data;
      }
    } catch (e) {
      console.error(e);
    }
    useDemoStore.getState().addProject(prj);
  }
};

export const taskService = {
  getTasks: async () => {
    try {
      const res = await fetch('/api/v1/tasks');
      const json = await res.json();
      if (json.data) return json.data as Task[];
    } catch (e) {
      console.error(e);
    }
    return useDemoStore.getState().tasks;
  },
  addTask: async (task: Omit<Task, 'id' | 'loggedHours'>) => {
    try {
      const res = await fetch('/api/v1/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      const json = await res.json();
      if (json.data) {
        useDemoStore.getState().addTask(task);
        return json.data;
      }
    } catch (e) {
      console.error(e);
    }
    useDemoStore.getState().addTask(task);
  },
  updateStatus: async (id: string, status: Task['status']) => {
    try {
      await fetch('/api/v1/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
    } catch (e) {
      console.error(e);
    }
    useDemoStore.getState().updateTaskStatus(id, status);
  }
};

export const employeeService = {
  getEmployees: async () => {
    try {
      const res = await fetch('/api/v1/workforce/team?type=employees');
      const json = await res.json();
      if (json.data) return json.data as Employee[];
    } catch (e) {
      console.error(e);
    }
    return useDemoStore.getState().employees;
  },
  getInterns: async () => {
    try {
      const res = await fetch('/api/v1/workforce/team?type=interns');
      const json = await res.json();
      if (json.data) return json.data as Intern[];
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
      const res = await fetch('/api/v1/finance/invoices');
      const json = await res.json();
      if (json.data) return json.data as Invoice[];
    } catch (e) {
      console.error(e);
    }
    return useDemoStore.getState().invoices;
  },
  addInvoice: async (inv: Omit<Invoice, 'id' | 'status' | 'amount' | 'tax' | 'total'>) => {
    try {
      await fetch('/api/v1/finance/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inv),
      });
    } catch (e) {
      console.error(e);
    }
    useDemoStore.getState().addInvoice(inv);
  },
  markPaid: async (id: string) => {
    try {
      await fetch('/api/v1/finance/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'Paid', paidDate: new Date().toISOString().split('T')[0] }),
      });
    } catch (e) {
      console.error(e);
    }
    useDemoStore.getState().markInvoicePaid(id);
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
