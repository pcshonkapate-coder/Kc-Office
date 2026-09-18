import {
  Lead, Company, Contact, Deal, Proposal, Contract,
  Project, Task, Employee, Intern, Freelancer, ResourceAllocation,
  TimesheetEntry, AttendanceRecord, LeaveRequest, Invoice, Payment, Expense,
  Notification, ActivityLog, AppDocument, User,
  RegistrationRequest, OnboardingInvitation, SecurityEvent
} from '../types/index';

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
    name: 'Technical Project Lead',
    email: 'pm@kapateconsultancy.com',
    role: 'PROJECT_MANAGER',
    designation: 'Technical Lead & Delivery PM',
    department: 'Engineering',
    kapateId: 'KAP-EMP-000002',
    internalEmail: 'pm@kapateconsultancy.com',
    status: 'ACTIVE'
  },
  EMPLOYEE: {
    id: 'usr-emp1',
    name: 'Engineering Personnel',
    email: 'engineer@kapateconsultancy.com',
    role: 'EMPLOYEE',
    designation: 'Senior Backend Developer',
    department: 'Engineering',
    kapateId: 'KAP-EMP-000003',
    internalEmail: 'engineer@kapateconsultancy.com',
    status: 'ACTIVE'
  },
  INTERN: {
    id: 'usr-intern1',
    name: 'Research Intern',
    email: 'intern@kapateconsultancy.com',
    role: 'INTERN',
    designation: 'Engineering Solutions Intern',
    department: 'Research',
    kapateId: 'KAP-INT-000001',
    internalEmail: 'intern@kapateconsultancy.com',
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
    email: 'shon@kapateconsultancy.com',
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
    internalEmail: 'shon@kapateconsultancy.com'
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

export * from './mockMailData';
