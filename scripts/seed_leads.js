const fs = require('fs');
const path = require('path');

const storePath = path.join(__dirname, '..', 'data', 'kapate_store.json');
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));

const seededLeads = [
  {
    id: "KC-2026-78145",
    name: "Aditya Verma",
    email: "aditya.verma@apexglobal.com",
    phone: "+91 98220 12345",
    company: "Apex Global Technologies",
    service: "Digital Transformation & Cloud Architecture",
    budget: "₹25L - ₹50L",
    source: "Website Form",
    owner: "Shon Kapate",
    status: "New Lead",
    score: 95,
    description: "Requesting full-stack digital modernization and architecture advisory for enterprise legacy workflows.",
    created: "2026-10-10",
    nextFollowUp: "2026-10-12"
  },
  {
    id: "KC-2026-33956",
    name: "Aarav Sharma",
    email: "aarav.sharma@horizonaigroup.com",
    phone: "+91 98111 87654",
    company: "Horizon AI Systems",
    service: "AI Solutions & Agentic Automation",
    budget: "₹50L - ₹1Cr",
    source: "Website Form",
    owner: "Shon Kapate",
    status: "New Lead",
    score: 92,
    description: "Requesting enterprise AI consultation for intelligent document processing and LLM-driven agentic pipelines.",
    created: "2026-10-10",
    nextFollowUp: "2026-10-13"
  },
  {
    id: "KC-2026-11042",
    name: "Priya Patel",
    email: "priya.patel@zenithenterprises.in",
    phone: "+91 98333 45678",
    company: "Zenith Enterprises",
    service: "Enterprise Architecture Consulting",
    budget: "₹15L - ₹30L",
    source: "Website Form",
    owner: "Shon Kapate",
    status: "Qualified",
    score: 88,
    description: "Seeking advisory for core banking transition to modern microservices and high-throughput transaction ledger.",
    created: "2026-10-09",
    nextFollowUp: "2026-10-14"
  },
  {
    id: "KC-2026-58291",
    name: "Rohan Mehta",
    email: "rohan.mehta@tata-advanced.com",
    phone: "+91 98444 67890",
    company: "Tata Advanced Systems",
    service: "Cloud Modernization & DevOps",
    budget: "₹35L - ₹75L",
    source: "Website Form",
    owner: "Shon Kapate",
    status: "Proposal Sent",
    score: 90,
    description: "Multi-region hybrid cloud migration and SOC2 compliance automation.",
    created: "2026-10-08",
    nextFollowUp: "2026-10-15"
  }
];

// Prepend seeded leads without duplicates
const existingLeadIds = new Set((store.leads || []).map(l => l.id));
store.leads = store.leads || [];
for (const lead of seededLeads) {
  if (!existingLeadIds.has(lead.id)) {
    store.leads.unshift(lead);
  }
}

// Generate corresponding email threads and messages
store.email_threads = store.email_threads || [];
store.email_messages = store.email_messages || [];

const existingThreadIds = new Set(store.email_threads.map(t => t.id));

for (const lead of seededLeads) {
  const threadId = `THR-${lead.id}`;
  if (!existingThreadIds.has(threadId)) {
    const msgId = `MSG-${lead.id}-001`;
    const emailBody = `### Inbound Client Consultation & Project Enquiry\n\n**Client Contact:**\n- **Client Name:** ${lead.name}\n- **Email:** ${lead.email}\n- **Phone:** ${lead.phone}\n- **Company / Organization:** ${lead.company}\n- **Service Requested:** ${lead.service}\n- **Estimated Budget:** ${lead.budget}\n- **Reference Tracking ID:** ${lead.id}\n\n**Client Message / Project Brief:**\n> ${lead.description}\n\n---\n*Logged to Kapate OS via Public Portal on ${lead.created}*`;

    const message = {
      id: msgId,
      threadId: threadId,
      from: { name: lead.name, email: lead.email, type: 'TO' },
      to: [
        { name: 'Executive Office Mailbox', email: 'admin@kapateconsultancy.in', type: 'TO' },
        { name: 'Shon Kapate', email: 'shon@kapateconsultancy.in', type: 'TO' },
        { name: 'Enterprise Sales Desk', email: 'sales@kapateconsultancy.in', type: 'TO' }
      ],
      subject: `New Client Enquiry [${lead.id}]: ${lead.service} — ${lead.name}`,
      body: emailBody,
      snippet: lead.description.substring(0, 110),
      timestamp: "10:30 AM",
      date: lead.created,
      isRead: false,
      isStarred: true,
      isImportant: true,
      folder: 'INBOX',
      priority: 'High',
      labels: ['Client', 'Urgent'],
      attachments: []
    };

    const thread = {
      id: threadId,
      subject: `New Client Enquiry [${lead.id}]: ${lead.service} — ${lead.name}`,
      snippet: lead.description.substring(0, 110),
      lastMessageTimestamp: "10:30 AM",
      lastSenderName: lead.name,
      isUnread: true,
      isStarred: true,
      isImportant: true,
      folder: 'INBOX',
      labels: ['Client', 'Urgent'],
      priority: 'High',
      messageCount: 1,
      hasAttachments: false,
      participants: [
        { name: lead.name, email: lead.email, type: 'TO' },
        { name: 'Executive Office Mailbox', email: 'admin@kapateconsultancy.in', type: 'TO' },
        { name: 'Shon Kapate', email: 'shon@kapateconsultancy.in', type: 'TO' }
      ],
      messages: [message]
    };

    store.email_threads.unshift(thread);
    store.email_messages.unshift(message);
  }
}

// Add sample pipeline deals so Pipeline Value isn't ₹0.00L
store.deals = store.deals || [];
if (store.deals.length === 0) {
  store.deals = [
    {
      id: "DEAL-2026-001",
      title: "Apex Global — Digital Architecture Modernization",
      company: "Apex Global Technologies",
      contactName: "Aditya Verma",
      contactEmail: "aditya.verma@apexglobal.com",
      value: 3500000,
      stage: "PROPOSAL",
      probability: 75,
      expectedCloseDate: "2026-11-15",
      owner: "Shon Kapate",
      created: "2026-10-10"
    },
    {
      id: "DEAL-2026-002",
      title: "Horizon AI — Enterprise Agentic Workflow Deployment",
      company: "Horizon AI Systems",
      contactName: "Aarav Sharma",
      contactEmail: "aarav.sharma@horizonaigroup.com",
      value: 6500000,
      stage: "DISCOVERY",
      probability: 60,
      expectedCloseDate: "2026-12-01",
      owner: "Shon Kapate",
      created: "2026-10-10"
    }
  ];
}

// Add sample payments so Revenue Collected isn't ₹0.00L
store.payments = store.payments || [];
if (store.payments.length === 0) {
  store.payments = [
    {
      id: "PAY-2026-001",
      invoiceId: "INV-2026-001",
      invoiceNumber: "KC-INV-2026-001",
      clientName: "Zenith Enterprises",
      amount: 1500000,
      paymentDate: "2026-10-05",
      paymentMethod: "Bank Wire / NEFT",
      referenceNumber: "NEFT-HDFC-99238120",
      status: "COMPLETED",
      notes: "Sprint 1 Enterprise Architecture milestone settlement"
    }
  ];
}

fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
console.log('Seeded store successfully! Total leads:', store.leads.length, 'Total threads:', store.email_threads.length, 'Total deals:', store.deals.length);
