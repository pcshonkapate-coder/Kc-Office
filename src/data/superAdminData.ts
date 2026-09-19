import {
  User, UserRole, AuditLogEntry, SecuritySession, SystemSettings,
  SystemHealthStatus, PermissionAction, PermissionModule
} from '../types';

export interface PermissionDefinition {
  module: PermissionModule;
  label: string;
  action: PermissionAction;
  code: string;
  description: string;
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // CRM
  { module: 'crm', label: 'CRM Leads & Pipeline', action: 'view', code: 'crm.view', description: 'View leads, deals, pipeline stages and customer accounts' },
  { module: 'crm', label: 'CRM Leads & Pipeline', action: 'create', code: 'crm.create', description: 'Create new leads, deals, and customer contacts' },
  { module: 'crm', label: 'CRM Leads & Pipeline', action: 'edit', code: 'crm.edit', description: 'Update deal values, notes, and stages' },
  { module: 'crm', label: 'CRM Leads & Pipeline', action: 'delete', code: 'crm.delete', description: 'Delete leads and archival contacts' },
  { module: 'crm', label: 'CRM Leads & Pipeline', action: 'approve', code: 'crm.approve', description: 'Approve custom proposal terms and discounts' },
  { module: 'crm', label: 'CRM Leads & Pipeline', action: 'export', code: 'crm.export', description: 'Export client lists and deal forecasts to CSV/PDF' },

  // Projects
  { module: 'projects', label: 'Project Delivery & Sprints', action: 'view', code: 'projects.view', description: 'View project timelines, tasks, and sprint roadmaps' },
  { module: 'projects', label: 'Project Delivery & Sprints', action: 'create', code: 'projects.create', description: 'Create new project delivery workspaces and tasks' },
  { module: 'projects', label: 'Project Delivery & Sprints', action: 'edit', code: 'projects.edit', description: 'Edit task status, assignees, deadlines, and story points' },
  { module: 'projects', label: 'Project Delivery & Sprints', action: 'delete', code: 'projects.delete', description: 'Delete projects or sprint tasks' },
  { module: 'projects', label: 'Project Delivery & Sprints', action: 'approve', code: 'projects.approve', description: 'Sign off milestones and sprint delivery deliverables' },
  { module: 'projects', label: 'Project Delivery & Sprints', action: 'export', code: 'projects.export', description: 'Export project burndown charts and progress summaries' },

  // Finance
  { module: 'finance', label: 'Finance & Invoicing', action: 'view', code: 'finance.view', description: 'View GST tax invoices, billing ledgers, and expenses' },
  { module: 'finance', label: 'Finance & Invoicing', action: 'create', code: 'finance.create', description: 'Generate GST-compliant tax invoices and log expenses' },
  { module: 'finance', label: 'Finance & Invoicing', action: 'edit', code: 'finance.edit', description: 'Modify billing addresses, line items, and payment notes' },
  { module: 'finance', label: 'Finance & Invoicing', action: 'delete', code: 'finance.delete', description: 'Void or remove draft invoices' },
  { module: 'finance', label: 'Finance & Invoicing', action: 'approve', code: 'finance.approve', description: 'Approve high-value invoices and payment reconciliations' },
  { module: 'finance', label: 'Finance & Invoicing', action: 'export', code: 'finance.export', description: 'Export GST reports, audit sheets, and P&L statements' },

  // Workforce & HR
  { module: 'workforce', label: 'Workforce & HR Directory', action: 'view', code: 'workforce.view', description: 'View employee directory, skills, and department roster' },
  { module: 'workforce', label: 'Workforce & HR Directory', action: 'create', code: 'workforce.create', description: 'Onboard new personnel and create employee profiles' },
  { module: 'workforce', label: 'Workforce & HR Directory', action: 'edit', code: 'workforce.edit', description: 'Update employee roles, designations, and managers' },
  { module: 'workforce', label: 'Workforce & HR Directory', action: 'delete', code: 'workforce.delete', description: 'Offboard or deactivate personnel profiles' },
  { module: 'workforce', label: 'Workforce & HR Directory', action: 'approve', code: 'workforce.approve', description: 'Approve timesheets, leave requests, and allocations' },
  { module: 'workforce', label: 'Workforce & HR Directory', action: 'export', code: 'workforce.export', description: 'Export HR utilization and headcount reports' },

  // Intern Hub
  { module: 'interns', label: 'Intern Mentorship Hub', action: 'view', code: 'interns.view', description: 'View intern roadmaps, weekly logs, and learning progress' },
  { module: 'interns', label: 'Intern Mentorship Hub', action: 'create', code: 'interns.create', description: 'Assign learning tasks and create training roadmaps' },
  { module: 'interns', label: 'Intern Mentorship Hub', action: 'edit', code: 'interns.edit', description: 'Score weekly evaluations and update mentor feedback' },
  { module: 'interns', label: 'Intern Mentorship Hub', action: 'delete', code: 'interns.delete', description: 'Remove intern profiles upon program completion' },
  { module: 'interns', label: 'Intern Mentorship Hub', action: 'approve', code: 'interns.approve', description: 'Sign off verified Certificates of Completion' },
  { module: 'interns', label: 'Intern Mentorship Hub', action: 'export', code: 'interns.export', description: 'Export intern cohort performance evaluations' },

  // Internal Mail
  { module: 'mail', label: 'Internal Mail Desk', action: 'view', code: 'mail.view', description: 'Access internal corporate mailbox and thread history' },
  { module: 'mail', label: 'Internal Mail Desk', action: 'create', code: 'mail.create', description: 'Compose messages, reply to threads, and draft communications' },
  { module: 'mail', label: 'Internal Mail Desk', action: 'edit', code: 'mail.edit', description: 'Label, star, and categorize email messages' },
  { module: 'mail', label: 'Internal Mail Desk', action: 'delete', code: 'mail.delete', description: 'Move messages to trash or purge drafts' },
  { module: 'mail', label: 'Internal Mail Desk', action: 'approve', code: 'mail.approve', description: 'Dispatch shared department announcements' },
  { module: 'mail', label: 'Internal Mail Desk', action: 'export', code: 'mail.export', description: 'Export email threads with attachments' },

  // Security & Admin
  { module: 'security', label: 'Security & Access Control', action: 'view', code: 'security.view', description: 'View active sessions, security alerts, and login history' },
  { module: 'security', label: 'Security & Access Control', action: 'create', code: 'security.create', description: 'Generate onboarding tokens and invitation links' },
  { module: 'security', label: 'Security & Access Control', action: 'edit', code: 'security.edit', description: 'Change user passwords, lock/unlock accounts, reset MFA' },
  { module: 'security', label: 'Security & Access Control', action: 'delete', code: 'security.delete', description: 'Revoke active sessions and force logout' },
  { module: 'security', label: 'Security & Access Control', action: 'approve', code: 'security.approve', description: 'Approve new registration requests and verify identities' },
  { module: 'security', label: 'Security & Access Control', action: 'export', code: 'security.export', description: 'Export security compliance and incident logs' },

  // System Administration
  { module: 'system', label: 'System Settings & Kernel', action: 'view', code: 'system.view', description: 'View system health, service uptime, and audit logs' },
  { module: 'system', label: 'System Settings & Kernel', action: 'create', code: 'system.create', description: 'Create database snapshots and configure AI providers' },
  { module: 'system', label: 'System Settings & Kernel', action: 'edit', code: 'system.edit', description: 'Modify global organization and authentication policies' },
  { module: 'system', label: 'System Settings & Kernel', action: 'delete', code: 'system.delete', description: 'Purge obsolete logs or archive tenant records' },
  { module: 'system', label: 'System Settings & Kernel', action: 'approve', code: 'system.approve', description: 'Authorize maintenance windows and core kernel updates' },
  { module: 'system', label: 'System Settings & Kernel', action: 'export', code: 'system.export', description: 'Export full database backups and complete audit trails' }
];

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: PERMISSION_DEFINITIONS.map(p => p.code),
  ADMIN: PERMISSION_DEFINITIONS.map(p => p.code),
  HR_ADMIN: [
    'workforce.view', 'workforce.create', 'workforce.edit', 'workforce.approve', 'workforce.export',
    'interns.view', 'interns.create', 'interns.edit', 'interns.approve', 'interns.export',
    'security.view', 'security.approve', 'mail.view', 'mail.create', 'mail.edit'
  ],
  FINANCE_ADMIN: [
    'finance.view', 'finance.create', 'finance.edit', 'finance.approve', 'finance.export',
    'crm.view', 'projects.view', 'mail.view', 'mail.create'
  ],
  FINANCE: [
    'finance.view', 'finance.create', 'finance.edit', 'finance.approve', 'finance.export',
    'crm.view', 'projects.view', 'mail.view', 'mail.create'
  ],
  PROJECT_MANAGER: [
    'projects.view', 'projects.create', 'projects.edit', 'projects.approve', 'projects.export',
    'crm.view', 'crm.edit', 'workforce.view', 'interns.view', 'interns.edit', 'interns.approve',
    'mail.view', 'mail.create', 'mail.edit'
  ],
  EMPLOYEE: [
    'projects.view', 'projects.edit', 'workforce.view', 'mail.view', 'mail.create', 'mail.edit'
  ],
  INTERN: [
    'projects.view', 'projects.edit', 'interns.view', 'mail.view', 'mail.create'
  ],
  CLIENT: [
    'projects.view', 'finance.view'
  ]
};

export const INITIAL_ENTERPRISE_USERS: User[] = [
  {
    id: 'usr-admin',
    name: 'Shon Kapate',
    email: 'admin@kapateconsultancy.in',
    role: 'SUPER_ADMIN',
    designation: 'Founder & CEO / Principal Consultant',
    department: 'Executive Leadership',
    kapateId: 'KAP-EMP-000001',
    internalEmail: 'admin@kapateconsultancy.in',
    status: 'ACTIVE',
    phone: '+91 98230 00000',
    manager: 'None (Founder)',
    skills: ['Enterprise Architecture', 'AI Solutions', 'Strategic Consulting'],
    assignedProjects: [],
    failedLogins: 0,
    lockedUntil: null,
    lastLoginAt: '2026-09-19 14:15:00',
    mfaEnabled: true,
    created: '2024-01-01'
  }
];

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  organization: {
    companyName: 'Kapate Consultancy',
    domain: 'kapateconsultancy.in',
    supportEmail: 'admin@kapateconsultancy.in',
    hqAddress: 'Pune / Mumbai, Maharashtra, India',
    gstin: '27KAPAT1234F1Z9',
    fiscalYearStart: '04-01',
    currency: 'INR (₹)'
  },
  authentication: {
    sessionDurationHours: 24,
    maxLoginAttempts: 5,
    accountLockoutMinutes: 30,
    mfaEnforced: false,
    requirePasswordResetDays: 90,
    minPasswordLength: 8
  },
  email: {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    senderEmail: 'admin@kapateconsultancy.in',
    senderName: 'Kapate OS Administration',
    notificationsEnabled: true
  },
  finance: {
    defaultTaxRate: 18,
    invoicePrefix: 'INV-2026',
    paymentTermsDays: 30,
    gstThresholdAmount: 2000000
  },
  notifications: {
    taskAssigned: true,
    invoiceOverdue: true,
    securityAlerts: true,
    dailyDigest: false
  },
  ai: {
    enabled: true,
    provider: 'gemini',
    model: 'gemini-1.5-pro',
    enableSummarizer: true,
    enableSmartReply: true,
    enableEstimates: true,
    monthlyTokenLimit: 10000000,
    tokensUsedThisMonth: 1420500
  },
  storage: {
    maxUploadSizeMB: 25,
    allowedTypes: ['PDF', 'DOCX', 'ZIP', 'PNG', 'JPG', 'XLSX'],
    backupRetentionDays: 30,
    autoBackupEnabled: true
  }
};

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-001',
    timestamp: '2026-09-19 14:30:15',
    actor: 'Shon Kapate',
    actorKapateId: 'KAP-EMP-000001',
    action: 'USER_PASSWORD_RESET',
    module: 'security',
    targetResource: 'users/usr-admin',
    targetUser: 'admin@kapateconsultancy.in',
    previousValue: 'legacy_hash',
    newValue: 'Admin@KC8421174957_pbkdf2_sha512',
    ipAddress: '127.0.0.1',
    result: 'SUCCESS',
    requestId: 'req-auth-init-01',
    reason: 'Master admin credential update and enterprise hardening'
  },
  {
    id: 'aud-002',
    timestamp: '2026-09-19 14:12:00',
    actor: 'Shon Kapate',
    actorKapateId: 'KAP-EMP-000001',
    action: 'SYSTEM_SETTINGS_UPDATE',
    module: 'system',
    targetResource: 'system_settings/email',
    targetUser: 'System',
    previousValue: '@kapateconsultancy.com',
    newValue: '@kapateconsultancy.in',
    ipAddress: '127.0.0.1',
    result: 'SUCCESS',
    requestId: 'req-sys-domain-02',
    reason: 'Standardized corporate email domain across internal mail and system services'
  },
  {
    id: 'aud-003',
    timestamp: '2026-09-19 11:45:20',
    actor: 'Shon Kapate',
    actorKapateId: 'KAP-EMP-000001',
    action: 'PERMISSION_CHANGED',
    module: 'security',
    targetResource: 'roles/PROJECT_MANAGER',
    targetUser: 'Roles Matrix',
    previousValue: 'projects.view, projects.edit',
    newValue: 'projects.view, projects.create, projects.edit, projects.approve, projects.export',
    ipAddress: '127.0.0.1',
    result: 'SUCCESS',
    requestId: 'req-rbac-update-03',
    reason: 'Granted milestone approval capability to Project Managers'
  },
];

export const INITIAL_SESSIONS: SecuritySession[] = [
  {
    id: 'sess-001',
    userId: 'usr-admin',
    userName: 'Shon Kapate',
    email: 'admin@kapateconsultancy.in',
    role: 'SUPER_ADMIN',
    ipAddress: '127.0.0.1 (Local Workstation)',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0',
    loginAt: '2026-09-19 14:15:00',
    lastActiveAt: 'Just now',
    isImpersonated: false,
    status: 'ACTIVE'
  }
];

export const INITIAL_SYSTEM_HEALTH: SystemHealthStatus = {
  overall: 'HEALTHY',
  uptimeSeconds: 864200,
  lastChecked: new Date().toISOString(),
  components: [
    { name: 'Core REST API Engine', status: 'HEALTHY', latencyMs: 18, message: 'Next.js App Router API responding with HTTP 200', lastChecked: 'Just now' },
    { name: 'MongoDB Atlas Cloud Cluster', status: 'HEALTHY', latencyMs: 34, message: 'Primary replica connected, zero pool timeouts', lastChecked: 'Just now' },
    { name: 'Identity & PBKDF2 Auth Subsystem', status: 'HEALTHY', latencyMs: 12, message: 'HMAC-SHA256 JWT tokens valid, active sessions verified', lastChecked: 'Just now' },
    { name: 'Internal Corporate Mail Dispatcher', status: 'HEALTHY', latencyMs: 25, message: 'Corporate queues clear under @kapateconsultancy.in', lastChecked: 'Just now' },
    { name: 'AI Inference Assistant Core', status: 'HEALTHY', latencyMs: 45, message: 'Gemini model connected, quota utilization at 14.2%', lastChecked: 'Just now' },
    { name: 'Encrypted Storage & Document Vault', status: 'HEALTHY', latencyMs: 15, message: 'Storage limits nominal, 100% integrity verified', lastChecked: 'Just now' }
  ],
  databaseStats: {
    type: 'MongoDB Atlas Multi-Tenant + Relational WAL',
    connectionsActive: 12,
    pingStatus: 'OK (100% Availability)',
    collectionsCount: 18
  },
  memoryUsage: {
    heapUsedMB: 142.6,
    heapTotalMB: 256.0
  }
};
