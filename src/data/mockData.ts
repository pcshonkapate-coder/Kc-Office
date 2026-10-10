import {
  Lead, Company, Contact, Deal, Proposal, Contract,
  Project, Task, Employee, Intern, Freelancer, ResourceAllocation,
  TimesheetEntry, AttendanceRecord, LeaveRequest, Invoice, Payment, Expense,
  Notification, ActivityLog, AppDocument, User,
  RegistrationRequest, OnboardingInvitation, SecurityEvent,
  ChatChannel, ChatMessage, CalendarEvent, KnowledgeArticle,
  AutomationRule, SupportTicket
} from '../types/index';

export const DEMO_USERS: Record<string, User> = {
  ADMIN: {
    id: 'usr-admin',
    name: 'Shon Kapate',
    email: 'admin@kapateconsultancy.in',
    role: 'SUPER_ADMIN',
    designation: 'Founder & CEO / Super Admin',
    department: 'Executive Leadership',
    kapateId: 'KAP-EMP-000001',
    internalEmail: 'admin@kapateconsultancy.in',
    status: 'ACTIVE'
  },
  PROJECT_MANAGER: {
    id: 'usr-pm',
    name: 'Technical Project Lead',
    email: 'pm@kapateconsultancy.in',
    role: 'PROJECT_MANAGER',
    designation: 'Technical Lead & Delivery PM',
    department: 'Engineering',
    kapateId: 'KAP-EMP-000002',
    internalEmail: 'pm@kapateconsultancy.in',
    status: 'ACTIVE'
  },
  EMPLOYEE: {
    id: 'usr-emp1',
    name: 'Engineering Personnel',
    email: 'engineer@kapateconsultancy.in',
    role: 'EMPLOYEE',
    designation: 'Senior Backend Developer',
    department: 'Engineering',
    kapateId: 'KAP-EMP-000003',
    internalEmail: 'engineer@kapateconsultancy.in',
    status: 'ACTIVE'
  },
  INTERN: {
    id: 'usr-intern1',
    name: 'Research Intern',
    email: 'intern@kapateconsultancy.in',
    role: 'INTERN',
    designation: 'Engineering Solutions Intern',
    department: 'Research',
    kapateId: 'KAP-INT-000001',
    internalEmail: 'intern@kapateconsultancy.in',
    status: 'ACTIVE'
  },
  CLIENT: {
    id: 'usr-client1',
    name: 'Enterprise Client',
    email: 'client@kapateconsultancy.in',
    role: 'CLIENT',
    designation: 'VP of Technology',
    department: 'Client Representative',
    status: 'ACTIVE'
  },
  FINANCE: {
    id: 'usr-finance',
    name: 'Finance Controller',
    email: 'finance@kapateconsultancy.in',
    role: 'FINANCE_ADMIN',
    designation: 'Head of Accounts & Financial Operations',
    department: 'Finance',
    kapateId: 'KAP-EMP-000004',
    internalEmail: 'finance@kapateconsultancy.in',
    status: 'ACTIVE'
  }
};

// Clean Production Initial State (Zero Fake Data)
export const INITIAL_COMPANIES: Company[] = [];

export const INITIAL_CONTACTS: Contact[] = [];

export const INITIAL_LEADS: Lead[] = [];

export const INITIAL_DEALS: Deal[] = [];

export const INITIAL_PROPOSALS: Proposal[] = [];

export const INITIAL_CONTRACTS: Contract[] = [];

export const INITIAL_PROJECTS: Project[] = [];

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'EMP-001',
    name: 'Shon Kapate',
    email: 'admin@kapateconsultancy.in',
    role: 'Founder & CEO',
    department: 'Executive Leadership',
    phone: '+91 98230 00000',
    manager: 'None (Founder)',
    skills: ['Enterprise Architecture', 'AI Solutions', 'Strategic Consulting'],
    joinDate: '2024-01-01',
    status: 'Active',
    projectsCount: 0,
    utilization: 100,
    kapateId: 'KAP-EMP-000001',
    internalEmail: 'admin@kapateconsultancy.in'
  }
];

export const INITIAL_INTERNS: Intern[] = [];

export const INITIAL_FREELANCERS: Freelancer[] = [];

export const INITIAL_RESOURCES: ResourceAllocation[] = [];

export const INITIAL_TIMESHEETS: TimesheetEntry[] = [];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_LEAVES: LeaveRequest[] = [];

export const INITIAL_INVOICES: Invoice[] = [];

export const INITIAL_PAYMENTS: Payment[] = [];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_NOTIFICATIONS: Notification[] = [];

export const INITIAL_ACTIVITIES: ActivityLog[] = [];

export const INITIAL_DOCUMENTS: AppDocument[] = [];

export const INITIAL_REGISTRATION_REQUESTS: RegistrationRequest[] = [];

export const INITIAL_ONBOARDING_INVITATIONS: OnboardingInvitation[] = [];

export const INITIAL_SECURITY_EVENTS: SecurityEvent[] = [];

export const INITIAL_CHAT_CHANNELS: ChatChannel[] = [
  {
    id: 'chan-general',
    name: 'general',
    type: 'DEPARTMENT',
    description: 'Company-wide announcements and team discussions',
    members: ['usr-admin', 'usr-pm', 'usr-emp1', 'usr-intern1', 'usr-finance'],
    unreadCount: 0,
    lastMessage: 'Welcome to Kapate OS 2.0 Operating Workspace.',
    lastMessageTimestamp: '2026-09-22T09:00:00.000Z'
  },
  {
    id: 'chan-engineering',
    name: 'engineering',
    type: 'DEPARTMENT',
    description: 'Engineering, architecture, and technology execution',
    members: ['usr-admin', 'usr-pm', 'usr-emp1'],
    unreadCount: 1,
    lastMessage: 'Production deployment pipelines synchronized.',
    lastMessageTimestamp: '2026-09-22T10:15:00.000Z'
  },
  {
    id: 'chan-leadership',
    name: 'executive-briefing',
    type: 'DIRECT',
    description: 'Executive leadership & strategic business planning',
    members: ['usr-admin', 'usr-pm', 'usr-finance'],
    unreadCount: 0,
    lastMessage: 'Q3 financial audits and client deliverables review.',
    lastMessageTimestamp: '2026-09-22T08:30:00.000Z',
    isPrivate: true
  }
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    channelId: 'chan-general',
    senderId: 'usr-admin',
    senderName: 'Shon Kapate',
    senderRole: 'SUPER_ADMIN',
    content: 'Welcome everyone to Kapate OS 2.0! All business modules, project delivery, and operations are now unified into a single operating environment.',
    timestamp: '2026-09-22T09:00:00.000Z'
  },
  {
    id: 'msg-2',
    channelId: 'chan-engineering',
    senderId: 'usr-pm',
    senderName: 'Technical Project Lead',
    senderRole: 'PROJECT_MANAGER',
    content: 'Core backend and web services have passed verification. Ready for active sprint delivery.',
    timestamp: '2026-09-22T10:15:00.000Z'
  }
];

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'cal-1',
    title: 'Daily Engineering Standup',
    type: 'MEETING',
    startDate: '2026-09-22',
    time: '10:00 AM - 10:30 AM',
    assignedTo: ['Shon Kapate', 'Technical Project Lead', 'Engineering Personnel'],
    description: 'Daily synchronization on delivery sprints, client milestones, and active blockers.',
    meetingLink: 'https://meet.google.com/kap-standup'
  },
  {
    id: 'cal-2',
    title: 'Executive Client Strategy Review',
    type: 'MEETING',
    startDate: '2026-09-23',
    time: '03:00 PM - 04:00 PM',
    assignedTo: ['Shon Kapate'],
    description: 'Quarterly enterprise architecture consultation and milestone sign-off.'
  },
  {
    id: 'cal-3',
    title: 'Sprint 4 Delivery Milestone',
    type: 'MILESTONE',
    startDate: '2026-09-25',
    time: '05:00 PM',
    assignedTo: ['Technical Project Lead'],
    description: 'Final sign-off on enterprise client delivery modules.'
  }
];

export const INITIAL_KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  {
    id: 'kb-1',
    title: 'Kapate OS 2.0 Operating Principles & SOP',
    category: 'SOP',
    tags: ['Standard', 'Operations', 'Workflow'],
    summary: 'Universal guidelines for operational rhythm, time logging, code reviews, and client deliverables.',
    content: 'All client interactions, project tasks, timesheets, and invoicing must originate within Kapate OS to maintain a single source of truth across the firm.',
    author: 'Shon Kapate',
    updatedAt: '2026-09-22',
    viewsCount: 142,
    verified: true
  },
  {
    id: 'kb-2',
    title: 'Cloud Deployment & Security Hardening Protocol',
    category: 'SECURITY',
    tags: ['Security', 'DevOps', 'Cloud'],
    summary: 'Security benchmarks for production deployments, secret rotation, and atomic backups.',
    content: 'Guidelines for zero-trust API communications, JWT token rotation, HTTPS enforcement, and atomic file storage.',
    author: 'Shon Kapate',
    updatedAt: '2026-09-21',
    viewsCount: 89,
    verified: true
  },
  {
    id: 'kb-3',
    title: 'Client Invoicing & Milestone Billing Standard',
    category: 'INVOICING',
    tags: ['Finance', 'Billing', 'Contracts'],
    summary: 'Procedure for milestone approvals, automated invoice dispatch, and payment reconciliation.',
    content: 'Invoices are automatically drafted upon contract milestone completion. GST calculations and client records are synced real-time.',
    author: 'Finance Controller',
    updatedAt: '2026-09-20',
    viewsCount: 64,
    verified: true
  }
];

export const INITIAL_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'auto-1',
    name: 'Overdue Invoice Reminder & Alert',
    description: 'Automatically alert Account Executives and Finance when an invoice is overdue by 5+ days.',
    trigger: 'INVOICE_OVERDUE',
    condition: 'invoice.dueDate < today && invoice.status == "Sent"',
    actions: ['Send email notification to client finance desk', 'Create high-priority follow-up task for Finance Controller', 'Post alert to #general chat'],
    enabled: true,
    executionCount: 12,
    lastTriggered: '2026-09-21T18:00:00.000Z'
  },
  {
    id: 'auto-2',
    name: 'Project Budget & Milestone At-Risk Watcher',
    description: 'Triggers when a project exceeds 80% allocated hours before reaching milestone sign-off.',
    trigger: 'PROJECT_AT_RISK',
    condition: 'project.spentBudget / project.budget > 0.80 && project.progress < 70',
    actions: ['Flag project status as At Risk', 'Notify Project Manager and CEO', 'Request timesheet audit'],
    enabled: true,
    executionCount: 4,
    lastTriggered: '2026-09-18T14:30:00.000Z'
  },
  {
    id: 'auto-3',
    name: 'New Inbound Lead Enrichment & Assignment',
    description: 'Auto-scores incoming leads and notifies sales desk within 2 minutes.',
    trigger: 'NEW_LEAD',
    condition: 'lead.status == "New Lead"',
    actions: ['Run AI Lead Scoring', 'Assign to primary account owner', 'Draft personalized discovery invitation'],
    enabled: true,
    executionCount: 38,
    lastTriggered: '2026-09-22T08:00:00.000Z'
  }
];

export const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'tkt-1',
    ticketNumber: 'TKT-2026-001',
    clientId: 'usr-client1',
    clientName: 'Enterprise Client',
    subject: 'Production API Rate Limit Inquiry',
    description: 'Requesting clarification on enterprise endpoint rate limits for peak hours integration.',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    assignedTo: 'Technical Project Lead',
    createdAt: '2026-09-21T11:00:00.000Z',
    updatedAt: '2026-09-22T09:30:00.000Z'
  }
];

export * from './mockMailData';
