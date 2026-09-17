import {
  Lead, Company, Contact, Deal, Proposal, Contract,
  Project, Task, Employee, Intern, Freelancer, ResourceAllocation,
  TimesheetEntry, AttendanceRecord, LeaveRequest, Invoice, Payment, Expense,
  Notification, ActivityLog, AppDocument, User,
  RegistrationRequest, OnboardingInvitation, SecurityEvent
} from '../types';

export const DEMO_USERS: Record<string, User> = {
  ADMIN: {
    id: 'usr-admin',
    name: 'Shon Kapate',
    email: 'shon@kapateconsultancy.com',
    role: 'ADMIN',
    designation: 'Founder & CEO / Super Admin',
    department: 'Management',
    kapateId: 'KAP-EMP-000001',
    internalEmail: 'shon@kapateconsultancy.com',
    status: 'ACTIVE'
  },
  PROJECT_MANAGER: {
    id: 'usr-pm',
    name: 'Amit Patil',
    email: 'amit@kapateconsultancy.com',
    role: 'PROJECT_MANAGER',
    designation: 'Technical Lead & Delivery PM',
    department: 'Engineering',
    kapateId: 'KAP-EMP-000002',
    internalEmail: 'amit@kapateconsultancy.com',
    status: 'ACTIVE'
  },
  EMPLOYEE: {
    id: 'usr-emp1',
    name: 'Rahul Deshmukh',
    email: 'rahul@kapateconsultancy.com',
    role: 'EMPLOYEE',
    designation: 'Senior Backend Developer',
    department: 'Engineering',
    kapateId: 'KAP-EMP-000003',
    internalEmail: 'rahul@kapateconsultancy.com',
    status: 'ACTIVE'
  },
  INTERN: {
    id: 'usr-intern1',
    name: 'Riya Sharma',
    email: 'riya@kapateconsultancy.com',
    role: 'INTERN',
    designation: 'AI/ML Research Intern',
    department: 'AI/ML',
    kapateId: 'KAP-INT-000001',
    internalEmail: 'riya@kapateconsultancy.com',
    status: 'ACTIVE'
  },
  CLIENT: {
    id: 'usr-client1',
    name: 'Enterprise Client',
    email: 'client@enterprise.com',
    role: 'CLIENT',
    designation: 'VP of Technology',
    department: 'Client Representative',
    status: 'ACTIVE'
  },
  FINANCE: {
    id: 'usr-finance',
    name: 'Finance Controller',
    email: 'finance@kapateconsultancy.com',
    role: 'FINANCE_ADMIN',
    designation: 'Head of Accounts & Financial Operations',
    department: 'Finance',
    kapateId: 'KAP-EMP-000004',
    internalEmail: 'finance@kapateconsultancy.com',
    status: 'ACTIVE'
  }
};

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'COMP-001',
    name: 'InnovateTech Pvt Ltd',
    industry: 'Fintech & Digital Payments',
    location: 'Bengaluru, India',
    website: 'https://innovatetech.io',
    contactsCount: 4,
    dealsCount: 2,
    activeProjects: 1,
    totalRevenue: '₹35,00,000',
    contacts: []
  },
  {
    id: 'COMP-002',
    name: 'RetailOS Solutions',
    industry: 'E-Commerce & Supply Chain',
    location: 'Mumbai, India',
    website: 'https://retailos.in',
    contactsCount: 3,
    dealsCount: 1,
    activeProjects: 1,
    totalRevenue: '₹22,00,000',
    contacts: []
  },
  {
    id: 'COMP-003',
    name: 'HealthTrack Global',
    industry: 'Healthcare & Diagnostics',
    location: 'Hyderabad, India',
    website: 'https://healthtrack.global',
    contactsCount: 2,
    dealsCount: 1,
    activeProjects: 1,
    totalRevenue: '₹18,00,000',
    contacts: []
  }
];

export const INITIAL_LEADS: Lead[] = [];
export const INITIAL_CONTACTS: Contact[] = [];
export const INITIAL_DEALS: Deal[] = [];
export const INITIAL_PROPOSALS: Proposal[] = [];
export const INITIAL_CONTRACTS: Contract[] = [];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'PRJ-001',
    name: 'Project Nexus — AI Banking Gateway',
    client: 'InnovateTech Pvt Ltd',
    manager: 'Shon Kapate',
    progress: 75,
    budget: 1500000,
    spentBudget: 1125000,
    deadline: '2026-10-31',
    status: 'In Progress',
    description: 'Autonomous financial gateway with automated fraud screening, payment webhooks, and sub-100ms API routing.',
    team: ['Shon Kapate (Manager)', 'Delivery Manager', 'Engineering Lead', 'Research Intern'],
    milestones: [
      { id: 'M-1', name: 'Phase 1: Architecture & API Gateway Prototype', progress: 100, dueDate: '2026-08-15', status: 'Completed' },
      { id: 'M-2', name: 'Phase 2: Payment Gateway & UAT Deployment', progress: 80, dueDate: '2026-09-30', status: 'In Progress' },
      { id: 'M-3', name: 'Phase 3: Production Security Hardening & Go-Live', progress: 0, dueDate: '2026-10-31', status: 'Pending' }
    ],
    profitability: {
      revenue: 1500000,
      employeeCost: 520000,
      cloudCost: 65000,
      aiApiCost: 45000,
      otherCost: 20000,
      grossProfit: 850000,
      grossMargin: 56.67
    }
  },
  {
    id: 'PRJ-002',
    name: 'RetailOS Cloud Modernization',
    client: 'RetailOS Solutions',
    manager: 'Delivery Manager',
    progress: 40,
    budget: 2200000,
    spentBudget: 880000,
    deadline: '2026-11-15',
    status: 'In Progress',
    description: 'Omnichannel inventory sync engine with real-time multi-warehouse catalog balancing.',
    team: ['Delivery Manager', 'Engineering Lead'],
    milestones: [
      { id: 'M-1', name: 'Data Pipeline & Schema Normalization', progress: 100, dueDate: '2026-08-30', status: 'Completed' },
      { id: 'M-2', name: 'Warehouse Distributed Sync Engine', progress: 30, dueDate: '2026-10-15', status: 'In Progress' }
    ],
    profitability: {
      revenue: 2200000,
      employeeCost: 780000,
      cloudCost: 95000,
      aiApiCost: 15000,
      otherCost: 30000,
      grossProfit: 1280000,
      grossMargin: 58.18
    }
  },
  {
    id: 'PRJ-003',
    name: 'HealthTrack Analytics Platform',
    client: 'HealthTrack Global',
    manager: 'Delivery Manager',
    progress: 90,
    budget: 1800000,
    spentBudget: 1620000,
    deadline: '2026-09-30',
    status: 'Testing',
    description: 'HIPAA-compliant predictive analytics engine for patient clinical outcome forecasts.',
    team: ['Delivery Manager', 'Research Intern'],
    milestones: [
      { id: 'M-1', name: 'Model Training & Validation Benchmarks', progress: 100, dueDate: '2026-07-31', status: 'Completed' },
      { id: 'M-2', name: 'Clinical Dashboard & Final Acceptance', progress: 85, dueDate: '2026-09-30', status: 'In Progress' }
    ],
    profitability: {
      revenue: 1800000,
      employeeCost: 610000,
      cloudCost: 80000,
      aiApiCost: 90000,
      otherCost: 25000,
      grossProfit: 995000,
      grossMargin: 55.28
    }
  }
];

export const INITIAL_TASKS: Task[] = [
  // ==================== ASSIGNED TO MANAGERS ====================
  {
    id: 'TSK-101',
    title: 'Sprint 4 Architecture & Security Sign-Off',
    projectId: 'PRJ-001',
    projectName: 'Project Nexus',
    assignedTo: 'Shon Kapate (Manager)',
    priority: 'Urgent',
    status: 'IN PROGRESS',
    dueDate: '2026-09-22',
    estimatedHours: 8,
    loggedHours: 3.5,
    description: 'Review threat modeling, OWASP compliance report, and sign off on microservice architecture before prod launch.',
    clientVisible: false,
    assigneeRole: 'MANAGER'
  },
  {
    id: 'TSK-102',
    title: 'Client Budget Variance & Milestone Audit',
    projectId: 'PRJ-001',
    projectName: 'Project Nexus',
    assignedTo: 'Delivery Manager',
    priority: 'High',
    status: 'TODO',
    dueDate: '2026-09-25',
    estimatedHours: 6,
    loggedHours: 0,
    description: 'Conduct quarterly budget variance audit and reconcile engineer timesheets against contract caps.',
    clientVisible: false,
    assigneeRole: 'MANAGER'
  },
  {
    id: 'TSK-103',
    title: 'Client SLA & Resource Allocation Review',
    projectId: 'PRJ-002',
    projectName: 'RetailOS Cloud',
    assignedTo: 'Delivery Manager',
    priority: 'Medium',
    status: 'IN REVIEW',
    dueDate: '2026-09-28',
    estimatedHours: 5,
    loggedHours: 4,
    description: 'Evaluate engineer allocations across Phase 2 deliverables and align weekly sprint burn-down.',
    clientVisible: false,
    assigneeRole: 'MANAGER'
  },

  // ==================== ASSIGNED TO / VISIBLE TO CLIENTS ====================
  {
    id: 'TSK-201',
    title: 'UAT Milestone Review & Phase 2 Sign-Off',
    projectId: 'PRJ-001',
    projectName: 'Project Nexus',
    assignedTo: 'Enterprise Client',
    priority: 'Urgent',
    status: 'IN REVIEW',
    dueDate: '2026-09-24',
    estimatedHours: 4,
    loggedHours: 2,
    description: 'Enterprise client executive review of payment gateway integration and staging environment sign-off.',
    clientVisible: true,
    assigneeRole: 'CLIENT'
  },
  {
    id: 'TSK-202',
    title: 'Provide Production SSO SAML Metadata & Certs',
    projectId: 'PRJ-001',
    projectName: 'Project Nexus',
    assignedTo: 'Enterprise Client',
    priority: 'High',
    status: 'TODO',
    dueDate: '2026-09-30',
    estimatedHours: 2,
    loggedHours: 0,
    description: 'Supply Okta/Azure AD IdP metadata XML and client certificate for production single sign-on.',
    clientVisible: true,
    assigneeRole: 'CLIENT'
  },
  {
    id: 'TSK-203',
    title: 'Brand Assets & White-Label UI Theme Approval',
    projectId: 'PRJ-001',
    projectName: 'Project Nexus',
    assignedTo: 'Enterprise Client',
    priority: 'Medium',
    status: 'COMPLETED',
    dueDate: '2026-09-15',
    estimatedHours: 3,
    loggedHours: 3,
    description: 'Sign-off on enterprise color tokens, white-label logo sizing, and typography hierarchy.',
    clientVisible: true,
    assigneeRole: 'CLIENT'
  },

  // ==================== ENGINEERING & DELIVERY TASKS ====================
  {
    id: 'TSK-301',
    title: 'Integrate Payment Gateway Webhooks (Razorpay & Stripe)',
    projectId: 'PRJ-001',
    projectName: 'Project Nexus',
    assignedTo: 'Engineering Lead',
    priority: 'High',
    status: 'COMPLETED',
    dueDate: '2026-09-18',
    estimatedHours: 24,
    loggedHours: 24,
    description: 'Set up Razorpay and Stripe webhooks with idempotency keys, error handling, and transaction retry policies.',
    clientVisible: false,
    assigneeRole: 'ENGINEER'
  },
  {
    id: 'TSK-302',
    title: 'Write Unit Tests for Auth & RBAC Guards',
    projectId: 'PRJ-002',
    projectName: 'RetailOS Cloud',
    assignedTo: 'Engineering Lead',
    priority: 'Medium',
    status: 'IN PROGRESS',
    dueDate: '2026-09-26',
    estimatedHours: 16,
    loggedHours: 8,
    description: 'Cover edge cases in JWT refresh tokens and role-based route guards across all API endpoints.',
    clientVisible: false,
    assigneeRole: 'ENGINEER'
  },
  {
    id: 'TSK-303',
    title: 'Optimize Database Indexes for Executive Reports',
    projectId: 'PRJ-001',
    projectName: 'Project Nexus',
    assignedTo: 'Research Intern',
    priority: 'Low',
    status: 'CHANGES REQUESTED',
    dueDate: '2026-09-29',
    estimatedHours: 18,
    loggedHours: 12,
    description: 'Add indexes on tenant_id and timestamp, and cache aggregated financial summary views.',
    clientVisible: false,
    assigneeRole: 'INTERN'
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [];
export const INITIAL_INTERNS: Intern[] = [];
export const INITIAL_FREELANCERS: Freelancer[] = [];
export const INITIAL_RESOURCES: ResourceAllocation[] = [];
export const INITIAL_TIMESHEETS: TimesheetEntry[] = [];
export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];
export const INITIAL_LEAVES: LeaveRequest[] = [];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'INV-2026-001',
    client: 'InnovateTech Pvt Ltd',
    amount: 500000,
    tax: 90000,
    total: 590000,
    status: 'Paid',
    dueDate: '2026-08-31',
    billingAddress: 'Tower B, Tech Park, Bangalore',
    gstin: '29ABCDE1234F1Z5',
    projectName: 'Project Nexus',
    items: [{ description: 'Phase 1 Architecture Sign-Off', qty: 1, rate: 500000, amount: 500000 }]
  },
  {
    id: 'INV-2026-002',
    client: 'InnovateTech Pvt Ltd',
    amount: 600000,
    tax: 108000,
    total: 708000,
    status: 'Sent',
    dueDate: '2026-10-05',
    billingAddress: 'Tower B, Tech Park, Bangalore',
    gstin: '29ABCDE1234F1Z5',
    projectName: 'Project Nexus',
    items: [{ description: 'Phase 2 Payment Gateway & UAT Delivery', qty: 1, rate: 600000, amount: 600000 }]
  }
];

export const INITIAL_PAYMENTS: Payment[] = [];
export const INITIAL_EXPENSES: Expense[] = [];
export const INITIAL_NOTIFICATIONS: Notification[] = [];
export const INITIAL_ACTIVITIES: ActivityLog[] = [];

export const INITIAL_DOCUMENTS: AppDocument[] = [
  {
    id: 'DOC-001',
    title: 'Master Services Agreement (MSA) — Project Nexus',
    category: 'Contracts',
    fileType: 'PDF',
    size: '1.8 MB',
    date: '2026-08-01',
    relatedEntity: 'InnovateTech Pvt Ltd',
    owner: 'Legal Team'
  },
  {
    id: 'DOC-002',
    title: 'Statement of Work (SOW) Phase 2',
    category: 'SOW',
    fileType: 'PDF',
    size: '2.4 MB',
    date: '2026-09-01',
    relatedEntity: 'InnovateTech Pvt Ltd',
    owner: 'Delivery PM'
  }
];

export const INITIAL_REGISTRATION_REQUESTS: RegistrationRequest[] = [
  {
    id: 'REQ-001',
    fullName: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    phone: '+91 98765 11223',
    applicationId: 'APP-2026-088',
    requestedType: 'EMPLOYEE',
    status: 'PENDING',
    notes: 'Senior Backend Engineer applicant with 5 years Go and Python experience.',
    created: '2026-09-17'
  },
  {
    id: 'REQ-002',
    fullName: 'Neha Gupta',
    email: 'neha.intern@university.edu',
    phone: '+91 98222 33445',
    applicationId: 'APP-2026-102',
    requestedType: 'INTERN',
    status: 'PENDING',
    notes: 'B.Tech AI/ML final year student, verified academic project submission.',
    created: '2026-09-17'
  },
  {
    id: 'REQ-003',
    fullName: 'Alex Mercer',
    email: 'alex.mercer@cloudcontract.io',
    phone: '+91 97111 55667',
    applicationId: 'APP-2026-054',
    requestedType: 'FREELANCER',
    status: 'UNDER_REVIEW',
    notes: 'Kubernetes & FinOps security contractor. NDA pending review.',
    created: '2026-09-16'
  }
];

export const INITIAL_ONBOARDING_INVITATIONS: OnboardingInvitation[] = [
  {
    id: 'INV-001',
    token: 'inv_tok_vikram789',
    email: 'vikram@kapateconsultancy.com',
    fullName: 'Vikram Malhotra',
    assignedRole: 'EMPLOYEE',
    department: 'Engineering',
    manager: 'Amit Patil',
    designation: 'Cloud Infrastructure Specialist',
    employmentType: 'EMPLOYEE',
    kapateId: 'KAP-EMP-000005',
    internalEmail: 'vikram@kapateconsultancy.com',
    expiresAt: '2026-09-20T18:00:00Z',
    isUsed: false,
    isRevoked: false,
    created: '2026-09-17'
  },
  {
    id: 'INV-002',
    token: 'inv_tok_sneha456',
    email: 'sneha@kapateconsultancy.com',
    fullName: 'Sneha Patel',
    assignedRole: 'INTERN',
    department: 'Design',
    manager: 'Amit Patil',
    designation: 'UX Systems Intern',
    employmentType: 'INTERN',
    kapateId: 'KAP-INT-000002',
    internalEmail: 'sneha@kapateconsultancy.com',
    expiresAt: '2026-09-21T12:00:00Z',
    isUsed: false,
    isRevoked: false,
    created: '2026-09-17'
  }
];

export const INITIAL_SECURITY_EVENTS: SecurityEvent[] = [
  {
    id: 'SEC-001',
    action: 'REGISTRATION_REQUEST_CREATED',
    actor: 'Public Portal',
    target: 'Rahul Sharma (rahul.sharma@example.com)',
    details: 'New applicant submitted onboarding request. Status assigned: PENDING. Privilege assignment locked.',
    severity: 'info',
    timestamp: '2026-09-17 19:40'
  },
  {
    id: 'SEC-002',
    action: 'INVITATION_ISSUED',
    actor: 'Shon Kapate (Founder / Admin)',
    target: 'Vikram Malhotra',
    details: 'Generated single-use cryptographic invitation for role EMPLOYEE with Kapate ID KAP-EMP-000005.',
    severity: 'success',
    timestamp: '2026-09-17 19:15'
  },
  {
    id: 'SEC-003',
    action: 'RBAC_POLICIES_ENFORCED',
    actor: 'Kernel RBAC Engine',
    target: 'Amit Patil (PROJECT_MANAGER)',
    details: 'Validated scope for Project Nexus task board and client communications.',
    severity: 'info',
    timestamp: '2026-09-17 18:30'
  },
  {
    id: 'SEC-004',
    action: 'PRIVILEGE_ESCALATION_ATTEMPT_BLOCKED',
    actor: 'External Origin 185.220.101.5',
    target: '/api/v1/auth/register-admin',
    details: 'Attempted access to non-existent admin creation route. Request rejected with HTTP 404/403.',
    severity: 'alert',
    timestamp: '2026-09-17 17:10'
  }
];

export * from './mockMailData';


