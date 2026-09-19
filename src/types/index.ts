export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'ADMIN' 
  | 'HR_ADMIN' 
  | 'FINANCE_ADMIN' 
  | 'PROJECT_MANAGER' 
  | 'EMPLOYEE' 
  | 'INTERN' 
  | 'CLIENT' 
  | 'FINANCE';

export type AccountStatus = 'INVITED' | 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DISABLED' | 'TERMINATED' | 'LOCKED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  designation?: string;
  kapateId?: string;
  internalEmail?: string;
  status?: AccountStatus;
  phone?: string;
  manager?: string;
  skills?: string[];
  assignedProjects?: string[];
  customPermissions?: string[];
  failedLogins?: number;
  lockedUntil?: string | null;
  lastLoginAt?: string;
  mfaEnabled?: boolean;
  passwordHash?: string;
  created?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export type LeadStatus = 'New Lead' | 'Qualified' | 'Discovery Booked' | 'Discovery Completed' | 'Proposal Sent' | 'Unqualified' | 'Lost';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  budget: string;
  source: string;
  owner: string;
  status: LeadStatus;
  score: number;
  description: string;
  created: string;
  nextFollowUp: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  website: string;
  location: string;
  contactsCount: number;
  dealsCount: number;
  activeProjects: number;
  totalRevenue: string;
  contacts: Contact[];
}

export interface Contact {
  id: string;
  name: string;
  designation: string;
  company: string;
  email: string;
  phone: string;
  relationship: 'Key Decision Maker' | 'Technical Evaluator' | 'Billing Contact' | 'Executive Sponsor';
  lastContacted: string;
  owner: string;
}

export type DealStage = 
  | 'NEW LEAD'
  | 'QUALIFICATION'
  | 'DISCOVERY BOOKED'
  | 'DISCOVERY COMPLETED'
  | 'TECHNICAL ASSESSMENT'
  | 'NDA / MSA'
  | 'PROPOSAL / SOW'
  | 'NEGOTIATION'
  | 'CLOSED WON'
  | 'CLOSED LOST';

export interface Deal {
  id: string;
  title: string;
  company: string;
  contact: string;
  value: number;
  stage: DealStage;
  owner: string;
  expectedClose: string;
  probability: number;
  service: string;
  created: string;
}

export type ProposalStatus = 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected' | 'Expired';

export interface Proposal {
  id: string;
  title: string;
  client: string;
  project: string;
  value: number;
  created: string;
  expiry: string;
  status: ProposalStatus;
  executiveSummary: string;
  scope: string[];
  deliverables: string[];
  technology: string[];
  timeline: string;
  pricing: { phase: string; amount: number }[];
}

export type ContractStatus = 'Draft' | 'Sent' | 'Viewed' | 'Signed' | 'Expired';
export type ContractType = 'NDA' | 'MSA' | 'SOW' | 'Master Contract';

export interface Contract {
  id: string;
  title: string;
  type: ContractType;
  client: string;
  status: ContractStatus;
  createdDate: string;
  signedDate?: string;
  value?: number;
  timeline: { event: string; date: string; completed: boolean }[];
}

export type ProjectStatus = 'Planning' | 'In Progress' | 'On Hold' | 'Testing' | 'Completed';

export interface Milestone {
  id: string;
  name: string;
  progress: number;
  dueDate: string;
  status: 'Completed' | 'In Progress' | 'Pending';
}

export interface Project {
  id: string;
  name: string;
  client: string;
  manager: string;
  progress: number;
  budget: number;
  spentBudget: number;
  deadline: string;
  status: ProjectStatus;
  description: string;
  team: string[];
  milestones: Milestone[];
  profitability: {
    revenue: number;
    employeeCost: number;
    cloudCost: number;
    aiApiCost: number;
    otherCost: number;
    grossProfit: number;
    grossMargin: number;
    alertMessage?: string;
  };
}

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'TODO' | 'IN PROGRESS' | 'IN REVIEW' | 'CHANGES REQUESTED' | 'BLOCKED' | 'COMPLETED';

export interface Task {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  assignedTo: string;
  assigneeAvatar?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  estimatedHours: number;
  loggedHours: number;
  description: string;
  clientVisible?: boolean;
  assigneeRole?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  email: string;
  phone: string;
  manager: string;
  skills: string[];
  projectsCount: number;
  utilization: number;
  joinDate: string;
  kapateId?: string;
  internalEmail?: string;
}

export interface Intern {
  id: string;
  name: string;
  role: string;
  college: string;
  mentor: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Completed';
  email: string;
  tasksCompleted: number;
  tasksPending: number;
  loggedHours: number;
  attendancePct: number;
  trainingProgress: number;
  mentorFeedback: string;
  evaluations: {
    technicalSkills: number;
    problemSolving: number;
    communication: number;
    teamwork: number;
    learning: number;
    taskCompletion: number;
  };
  kapateId?: string;
  internalEmail?: string;
}

export interface Freelancer {
  id: string;
  name: string;
  skill: string;
  projects: string[];
  hourlyRate: string;
  availability: string;
  status: 'Active' | 'Available' | 'On Contract';
  kapateId?: string;
  internalEmail?: string;
}

export interface ResourceAllocation {
  id: string;
  projectName: string;
  allocations: {
    name: string;
    role: string;
    percentage: number;
    allocatedHours: number;
  }[];
}

export type TimesheetStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected';

export interface TimesheetEntry {
  id: string;
  date: string;
  day: string;
  projectName: string;
  taskName: string;
  hours: number;
  isBillable: boolean;
  description: string;
  status: TimesheetStatus;
  employeeName: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  employeeName: string;
  status: 'Present' | 'Absent' | 'WFH' | 'Leave';
  checkIn: string;
  checkOut: string;
  totalHours: number;
}

export interface LeaveRequest {
  id: string;
  employeeName: string;
  leaveType: 'Casual Leave' | 'Sick Leave' | 'Earned Leave' | 'Unpaid Leave';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Partially Paid' | 'Overdue';

export interface InvoiceItem {
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  client: string;
  projectName: string;
  amount: number;
  tax: number;
  total: number;
  dueDate: string;
  status: InvoiceStatus;
  billingAddress: string;
  gstin: string;
  items: InvoiceItem[];
  paymentReference?: string;
  paidDate?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  client: string;
  amount: number;
  date: string;
  method: 'UPI' | 'Bank Transfer' | 'Credit Card' | 'Wire';
  reference: string;
}

export interface Expense {
  id: string;
  vendor: string;
  category: 'Cloud Infrastructure' | 'AI Model APIs' | 'GPU Compute' | 'Software Licenses' | 'Subcontractors' | 'Office & Admin';
  amount: number;
  date: string;
  projectName?: string;
  status: 'Paid' | 'Pending';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  time?: string;
  read: boolean;
  type: 'lead' | 'task' | 'invoice' | 'timesheet' | 'project' | 'leave' | 'system';
}

export interface ActivityLog {
  id: string;
  entityType: string;
  entityId: string;
  entityName: string;
  date: string;
  action: string;
  user: string;
}

export interface AppDocument {
  id: string;
  title: string;
  category: 'Contracts' | 'Proposals' | 'NDA' | 'SOW' | 'Invoices' | 'Project Documents' | 'HR Documents';
  fileType: 'PDF' | 'DOCX' | 'ZIP';
  owner: string;
  date: string;
  relatedEntity: string;
  size: string;
}

// ==================== INTERNAL MAIL SYSTEM ====================

export type MailFolder = 'INBOX' | 'SENT' | 'DRAFTS' | 'STARRED' | 'IMPORTANT' | 'ARCHIVE' | 'TRASH' | 'SPAM';
export type EmailPriority = 'Normal' | 'Important' | 'Urgent';

export interface EmailAttachment {
  id: string;
  filename: string;
  size: string;
  fileType: 'PDF' | 'DOCX' | 'ZIP' | 'IMAGE' | 'SHEET';
  url: string;
}

export interface EmailRecipient {
  name: string;
  email: string;
  role?: string;
  department?: string;
  avatar?: string;
  type?: 'TO' | 'CC' | 'BCC';
}

export interface EmailMessage {
  id: string;
  threadId: string;
  from: EmailRecipient;
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  body: string;
  snippet: string;
  timestamp: string;
  date: string;
  folder: MailFolder;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  priority: EmailPriority;
  labels: string[];
  attachments: EmailAttachment[];
  relatedProjectId?: string;
  relatedProjectName?: string;
  relatedDealId?: string;
  relatedContactEmail?: string;
  createdTaskId?: string;
}

export interface EmailThread {
  id: string;
  subject: string;
  snippet: string;
  lastMessageTimestamp: string;
  lastSenderName: string;
  messageCount: number;
  unreadCount?: number;
  participants: EmailRecipient[];
  isUnread: boolean;
  isStarred: boolean;
  isImportant: boolean;
  priority: EmailPriority;
  labels: string[];
  folder: MailFolder;
  hasAttachments: boolean;
  messages: EmailMessage[];
  relatedProjectId?: string;
  relatedProjectName?: string;
  relatedDealId?: string;
  relatedContactEmail?: string;
}

export interface EmailAccount {
  id: string;
  userId: string;
  email: string;
  name: string;
  designation: string;
  department: string;
  avatar?: string;
  isShared: boolean;
  allowedRoles?: string[];
  quotaUsedMB: number;
  quotaTotalMB: number;
}

export interface EmailTemplate {
  id: string;
  title: string;
  category: 'HR' | 'Sales' | 'Projects' | 'Finance' | 'General';
  subject: string;
  body: string;
  variables: string[];
}

export interface EmailSignature {
  id: string;
  userId: string;
  title: string;
  content: string;
  isDefault: boolean;
}

export interface EmailLabel {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface RegistrationRequest {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  applicationId?: string;
  requestedType: 'EMPLOYEE' | 'INTERN' | 'FREELANCER';
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  notes?: string;
  rejectionReason?: string;
  created: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface OnboardingInvitation {
  id: string;
  token: string;
  email: string;
  fullName: string;
  assignedRole: UserRole;
  department: string;
  manager: string;
  designation: string;
  employmentType: 'EMPLOYEE' | 'INTERN' | 'FREELANCER';
  kapateId: string;
  internalEmail: string;
  expiresAt: string;
  isUsed: boolean;
  isRevoked: boolean;
  created: string;
}

export interface SecurityEvent {
  id: string;
  action: string;
  actor: string;
  target: string;
  timestamp: string;
  details: string;
  severity: 'info' | 'warning' | 'alert' | 'success';
  ipAddress?: string;
}

// ==================== SUPER ADMIN & ENTERPRISE GOVERNANCE ====================

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export';

export type PermissionModule = 
  | 'crm' 
  | 'projects' 
  | 'finance' 
  | 'workforce' 
  | 'interns' 
  | 'mail' 
  | 'security' 
  | 'documents'
  | 'system';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorKapateId?: string;
  actorName?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  module: string;
  resource?: string;
  targetResource?: string;
  targetUser?: string;
  targetLabel?: string;
  details?: string;
  severity?: 'info' | 'warning' | 'critical' | 'alert';
  previousValue?: string | null;
  newValue?: string | null;
  ipAddress?: string;
  userAgent?: string;
  result: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  requestId?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface SecuritySession {
  id: string;
  userId: string;
  userName: string;
  email: string;
  userEmail?: string;
  role: UserRole;
  ipAddress: string;
  userAgent: string;
  browser?: string;
  device?: string;
  location?: string;
  loginAt: string;
  lastActiveAt: string;
  isImpersonated: boolean;
  impersonatedBy?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}

export interface SystemSettings {
  organization: {
    companyName: string;
    domain: string;
    supportEmail: string;
    hqAddress: string;
    gstin: string;
    fiscalYearStart: string;
    currency: string;
  };
  authentication: {
    sessionDurationHours: number;
    maxLoginAttempts: number;
    accountLockoutMinutes: number;
    mfaEnforced: boolean;
    requirePasswordResetDays: number;
    minPasswordLength: number;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    senderEmail: string;
    senderName: string;
    notificationsEnabled: boolean;
  };
  finance: {
    defaultTaxRate: number;
    invoicePrefix: string;
    paymentTermsDays: number;
    gstThresholdAmount: number;
  };
  notifications: {
    taskAssigned: boolean;
    invoiceOverdue: boolean;
    securityAlerts: boolean;
    dailyDigest: boolean;
  };
  ai: {
    enabled: boolean;
    provider: 'gemini' | 'openai' | 'anthropic';
    model: string;
    enableSummarizer: boolean;
    enableSmartReply: boolean;
    enableEstimates: boolean;
    monthlyTokenLimit: number;
    tokensUsedThisMonth: number;
  };
  storage: {
    maxUploadSizeMB: number;
    allowedTypes: string[];
    backupRetentionDays: number;
    autoBackupEnabled: boolean;
  };
}

export interface ComponentHealth {
  name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  latencyMs: number;
  message?: string;
  lastChecked: string;
}

export interface SystemHealthStatus {
  overall: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  uptimeSeconds: number;
  lastChecked: string;
  components: ComponentHealth[];
  databaseStats: {
    type: string;
    connectionsActive: number;
    pingStatus: string;
    collectionsCount: number;
  };
  memoryUsage: {
    heapUsedMB: number;
    heapTotalMB: number;
  };
}

export interface SuperAdminStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  employeesCount: number;
  internsCount: number;
  clientsCount: number;
  activeProjects: number;
  completedProjects: number;
  openTasks: number;
  overdueTasks: number;
  activeLeads: number;
  wonDeals: number;
  totalRevenue: number;
  outstandingInvoices: number;
  overdueInvoices: number;
  totalExpenses: number;
  systemAlertsCount: number;
  activeSessionsCount: number;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
}



