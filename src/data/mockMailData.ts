import {
  EmailAccount, EmailAttachment, EmailLabel, EmailMessage,
  EmailRecipient, EmailSignature, EmailTemplate, EmailThread
} from '../types';

export const INITIAL_EMAIL_ACCOUNTS: EmailAccount[] = [
  {
    id: 'acc-shon',
    userId: 'usr-admin',
    email: 'shon@kapateconsultancy.com',
    name: 'Shon Kapate',
    designation: 'Founder & Technology Consultant',
    department: 'Executive Leadership',
    avatar: 'SK',
    isShared: false,
    quotaUsedMB: 2450,
    quotaTotalMB: 10240
  },
  {
    id: 'acc-rahul',
    userId: 'usr-emp1',
    email: 'rahul@kapateconsultancy.com',
    name: 'Rahul Deshmukh',
    designation: 'Lead Solutions & Backend Engineer',
    department: 'Engineering Delivery',
    avatar: 'RD',
    isShared: false,
    quotaUsedMB: 1820,
    quotaTotalMB: 10240
  },
  {
    id: 'acc-amit',
    userId: 'usr-emp2',
    email: 'amit@kapateconsultancy.com',
    name: 'Amit Patil',
    designation: 'Principal AI/ML Architect',
    department: 'AI & Data Science',
    avatar: 'AP',
    isShared: false,
    quotaUsedMB: 3100,
    quotaTotalMB: 10240
  },
  {
    id: 'acc-riya',
    userId: 'usr-intern1',
    email: 'riya@kapateconsultancy.com',
    name: 'Riya Sharma',
    designation: 'AI Solutions Intern',
    department: 'AI Research Hub',
    avatar: 'RS',
    isShared: false,
    quotaUsedMB: 480,
    quotaTotalMB: 5120
  },
  {
    id: 'acc-sneha',
    userId: 'usr-hr',
    email: 'sneha@kapateconsultancy.com',
    name: 'Sneha Joshi',
    designation: 'Head of People & Culture',
    department: 'Human Resources',
    avatar: 'SJ',
    isShared: false,
    quotaUsedMB: 1250,
    quotaTotalMB: 10240
  },
  {
    id: 'acc-vikram',
    userId: 'usr-pm',
    email: 'vikram@kapateconsultancy.com',
    name: 'Vikram Seth',
    designation: 'Senior Project Delivery Manager',
    department: 'Project Management',
    avatar: 'VS',
    isShared: false,
    quotaUsedMB: 1940,
    quotaTotalMB: 10240
  },
  // Shared Department Accounts
  {
    id: 'acc-dept-hr',
    userId: 'dept-hr',
    email: 'hr@kapateconsultancy.com',
    name: 'HR Operations Desk',
    designation: 'Shared Department Mailbox',
    department: 'Human Resources',
    avatar: 'HR',
    isShared: true,
    allowedRoles: ['ADMIN', 'PROJECT_MANAGER'],
    quotaUsedMB: 4120,
    quotaTotalMB: 20480
  },
  {
    id: 'acc-dept-finance',
    userId: 'dept-fin',
    email: 'finance@kapateconsultancy.com',
    name: 'Finance & Accounts Desk',
    designation: 'Shared Billing Mailbox',
    department: 'Finance',
    avatar: 'FD',
    isShared: true,
    allowedRoles: ['ADMIN', 'FINANCE'],
    quotaUsedMB: 5890,
    quotaTotalMB: 20480
  },
  {
    id: 'acc-dept-sales',
    userId: 'dept-sales',
    email: 'sales@kapateconsultancy.com',
    name: 'Enterprise Sales Desk',
    designation: 'Shared CRM Pipeline Mailbox',
    department: 'Business Development',
    avatar: 'SD',
    isShared: true,
    allowedRoles: ['ADMIN', 'PROJECT_MANAGER'],
    quotaUsedMB: 3410,
    quotaTotalMB: 20480
  },
  {
    id: 'acc-dept-admin',
    userId: 'dept-admin',
    email: 'admin@kapateconsultancy.com',
    name: 'Executive Office Mailbox',
    designation: 'System & Corporate Communications',
    department: 'Operations',
    avatar: 'AD',
    isShared: true,
    allowedRoles: ['ADMIN'],
    quotaUsedMB: 2150,
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
    subject: 'Welcome to the Kapate OS AI Engineering Team, {{intern_name}}!',
    body: `Hi {{intern_name}},\n\nWelcome aboard to the Kapate Consultancy AI Solutions Team! We are thrilled to have you join us for your internship journey.\n\n### First Week Checklist:\n- [ ] Review the Kapate OS Engineering Handbook\n- [ ] Complete internal email & git repository setup\n- [ ] Schedule your 1-on-1 intro with your mentor, Amit Patil\n- [ ] Review your allocated research tasks in Intern Hub\n\nIf you have any questions, feel free to reach out directly on this thread or to hr@kapateconsultancy.com.\n\nBest of luck!\n{{sender_name}}\nPeople Operations`,
    variables: ['intern_name', 'sender_name']
  },
  {
    id: 'tmpl-3',
    title: 'Enterprise Proposal Follow-Up',
    category: 'Sales',
    subject: 'Follow-Up: Kapate Consultancy Technical Proposal for {{client_name}}',
    body: `Dear {{client_name}},\n\nFollowing our executive discovery session, I am following up on the technical proposal and SLA structure we prepared for your team.\n\nOur proposed AI/ML system architecture delivers:\n- 99.95% uptime SLA with AWS auto-scaling compute\n- Sub-second vector semantic search latency\n- Strict OWASP and data privacy compliance\n\nWe would welcome the opportunity to address any technical questions your engineering review committee might have. When would be a convenient time for a brief 15-minute sync?\n\nSincerely,\n{{employee_name}}\nKapate Consultancy`,
    variables: ['client_name', 'employee_name']
  },
  {
    id: 'tmpl-4',
    title: 'Milestone Sign-Off Request',
    category: 'Projects',
    subject: 'Milestone Review Required: {{milestone_name}} ({{project_name}})',
    body: `Hello {{client_name}},\n\nWe have completed all development and automated UAT tests for milestone **{{milestone_name}}** under **{{project_name}}**.\n\nPlease log in to your authorized Kapate Client Portal to review the test summary and provide your official sign-off.\n\nThank you for your partnership.\n\nRegards,\n{{employee_name}}\nDelivery Lead`,
    variables: ['milestone_name', 'project_name', 'client_name', 'employee_name']
  },
  {
    id: 'tmpl-5',
    title: 'Invoice Due Reminder',
    category: 'Finance',
    subject: 'Friendly Reminder: Invoice {{invoice_number}} Due on {{due_date}}',
    body: `Dear {{client_name}},\n\nThis is a friendly reminder that Invoice **{{invoice_number}}** for amount **{{amount}}** is scheduled for payment on **{{due_date}}**.\n\nYou can review and download the GST compliant tax invoice PDF directly inside your Kapate Client Portal under Authorized Documents.\n\nPlease reply with the bank wire or UPI reference once executed so our accounts desk can issue the payment receipt.\n\nBest regards,\nFinance & Accounts Desk\nfinance@kapateconsultancy.com`,
    variables: ['invoice_number', 'amount', 'due_date', 'client_name']
  }
];

export const INITIAL_EMAIL_SIGNATURES: EmailSignature[] = [
  {
    id: 'sig-1',
    userId: 'usr-admin',
    title: 'Executive Founder Signature',
    content: `Regards,\n**Shon Kapate**\nFounder & Technology Consultant\nKapate Consultancy | Enterprise AI & Software Systems\nWeb: https://kapateconsultancy.com • Phone: +91 98000 11223`,
    isDefault: true
  },
  {
    id: 'sig-2',
    userId: 'usr-emp1',
    title: 'Engineering Signature',
    content: `Thanks & regards,\n**Rahul Deshmukh**\nSenior Solutions & Backend Lead\nKapate Consultancy • Engineering Delivery Team`,
    isDefault: true
  },
  {
    id: 'sig-3',
    userId: 'dept-hr',
    title: 'People Operations Signature',
    content: `Best regards,\n**People & Culture Team**\nKapate Consultancy\nhr@kapateconsultancy.com`,
    isDefault: true
  }
];

// ==================== INITIAL EMAIL THREADS & MESSAGES ====================

const RECIPIENTS = {
  SHON: { name: 'Shon Kapate', email: 'shon@kapateconsultancy.com', role: 'Founder & CEO', department: 'Executive' },
  RAHUL: { name: 'Rahul Deshmukh', email: 'rahul@kapateconsultancy.com', role: 'Backend Lead', department: 'Engineering' },
  AMIT: { name: 'Amit Patil', email: 'amit@kapateconsultancy.com', role: 'Principal AI Architect', department: 'AI Solutions' },
  RIYA: { name: 'Riya Sharma', email: 'riya@kapateconsultancy.com', role: 'AI Intern', department: 'AI Research Hub' },
  SNEHA: { name: 'Sneha Joshi', email: 'sneha@kapateconsultancy.com', role: 'Head of People', department: 'HR' },
  VIKRAM: { name: 'Vikram Seth', email: 'vikram@kapateconsultancy.com', role: 'Delivery PM', department: 'Delivery' },
  SALES: { name: 'Sales Operations', email: 'sales@kapateconsultancy.com', role: 'Business Development', department: 'Sales' },
  FINANCE: { name: 'Finance Desk', email: 'finance@kapateconsultancy.com', role: 'Accounts Desk', department: 'Finance' },
  HR: { name: 'HR Department', email: 'hr@kapateconsultancy.com', role: 'HR Operations', department: 'HR' },
  ADMIN: { name: 'Executive Office', email: 'admin@kapateconsultancy.com', role: 'Operations', department: 'Management' },
  CLIENT: { name: 'Enterprise Client Representative', email: 'client@enterprise.com', role: 'VP Technology', department: 'Client' }
};

export const INITIAL_EMAIL_THREADS: EmailThread[] = [
  // 1. Project Nexus Architecture Sign-Off
  {
    id: 'th-101',
    subject: 'Project Nexus — Microservice Architecture & OWASP Compliance Sign-Off',
    snippet: 'I have finalized the updated vector indexing microservice design and addressed the OWASP threat modeling findings...',
    lastMessageTimestamp: '10:42 AM',
    lastSenderName: 'Amit Patil',
    messageCount: 3,
    participants: [RECIPIENTS.AMIT, RECIPIENTS.SHON, RECIPIENTS.RAHUL],
    isUnread: true,
    isStarred: true,
    isImportant: true,
    priority: 'Urgent',
    labels: ['Work', 'Project', 'Urgent', 'Technical'],
    folder: 'INBOX',
    hasAttachments: true,
    relatedProjectId: 'PRJ-001',
    relatedProjectName: 'Project Nexus',
    messages: [
      {
        id: 'msg-101-1',
        threadId: 'th-101',
        from: RECIPIENTS.AMIT,
        to: [RECIPIENTS.SHON],
        cc: [RECIPIENTS.RAHUL],
        subject: 'Project Nexus — Microservice Architecture & OWASP Compliance Sign-Off',
        snippet: 'Here is the draft microservice spec for Sprint 4...',
        body: `Hi Shon and Rahul,\n\nI have completed the deep dive into the vector pipeline for **Project Nexus**. As we prepare for Phase 2 staging launch, please find attached our comprehensive architecture blueprint and security mitigation matrix.\n\n### Key Highlights in this Revision:\n- Switched to hybrid Pinecone + pgvector failover clustering\n- Implemented AES-256 field-level tokenization for all customer PII\n- Resolved all 4 OWASP API Top 10 recommendations identified in the internal penetration test\n\nPlease review the attached architecture blueprint (PDF) and let me know if we are clear for the Sprint 4 architectural sign-off.\n\nBest,\nAmit Patil\nPrincipal AI Architect`,
        timestamp: 'Sep 17, 2026, 09:15 AM',
        date: '2026-09-17',
        folder: 'INBOX',
        isRead: true,
        isStarred: true,
        isImportant: true,
        priority: 'Urgent',
        labels: ['Work', 'Project', 'Technical'],
        attachments: [
          { id: 'att-101-1', filename: 'nexus-architecture-blueprint-v2.pdf', size: '3.4 MB', fileType: 'PDF', url: '#' },
          { id: 'att-101-2', filename: 'owasp-threat-matrix.docx', size: '820 KB', fileType: 'DOCX', url: '#' }
        ],
        relatedProjectId: 'PRJ-001',
        relatedProjectName: 'Project Nexus'
      },
      {
        id: 'msg-101-2',
        threadId: 'th-101',
        from: RECIPIENTS.RAHUL,
        to: [RECIPIENTS.AMIT],
        cc: [RECIPIENTS.SHON],
        subject: 'Re: Project Nexus — Microservice Architecture & OWASP Compliance Sign-Off',
        snippet: 'The benchmark numbers look very solid. Our latency on the 100k vector set is 42ms...',
        body: `Amit,\n\nReviewed the blueprint. The benchmark numbers look very solid. Our latency on the 100k test vector benchmark is hovering around 42ms (well below our 100ms SLA cap).\n\nOne minor suggestion: for the Redis caching tier, we should configure TTL to 3600s instead of 1800s to minimize compute cold starts during peak European hours.\n\nOther than that, backend engineering is ready to start Sprint 4 implementation immediately.\n\nRegards,\nRahul Deshmukh`,
        timestamp: 'Sep 17, 2026, 10:10 AM',
        date: '2026-09-17',
        folder: 'INBOX',
        isRead: true,
        isStarred: false,
        isImportant: true,
        priority: 'Urgent',
        labels: ['Work', 'Project', 'Technical'],
        attachments: [],
        relatedProjectId: 'PRJ-001',
        relatedProjectName: 'Project Nexus'
      },
      {
        id: 'msg-101-3',
        threadId: 'th-101',
        from: RECIPIENTS.AMIT,
        to: [RECIPIENTS.SHON, RECIPIENTS.RAHUL],
        subject: 'Re: Project Nexus — Microservice Architecture & OWASP Compliance Sign-Off',
        snippet: 'Updated Redis TTL as suggested. Awaiting Shon’s formal management approval...',
        body: `Great catch Rahul. I have updated the Redis cluster configuration with a 3600s TTL and pushed the Terraform spec.\n\nShon, could you please provide formal management sign-off on Task TSK-101 in Kapate OS so the sprint tracker reflects completed architecture review?\n\nThanks,\nAmit`,
        timestamp: '10:42 AM',
        date: '2026-09-18',
        folder: 'INBOX',
        isRead: false,
        isStarred: true,
        isImportant: true,
        priority: 'Urgent',
        labels: ['Work', 'Project', 'Urgent', 'Technical'],
        attachments: [],
        relatedProjectId: 'PRJ-001',
        relatedProjectName: 'Project Nexus'
      }
    ]
  },

  // 2. Sprint 3 Burndown & Task Allocation
  {
    id: 'th-102',
    subject: 'AI Customer Support Platform — Sprint 3 Burn-Down & Delivery Milestone Review',
    snippet: 'Weekly delivery update: Sprint 3 is at 84% completion. Only the Okta SSO metadata task is pending client action...',
    lastMessageTimestamp: 'Yesterday',
    lastSenderName: 'Vikram Seth',
    messageCount: 2,
    participants: [RECIPIENTS.VIKRAM, RECIPIENTS.SHON],
    isUnread: true,
    isStarred: false,
    isImportant: true,
    priority: 'Important',
    labels: ['Work', 'Project'],
    folder: 'INBOX',
    hasAttachments: true,
    relatedProjectId: 'PRJ-001',
    relatedProjectName: 'Project Nexus',
    messages: [
      {
        id: 'msg-102-1',
        threadId: 'th-102',
        from: RECIPIENTS.VIKRAM,
        to: [RECIPIENTS.SHON],
        subject: 'AI Customer Support Platform — Sprint 3 Burn-Down & Delivery Milestone Review',
        snippet: 'Weekly delivery update: Sprint 3 is at 84% completion...',
        body: `Hi Shon,\n\nHere is the weekly delivery snapshot for **Project Nexus**:\n\n- **Overall Progress**: 84% on track for Sept 30 milestone.\n- **Completed**: Payment Gateway integration, Webhook retries, and Admin audit trails.\n- **Pending Blockers**: We are currently waiting on the client's IT security team to provide the Okta SAML XML metadata file (Task TSK-202).\n\nI have reached out to their VP of Tech via the Client Portal. Attached is the Sprint Burn-down report.\n\nBest regards,\nVikram Seth\nSenior Project Delivery Manager`,
        timestamp: 'Yesterday, 04:30 PM',
        date: '2026-09-17',
        folder: 'INBOX',
        isRead: false,
        isStarred: false,
        isImportant: true,
        priority: 'Important',
        labels: ['Work', 'Project'],
        attachments: [
          { id: 'att-102-1', filename: 'sprint3-burndown-report.pdf', size: '1.9 MB', fileType: 'PDF', url: '#' }
        ],
        relatedProjectId: 'PRJ-001',
        relatedProjectName: 'Project Nexus'
      }
    ]
  },

  // 3. Enterprise Sales & CRM Proposal
  {
    id: 'th-103',
    subject: 'InnovateTech Pvt Ltd — Enterprise AI Deal Term Sheet & SOW Finalization',
    snippet: 'Client executive team agreed to our ₹35L annual engagement terms. Need sign-off on custom SLA clause...',
    lastMessageTimestamp: 'Yesterday',
    lastSenderName: 'Sales Operations',
    messageCount: 2,
    participants: [RECIPIENTS.SALES, RECIPIENTS.SHON],
    isUnread: false,
    isStarred: true,
    isImportant: true,
    priority: 'Normal',
    labels: ['Work', 'Client', 'Finance'],
    folder: 'INBOX',
    hasAttachments: true,
    relatedDealId: 'DEAL-101',
    relatedContactEmail: 'contact@innovatetech.io',
    messages: [
      {
        id: 'msg-103-1',
        threadId: 'th-103',
        from: RECIPIENTS.SALES,
        to: [RECIPIENTS.SHON],
        subject: 'InnovateTech Pvt Ltd — Enterprise AI Deal Term Sheet & SOW Finalization',
        snippet: 'Client executive team agreed to our ₹35L engagement...',
        body: `Shon,\n\nExciting news regarding the **InnovateTech** enterprise negotiation:\n\nTheir procurement head has reviewed Proposal PROP-2026-01 and agreed to the **₹35,00,000 (INR 35 Lakhs)** annual engagement fee for the AI Customer Support Platform.\n\nThey requested one adjustment in Section 4.2 regarding round-the-clock priority incident response (15-min SLA for Sev-1). I have verified with Rahul and our engineering on-call rotation can comfortably support this.\n\nAttached is the revised Master Services Agreement & SOW draft. Once you approve, I will dispatch via Kapate OS CRM.\n\nRegards,\nSales Operations Desk`,
        timestamp: 'Yesterday, 02:15 PM',
        date: '2026-09-17',
        folder: 'INBOX',
        isRead: true,
        isStarred: true,
        isImportant: true,
        priority: 'Normal',
        labels: ['Work', 'Client', 'Finance'],
        attachments: [
          { id: 'att-103-1', filename: 'InnovateTech-SOW-Final-v1.docx', size: '640 KB', fileType: 'DOCX', url: '#' },
          { id: 'att-103-2', filename: 'SLA-Schedule-B.pdf', size: '1.2 MB', fileType: 'PDF', url: '#' }
        ]
      }
    ]
  },

  // 4. Internship Hub Progress
  {
    id: 'th-104',
    subject: 'Weekly AI Research & LangChain Benchmark Report — Week 3 Evaluation',
    snippet: 'Hi Sneha and Shon, submitting my Week 3 research on evaluating local Llama-3-8B vs Claude Haiku for query classification...',
    lastMessageTimestamp: '2 days ago',
    lastSenderName: 'Riya Sharma',
    messageCount: 2,
    participants: [RECIPIENTS.RIYA, RECIPIENTS.SNEHA, RECIPIENTS.SHON],
    isUnread: false,
    isStarred: false,
    isImportant: false,
    priority: 'Normal',
    labels: ['HR', 'Internship', 'Technical'],
    folder: 'INBOX',
    hasAttachments: true,
    messages: [
      {
        id: 'msg-104-1',
        threadId: 'th-104',
        from: RECIPIENTS.RIYA,
        to: [RECIPIENTS.SNEHA, RECIPIENTS.SHON],
        subject: 'Weekly AI Research & LangChain Benchmark Report — Week 3 Evaluation',
        snippet: 'Submitting my Week 3 research on local LLM benchmarks...',
        body: `Dear Sneha Ma'am and Shon Sir,\n\nPlease find attached my weekly milestone report for the AI Solutions research internship.\n\n### Summary of Accomplishments:\n1. Benchmarked Llama-3-8B quantized (GGUF) vs API models on 2,500 domain-specific queries.\n2. Measured accuracy at 91.4% with average inference time of 110ms on our local RTX workstation.\n3. Updated the technical documentation in the Kapate OS Intern Hub.\n\nMy mentor Amit Patil has approved the code PR. Looking forward to your feedback during Friday's review.\n\nRespectfully,\nRiya Sharma\nAI Solutions Intern`,
        timestamp: 'Sep 16, 2026, 05:40 PM',
        date: '2026-09-16',
        folder: 'INBOX',
        isRead: true,
        isStarred: false,
        isImportant: false,
        priority: 'Normal',
        labels: ['HR', 'Internship', 'Technical'],
        attachments: [
          { id: 'att-104-1', filename: 'riya-sharma-week3-benchmark.pdf', size: '2.1 MB', fileType: 'PDF', url: '#' }
        ]
      }
    ]
  },

  // 5. Finance Overdue Notice
  {
    id: 'th-105',
    subject: 'Client Invoice Reconciliation & Tax Filing Notice — Q3 Advance Tax',
    snippet: 'Accounts summary: Invoice INV-2026-001 (₹5.9L) has been paid and verified. Invoice INV-2026-002 is sent and awaiting clearance...',
    lastMessageTimestamp: '3 days ago',
    lastSenderName: 'Finance Desk',
    messageCount: 1,
    participants: [RECIPIENTS.FINANCE, RECIPIENTS.SHON],
    isUnread: false,
    isStarred: false,
    isImportant: false,
    priority: 'Normal',
    labels: ['Finance', 'Work'],
    folder: 'INBOX',
    hasAttachments: true,
    messages: [
      {
        id: 'msg-105-1',
        threadId: 'th-105',
        from: RECIPIENTS.FINANCE,
        to: [RECIPIENTS.SHON],
        subject: 'Client Invoice Reconciliation & Tax Filing Notice — Q3 Advance Tax',
        snippet: 'Accounts summary: Invoice reconciliation for Q3...',
        body: `Hi Shon,\n\nHere is our weekly billing reconciliation:\n\n- **Received**: ₹5,90,000 (Incl. 18% GST) from InnovateTech for Phase 1 milestone. Reconciled in Bank Statement.\n- **Dispatched**: Invoice INV-2026-002 (₹7,08,000) generated for Phase 2 milestone payment.\n- **TDS & GST**: GSTR-1 and GSTR-3B filings for the previous month are prepared and uploaded for CA audit.\n\nAttached is the detailed ledger export.\n\nRegards,\nFinance & Accounts Desk\nfinance@kapateconsultancy.com`,
        timestamp: 'Sep 15, 2026, 11:00 AM',
        date: '2026-09-15',
        folder: 'INBOX',
        isRead: true,
        isStarred: false,
        isImportant: false,
        priority: 'Normal',
        labels: ['Finance', 'Work'],
        attachments: [
          { id: 'att-105-1', filename: 'q3-accounts-ledger-statement.pdf', size: '1.4 MB', fileType: 'PDF', url: '#' }
        ]
      }
    ]
  },

  // 6. Corporate Announcement
  {
    id: 'th-106',
    subject: 'Company Announcement: Q4 Product Strategy & Advanced Agentic AI Initiative',
    snippet: 'All-hands briefing: Celebrating our recent milestone achievements and unveiling our 2026 autonomous agent delivery roadmap...',
    lastMessageTimestamp: '4 days ago',
    lastSenderName: 'Shon Kapate',
    messageCount: 1,
    participants: [RECIPIENTS.SHON, RECIPIENTS.ADMIN],
    isUnread: false,
    isStarred: true,
    isImportant: true,
    priority: 'Important',
    labels: ['Work', 'Management'],
    folder: 'INBOX',
    hasAttachments: false,
    messages: [
      {
        id: 'msg-106-1',
        threadId: 'th-106',
        from: RECIPIENTS.SHON,
        to: [RECIPIENTS.ADMIN],
        subject: 'Company Announcement: Q4 Product Strategy & Advanced Agentic AI Initiative',
        snippet: 'All-hands briefing on our Q4 product roadmap...',
        body: `Dear Kapate Consultancy Team,\n\nAs we enter the final stretch of Q3, I want to express my deepest gratitude for everyone’s hard work on our core enterprise delivery projects.\n\n### Strategic Highlights for Q4:\n1. **Kapate OS Evolution**: Unifying CRM, timesheets, internal communication, and project governance into a single pane of glass.\n2. **Autonomous Agent Systems**: Deploying our proprietary deep-reasoning agent workflows for our key enterprise clients.\n3. **Internship Excellence**: Recognizing the high-quality benchmark contributions from our AI research cohorts.\n\nWe will host an all-hands virtual session this Friday at 4:30 PM IST. Looking forward to celebrating our shared wins together!\n\nWarm regards,\nShon Kapate\nFounder & Technology Consultant\nKapate Consultancy`,
        timestamp: 'Sep 14, 2026, 09:00 AM',
        date: '2026-09-14',
        folder: 'INBOX',
        isRead: true,
        isStarred: true,
        isImportant: true,
        priority: 'Important',
        labels: ['Work', 'Management'],
        attachments: []
      }
    ]
  },

  // 7. Security Advisory
  {
    id: 'th-107',
    subject: 'Security Advisory: Mandatory SSH Key Rotation & Production Bastion MFA Policy',
    snippet: 'Urgent security compliance action: All engineering and DevOps leads must complete quarterly SSH key rotation before Friday...',
    lastMessageTimestamp: '5 days ago',
    lastSenderName: 'Executive Office',
    messageCount: 1,
    participants: [RECIPIENTS.ADMIN, RECIPIENTS.RAHUL, RECIPIENTS.AMIT],
    isUnread: false,
    isStarred: false,
    isImportant: true,
    priority: 'Urgent',
    labels: ['Urgent', 'Technical'],
    folder: 'INBOX',
    hasAttachments: false,
    messages: [
      {
        id: 'msg-107-1',
        threadId: 'th-107',
        from: RECIPIENTS.ADMIN,
        to: [RECIPIENTS.RAHUL, RECIPIENTS.AMIT],
        subject: 'Security Advisory: Mandatory SSH Key Rotation & Production Bastion MFA Policy',
        snippet: 'Urgent security compliance action...',
        body: `Security Operations Bulletin #2026-09:\n\nIn alignment with our ISO-27001 and SOC-2 compliance checklist, all active engineers with production or staging VPC access are required to:\n\n1. Generate fresh ed25519 SSH keys.\n2. Submit public keys through the Kapate OS security portal.\n3. De-authorize legacy RSA-2048 keys from the AWS IAM bastion whitelist by Friday 6:00 PM IST.\n\nFailure to update will result in automated access suspension.\n\nSecurity & Compliance Desk\nadmin@kapateconsultancy.com`,
        timestamp: 'Sep 13, 2026, 02:00 PM',
        date: '2026-09-13',
        folder: 'INBOX',
        isRead: true,
        isStarred: false,
        isImportant: true,
        priority: 'Urgent',
        labels: ['Urgent', 'Technical'],
        attachments: []
      }
    ]
  },

  // 8. DRAFT 1
  {
    id: 'th-201',
    subject: 'Draft: Enterprise AI Solution SLA & Disaster Recovery Protocol',
    snippet: 'Documenting our multi-region failover SLA for enterprise client presentation next Tuesday...',
    lastMessageTimestamp: 'Today, 11:30 AM',
    lastSenderName: 'Shon Kapate',
    messageCount: 1,
    participants: [RECIPIENTS.SHON, RECIPIENTS.CLIENT],
    isUnread: false,
    isStarred: false,
    isImportant: false,
    priority: 'Normal',
    labels: ['Work', 'Client'],
    folder: 'DRAFTS',
    hasAttachments: false,
    messages: [
      {
        id: 'msg-201-1',
        threadId: 'th-201',
        from: RECIPIENTS.SHON,
        to: [RECIPIENTS.CLIENT],
        subject: 'Draft: Enterprise AI Solution SLA & Disaster Recovery Protocol',
        snippet: 'Documenting our multi-region failover...',
        body: `Dear Technology Team,\n\nFollowing our technical committee review, here is our formal addendum covering Disaster Recovery (RPO < 15 mins, RTO < 30 mins) across AWS ap-south-1 and eu-west-1.\n\n[Pending final benchmark appendix from Rahul before sending]`,
        timestamp: 'Today, 11:30 AM',
        date: '2026-09-18',
        folder: 'DRAFTS',
        isRead: true,
        isStarred: false,
        isImportant: false,
        priority: 'Normal',
        labels: ['Work', 'Client'],
        attachments: []
      }
    ]
  },

  // 9. DRAFT 2
  {
    id: 'th-202',
    subject: 'Draft: Internship Certificate & Letter of Recommendation for Riya Sharma',
    snippet: 'This is to formally certify that Riya Sharma has demonstrated outstanding technical acumen in generative AI...',
    lastMessageTimestamp: 'Yesterday',
    lastSenderName: 'Shon Kapate',
    messageCount: 1,
    participants: [RECIPIENTS.SHON, RECIPIENTS.RIYA],
    isUnread: false,
    isStarred: false,
    isImportant: false,
    priority: 'Normal',
    labels: ['HR', 'Internship'],
    folder: 'DRAFTS',
    hasAttachments: false,
    messages: [
      {
        id: 'msg-202-1',
        threadId: 'th-202',
        from: RECIPIENTS.SHON,
        to: [RECIPIENTS.RIYA],
        subject: 'Draft: Internship Certificate & Letter of Recommendation for Riya Sharma',
        snippet: 'Formal certification and recommendation draft...',
        body: `To Whom It May Concern,\n\nI am writing to highly recommend Riya Sharma. During her tenure at Kapate Consultancy as an AI Solutions Intern, Riya consistently exceeded expectations in benchmark testing, LLM orchestration, and Python backend microservices.\n\n[Pending HR template seal]`,
        timestamp: 'Yesterday, 06:15 PM',
        date: '2026-09-17',
        folder: 'DRAFTS',
        isRead: true,
        isStarred: false,
        isImportant: false,
        priority: 'Normal',
        labels: ['HR', 'Internship'],
        attachments: []
      }
    ]
  },

  // 10. SENT MAIL 1
  {
    id: 'th-301',
    subject: 'Approved: Sprint 3 Timesheet & Contractor Billing Reconciliation',
    snippet: 'I have reviewed and approved all 14 contractor and employee timesheet submissions for Sprint 3. Finance is cleared to proceed...',
    lastMessageTimestamp: 'Sep 16, 2026',
    lastSenderName: 'Shon Kapate',
    messageCount: 1,
    participants: [RECIPIENTS.SHON, RECIPIENTS.FINANCE],
    isUnread: false,
    isStarred: false,
    isImportant: false,
    priority: 'Normal',
    labels: ['Finance', 'Work'],
    folder: 'SENT',
    hasAttachments: true,
    messages: [
      {
        id: 'msg-301-1',
        threadId: 'th-301',
        from: RECIPIENTS.SHON,
        to: [RECIPIENTS.FINANCE],
        subject: 'Approved: Sprint 3 Timesheet & Contractor Billing Reconciliation',
        snippet: 'Timesheet approvals for Sprint 3...',
        body: `Hi Rajesh,\n\nI have audited the Sprint 3 logged billable hours in Kapate OS Timesheets. All 14 engineers and specialist contractors have been verified against project milestones.\n\nYou are cleared to process developer payouts on schedule this Friday.\n\nAttached is the digitally signed approval sheet.\n\nBest,\nShon Kapate`,
        timestamp: 'Sep 16, 2026, 04:00 PM',
        date: '2026-09-16',
        folder: 'SENT',
        isRead: true,
        isStarred: false,
        isImportant: false,
        priority: 'Normal',
        labels: ['Finance', 'Work'],
        attachments: [
          { id: 'att-301-1', filename: 'signed-timesheet-approval-sprint3.pdf', size: '920 KB', fileType: 'PDF', url: '#' }
        ]
      }
    ]
  },

  // 11. SENT MAIL 2
  {
    id: 'th-302',
    subject: 'Technical Architecture Sign-Off Confirmation — Project Nexus Phase 1',
    snippet: 'Confirming formal architectural approval for Project Nexus Phase 1. Database schema and microservice contracts are locked...',
    lastMessageTimestamp: 'Sep 12, 2026',
    lastSenderName: 'Shon Kapate',
    messageCount: 1,
    participants: [RECIPIENTS.SHON, RECIPIENTS.AMIT, RECIPIENTS.RAHUL],
    isUnread: false,
    isStarred: true,
    isImportant: true,
    priority: 'Important',
    labels: ['Work', 'Project', 'Technical'],
    folder: 'SENT',
    hasAttachments: false,
    relatedProjectId: 'PRJ-001',
    relatedProjectName: 'Project Nexus',
    messages: [
      {
        id: 'msg-302-1',
        threadId: 'th-302',
        from: RECIPIENTS.SHON,
        to: [RECIPIENTS.AMIT, RECIPIENTS.RAHUL],
        subject: 'Technical Architecture Sign-Off Confirmation — Project Nexus Phase 1',
        snippet: 'Confirming formal architecture approval...',
        body: `Amit & Rahul,\n\nFormal architectural approval is granted for Phase 1. The microservice endpoints, vector embeddings schema, and rate limiting thresholds satisfy all contractual commitments with the client.\n\nProceed to Sprint 2 execution as planned.\n\nShon Kapate`,
        timestamp: 'Sep 12, 2026, 11:30 AM',
        date: '2026-09-12',
        folder: 'SENT',
        isRead: true,
        isStarred: true,
        isImportant: true,
        priority: 'Important',
        labels: ['Work', 'Project', 'Technical'],
        attachments: [],
        relatedProjectId: 'PRJ-001',
        relatedProjectName: 'Project Nexus'
      }
    ]
  },

  // 12. ARCHIVE
  {
    id: 'th-401',
    subject: 'Office Facilities & Hybrid Work Policy Update (Q2 Archive)',
    snippet: 'Corporate policy documentation regarding hybrid in-office attendance and coworking pass allowances...',
    lastMessageTimestamp: 'Aug 20, 2026',
    lastSenderName: 'Sneha Joshi',
    messageCount: 1,
    participants: [RECIPIENTS.SNEHA, RECIPIENTS.SHON],
    isUnread: false,
    isStarred: false,
    isImportant: false,
    priority: 'Normal',
    labels: ['HR'],
    folder: 'ARCHIVE',
    hasAttachments: false,
    messages: [
      {
        id: 'msg-401-1',
        threadId: 'th-401',
        from: RECIPIENTS.SNEHA,
        to: [RECIPIENTS.SHON],
        subject: 'Office Facilities & Hybrid Work Policy Update (Q2 Archive)',
        snippet: 'Archived corporate policy documentation...',
        body: `Hi Shon,\n\nArchiving the finalized Q2 workspace and hybrid collaboration policy for our records. All team members have acknowledged receipt in Kapate OS.\n\nSneha Joshi`,
        timestamp: 'Aug 20, 2026, 10:00 AM',
        date: '2026-08-20',
        folder: 'ARCHIVE',
        isRead: true,
        isStarred: false,
        isImportant: false,
        priority: 'Normal',
        labels: ['HR'],
        attachments: []
      }
    ]
  },

  // 13. TRASH
  {
    id: 'th-501',
    subject: 'Outdated Server Load Testing Logs (Dump #4092)',
    snippet: 'Raw CSV load test traces from previous staging environment before tear-down...',
    lastMessageTimestamp: 'Sep 02, 2026',
    lastSenderName: 'Rahul Deshmukh',
    messageCount: 1,
    participants: [RECIPIENTS.RAHUL, RECIPIENTS.SHON],
    isUnread: false,
    isStarred: false,
    isImportant: false,
    priority: 'Normal',
    labels: ['Technical'],
    folder: 'TRASH',
    hasAttachments: false,
    messages: [
      {
        id: 'msg-501-1',
        threadId: 'th-501',
        from: RECIPIENTS.RAHUL,
        to: [RECIPIENTS.SHON],
        subject: 'Outdated Server Load Testing Logs (Dump #4092)',
        snippet: 'Raw CSV load test traces...',
        body: `Temporary raw traces from previous benchmarking run. Safe to purge.\n\nRahul`,
        timestamp: 'Sep 02, 2026, 03:20 PM',
        date: '2026-09-02',
        folder: 'TRASH',
        isRead: true,
        isStarred: false,
        isImportant: false,
        priority: 'Normal',
        labels: ['Technical'],
        attachments: []
      }
    ]
  },

  // 14. SPAM
  {
    id: 'th-601',
    subject: '[SUSPICIOUS] Unsolicited Commercial Database Offer for IT Contractors',
    snippet: 'External bulk spam offering unverified contact lists. Automatically isolated by Kapate OS security filters...',
    lastMessageTimestamp: 'Sep 10, 2026',
    lastSenderName: 'Unknown External Sender',
    messageCount: 1,
    participants: [{ name: 'Spam Sender', email: 'promo@unsolicitedmarketing.net' }, RECIPIENTS.SHON],
    isUnread: false,
    isStarred: false,
    isImportant: false,
    priority: 'Normal',
    labels: [],
    folder: 'SPAM',
    hasAttachments: false,
    messages: [
      {
        id: 'msg-601-1',
        threadId: 'th-601',
        from: { name: 'Spam Sender', email: 'promo@unsolicitedmarketing.net' },
        to: [RECIPIENTS.SHON],
        subject: '[SUSPICIOUS] Unsolicited Commercial Database Offer for IT Contractors',
        snippet: 'External unsolicited bulk offer...',
        body: `Get 10,000 developer emails for $99. [Flagged as unsolicited by Kapate OS Mail Security Filter]`,
        timestamp: 'Sep 10, 2026, 01:12 AM',
        date: '2026-09-10',
        folder: 'SPAM',
        isRead: true,
        isStarred: false,
        isImportant: false,
        priority: 'Normal',
        labels: [],
        attachments: []
      }
    ]
  }
];

export const INITIAL_EMAILS: EmailMessage[] = INITIAL_EMAIL_THREADS.flatMap(t => t.messages);
