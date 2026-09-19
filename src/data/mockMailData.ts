import {
  EmailAccount, EmailAttachment, EmailLabel, EmailMessage,
  EmailRecipient, EmailSignature, EmailTemplate, EmailThread
} from '../types/index';

export const INITIAL_EMAIL_ACCOUNTS: EmailAccount[] = [
  {
    id: 'acc-shon',
    userId: 'usr-admin',
    email: 'shon@kapateconsultancy.in',
    name: 'Shon Kapate',
    designation: 'Founder & Technology Consultant',
    department: 'Executive Leadership',
    avatar: 'SK',
    isShared: false,
    quotaUsedMB: 0,
    quotaTotalMB: 10240
  },
  {
    id: 'acc-dept-admin',
    userId: 'dept-admin',
    email: 'admin@kapateconsultancy.in',
    name: 'Executive Office Mailbox',
    designation: 'System & Corporate Communications',
    department: 'Operations',
    avatar: 'AD',
    isShared: true,
    allowedRoles: ['ADMIN'],
    quotaUsedMB: 0,
    quotaTotalMB: 20480
  },
  {
    id: 'acc-dept-hr',
    userId: 'dept-hr',
    email: 'hr@kapateconsultancy.in',
    name: 'HR Operations Desk',
    designation: 'Shared Department Mailbox',
    department: 'Human Resources',
    avatar: 'HR',
    isShared: true,
    allowedRoles: ['ADMIN', 'PROJECT_MANAGER'],
    quotaUsedMB: 0,
    quotaTotalMB: 20480
  },
  {
    id: 'acc-dept-finance',
    userId: 'dept-fin',
    email: 'finance@kapateconsultancy.in',
    name: 'Finance & Accounts Desk',
    designation: 'Shared Billing Mailbox',
    department: 'Finance',
    avatar: 'FD',
    isShared: true,
    allowedRoles: ['ADMIN', 'FINANCE'],
    quotaUsedMB: 0,
    quotaTotalMB: 20480
  },
  {
    id: 'acc-dept-sales',
    userId: 'dept-sales',
    email: 'sales@kapateconsultancy.in',
    name: 'Enterprise Sales Desk',
    designation: 'Shared CRM Pipeline Mailbox',
    department: 'Business Development',
    avatar: 'SD',
    isShared: true,
    allowedRoles: ['ADMIN', 'PROJECT_MANAGER'],
    quotaUsedMB: 0,
    quotaTotalMB: 20480
  }
];

export const INITIAL_EMAIL_LABELS: EmailLabel[] = [
  { id: 'lbl-work', name: 'Work', color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  { id: 'lbl-project', name: 'Project', color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  { id: 'lbl-urgent', name: 'Urgent', color: 'text-rose-700', bgColor: 'bg-rose-50', borderColor: 'border-rose-200' },
  { id: 'lbl-client', name: 'Client', color: 'text-amber-800', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  { id: 'lbl-hr', name: 'HR', color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  { id: 'lbl-finance', name: 'Finance', color: 'text-indigo-700', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
  { id: 'lbl-tech', name: 'Technical', color: 'text-cyan-700', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200' },
  { id: 'lbl-intern', name: 'Internship', color: 'text-teal-700', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' }
];

export const INITIAL_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tmpl-1',
    title: 'Project Kickoff & Milestone Plan',
    category: 'Projects',
    subject: 'Project Kickoff: {{project_name}} — Architecture & Delivery Roadmap',
    body: `Dear Team and Stakeholders,\n\nWe are pleased to officially kick off **{{project_name}}**. Our sprint cycle commences this week under the delivery governance of Kapate Consultancy.\n\n### Key Deliverables & Targets:\n1. Architecture sign-off and environment provisioning\n2. Sprint 1 sprint backlog lock\n3. Bi-weekly stakeholder progress review\n\nPlease find the sprint milestones linked in Kapate OS. Let us know if there are any immediate blocking questions.\n\nWarm regards,\n{{employee_name}}\nKapate Consultancy`,
    variables: ['project_name', 'employee_name']
  },
  {
    id: 'tmpl-2',
    title: 'Internship Welcome & First Week Goals',
    category: 'HR',
    subject: 'Welcome to the Kapate OS Engineering Team, {{intern_name}}!',
    body: `Hi {{intern_name}},\n\nWelcome aboard to the Kapate Consultancy Engineering Team! We are thrilled to have you join us for your internship journey.\n\n### First Week Checklist:\n- [ ] Review the Kapate OS Engineering Handbook\n- [ ] Complete internal email & git repository setup\n- [ ] Schedule your 1-on-1 intro with your mentor\n- [ ] Review your allocated tasks in Intern Hub\n\nIf you have any questions, feel free to reach out directly on this thread or to hr@kapateconsultancy.in.\n\nBest of luck!\n{{sender_name}}\nPeople Operations`,
    variables: ['intern_name', 'sender_name']
  },
  {
    id: 'tmpl-3',
    title: 'Enterprise Proposal Follow-Up',
    category: 'Sales',
    subject: 'Follow-Up: Kapate Consultancy Technical Proposal for {{client_name}}',
    body: `Dear {{client_name}},\n\nFollowing our executive discovery session, I am following up on the technical proposal and SLA structure we prepared for your team.\n\nOur proposed system architecture delivers:\n- 99.95% uptime SLA with AWS auto-scaling compute\n- Sub-second latency\n- Strict OWASP and data privacy compliance\n\nWe would welcome the opportunity to address any technical questions your engineering review committee might have. When would be a convenient time for a brief 15-minute sync?\n\nSincerely,\n{{employee_name}}\nKapate Consultancy`,
    variables: ['client_name', 'employee_name']
  },
  {
    id: 'tmpl-4',
    title: 'Milestone Sign-Off Request',
    category: 'Projects',
    subject: 'Milestone Review Required: {{milestone_name}} ({{project_name}})',
    body: `Hello {{client_name}},\n\nWe have completed development and automated UAT tests for milestone **{{milestone_name}}** under **{{project_name}}**.\n\nPlease log in to your authorized Kapate Client Portal to review the test summary and provide your official sign-off.\n\nThank you for your partnership.\n\nRegards,\n{{employee_name}}\nDelivery Lead`,
    variables: ['milestone_name', 'project_name', 'client_name', 'employee_name']
  },
  {
    id: 'tmpl-5',
    title: 'Invoice Due Reminder',
    category: 'Finance',
    subject: 'Friendly Reminder: Invoice {{invoice_number}} Due on {{due_date}}',
    body: `Dear {{client_name}},\n\nThis is a friendly reminder that Invoice **{{invoice_number}}** for amount **{{amount}}** is scheduled for payment on **{{due_date}}**.\n\nYou can review and download the GST compliant tax invoice PDF directly inside your Kapate Client Portal under Authorized Documents.\n\nPlease reply with the bank wire or UPI reference once executed so our accounts desk can issue the payment receipt.\n\nBest regards,\nFinance & Accounts Desk\nfinance@kapateconsultancy.in`,
    variables: ['invoice_number', 'amount', 'due_date', 'client_name']
  }
];

export const INITIAL_EMAIL_SIGNATURES: EmailSignature[] = [
  {
    id: 'sig-1',
    userId: 'usr-admin',
    title: 'Executive Founder Signature',
    content: `Regards,\n**Shon Kapate**\nFounder & Technology Consultant\nKapate Consultancy | Enterprise AI & Software Systems\nWeb: https://kapateconsultancy.in • Email: shon@kapateconsultancy.in`,
    isDefault: true
  },
  {
    id: 'sig-2',
    userId: 'dept-admin',
    title: 'Corporate Executive Signature',
    content: `Best regards,\n**Executive Administration**\nKapate Consultancy\nadmin@kapateconsultancy.in`,
    isDefault: true
  }
];

// Clean Production State: No dummy or test email threads
export const INITIAL_EMAIL_THREADS: EmailThread[] = [];

export const INITIAL_EMAILS: EmailMessage[] = [];
