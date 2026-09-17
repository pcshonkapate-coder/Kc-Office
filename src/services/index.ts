import { useDemoStore } from '../store/demoStore';
import { Lead, Company, Contact, Deal, Project, Task, Invoice, Employee, Intern } from '../types';

/**
 * Service interfaces to ensure future REST/FastAPI backend readiness.
 * Currently backed by the reactive demo Zustand store.
 */

export const leadService = {
  getLeads: () => useDemoStore.getState().leads,
  addLead: (lead: Omit<Lead, 'id' | 'created'>) => useDemoStore.getState().addLead(lead),
  updateStatus: (id: string, status: Lead['status']) => useDemoStore.getState().updateLeadStatus(id, status)
};

export const companyService = {
  getCompanies: () => useDemoStore.getState().companies,
  addCompany: (comp: Omit<Company, 'id' | 'contactsCount' | 'dealsCount' | 'activeProjects' | 'totalRevenue' | 'contacts'>) => useDemoStore.getState().addCompany(comp)
};

export const dealService = {
  getDeals: () => useDemoStore.getState().deals,
  addDeal: (deal: Omit<Deal, 'id' | 'created'>) => useDemoStore.getState().addDeal(deal),
  updateStage: (id: string, stage: Deal['stage']) => useDemoStore.getState().updateDealStage(id, stage)
};

export const projectService = {
  getProjects: () => useDemoStore.getState().projects,
  addProject: (prj: Omit<Project, 'id' | 'spentBudget' | 'progress' | 'status' | 'milestones' | 'profitability'>) => useDemoStore.getState().addProject(prj)
};

export const taskService = {
  getTasks: () => useDemoStore.getState().tasks,
  addTask: (task: Omit<Task, 'id' | 'loggedHours'>) => useDemoStore.getState().addTask(task),
  updateStatus: (id: string, status: Task['status']) => useDemoStore.getState().updateTaskStatus(id, status)
};

export const employeeService = {
  getEmployees: () => useDemoStore.getState().employees,
  getInterns: () => useDemoStore.getState().interns,
  addEmployee: (emp: Omit<Employee, 'id' | 'projectsCount' | 'utilization' | 'joinDate' | 'status'>) => useDemoStore.getState().addEmployee(emp),
  addIntern: (intern: Omit<Intern, 'id' | 'tasksCompleted' | 'tasksPending' | 'loggedHours' | 'attendancePct' | 'trainingProgress' | 'status' | 'evaluations'>) => useDemoStore.getState().addIntern(intern)
};

export const invoiceService = {
  getInvoices: () => useDemoStore.getState().invoices,
  addInvoice: (inv: Omit<Invoice, 'id' | 'status' | 'amount' | 'tax' | 'total'>) => useDemoStore.getState().addInvoice(inv),
  markPaid: (id: string) => useDemoStore.getState().markInvoicePaid(id)
};

export const notificationService = {
  getNotifications: () => useDemoStore.getState().notifications,
  markRead: (id: string) => useDemoStore.getState().markNotificationRead(id)
};

export const aiService = {
  generateLeadSummary: async (leadInfo: string) => {
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
    return {
      summary: 'Discovery meeting with VP of Tech regarding Zendesk & Salesforce LLM assistant integration.',
      requirements: ['Sub-second latency response', '99.9% uptime SLA', 'HIPAA & SOC 2 compliance', 'Custom prompt guardrails'],
      actionItems: ['Draft SOW for 12-week Phase 1', 'Prepare dataset sample for fine-tuning demo', 'Deliver NDA agreement'],
      risks: 'High API token costs if un-optimized RAG chunking is used.',
      nextSteps: 'Send proposal by Friday.'
    };
  },
  generateProposal: async (client: string, requirement: string, budget: string) => {
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
