import { create } from 'zustand';
import {
  User, UserRole, Lead, LeadStatus, Company, Contact, Deal, DealStage,
  Proposal, Contract, Project, Task, TaskStatus, Employee, Intern, Freelancer,
  ResourceAllocation, TimesheetEntry, LeaveRequest, AttendanceRecord,
  Invoice, Payment, Expense, Notification, ActivityLog, AppDocument,
  EmailAccount, EmailAttachment, EmailLabel, EmailMessage, EmailRecipient,
  EmailSignature, EmailTemplate, EmailThread, MailFolder, EmailPriority,
  RegistrationRequest, OnboardingInvitation, SecurityEvent, AccountStatus
} from '../types';
import {
  DEMO_USERS, INITIAL_LEADS, INITIAL_COMPANIES, INITIAL_CONTACTS, INITIAL_DEALS,
  INITIAL_PROPOSALS, INITIAL_CONTRACTS, INITIAL_PROJECTS, INITIAL_TASKS,
  INITIAL_EMPLOYEES, INITIAL_INTERNS, INITIAL_FREELANCERS, INITIAL_RESOURCES,
  INITIAL_TIMESHEETS, INITIAL_ATTENDANCE, INITIAL_LEAVES, INITIAL_INVOICES,
  INITIAL_PAYMENTS, INITIAL_EXPENSES, INITIAL_NOTIFICATIONS, INITIAL_ACTIVITIES,
  INITIAL_DOCUMENTS, INITIAL_EMAIL_ACCOUNTS, INITIAL_EMAIL_LABELS,
  INITIAL_EMAIL_TEMPLATES, INITIAL_EMAIL_SIGNATURES, INITIAL_EMAIL_THREADS,
  INITIAL_EMAILS, INITIAL_REGISTRATION_REQUESTS, INITIAL_ONBOARDING_INVITATIONS,
  INITIAL_SECURITY_EVENTS
} from '../data/mockData';

interface ToastState {
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface DemoStore {
  // Authentication & Role
  currentUser: User;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  checkAuth: () => void;
  login: (roleKey?: string) => void;
  logout: () => void;
  switchRole: (roleKey: string) => void;

  // Active view tab navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Search & Modals
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isQuickCreateOpen: boolean;
  setQuickCreateOpen: (open: boolean) => void;
  isGlobalSearchOpen: boolean;
  setGlobalSearchOpen: (open: boolean) => void;

  // Guided Walkthrough
  isDemoJourneyOpen: boolean;
  demoJourneyStep: number;
  setDemoJourneyOpen: (open: boolean) => void;
  setDemoJourneyStep: (step: number) => void;
  nextDemoJourneyStep: () => void;
  prevDemoJourneyStep: () => void;

  // Toast feedback
  toast: ToastState | null;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  clearToast: () => void;

  // State Entities
  leads: Lead[];
  companies: Company[];
  contacts: Contact[];
  deals: Deal[];
  proposals: Proposal[];
  contracts: Contract[];
  projects: Project[];
  tasks: Task[];
  employees: Employee[];
  interns: Intern[];
  freelancers: Freelancer[];
  resources: ResourceAllocation[];
  timesheets: TimesheetEntry[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  notifications: Notification[];
  activities: ActivityLog[];
  documents: AppDocument[];

  // Internal Mail System
  emailAccounts: EmailAccount[];
  emailThreads: EmailThread[];
  emails: EmailMessage[];
  emailTemplates: EmailTemplate[];
  emailSignatures: EmailSignature[];
  emailLabels: EmailLabel[];
  activeMailFolder: MailFolder;
  selectedEmailThreadId: string | null;
  activeEmailAccountEmail: string;
  mailSearchQuery: string;
  selectedMailLabel: string | null;
  isMailComposeOpen: boolean;
  mailComposeInitialData: Partial<EmailMessage> | null;
  isMailSettingsOpen: boolean;
  isMailTemplatesOpen: boolean;

  sendEmail: (msgData: {
    from?: EmailRecipient | { name: string; email: string };
    fromEmail?: string;
    to: EmailRecipient[];
    cc?: EmailRecipient[];
    bcc?: EmailRecipient[];
    subject: string;
    body: string;
    priority?: EmailPriority;
    labels?: string[];
    attachments?: EmailAttachment[];
    threadId?: string;
    draftId?: string;
    relatedProjectId?: string;
    relatedProjectName?: string;
    relatedDealId?: string;
  }) => void;
  saveDraft: (draftData: Partial<EmailMessage>) => void;
  deleteDraft: (draftId: string) => void;
  moveThreadToFolder: (threadId: string, folder: MailFolder) => void;
  bulkMoveThreadsToFolder: (threadIds: string[], folder: MailFolder) => void;
  toggleStarThread: (threadId: string) => void;
  toggleImportantThread: (threadId: string) => void;
  markThreadRead: (threadId: string, isRead: boolean) => void;
  bulkMarkThreadsRead: (threadIds: string[], isRead: boolean) => void;
  addLabelToThread: (threadId: string, label: string) => void;
  removeLabelFromThread: (threadId: string, label: string) => void;
  linkEmailToProject: (threadId: string, projectId: string, projectName: string) => void;
  createTaskFromEmail: (threadId: string, taskData: {
    title: string;
    assignedTo: string;
    priority: any;
    dueDate: string;
    estimatedHours: number;
    description: string;
    projectId: string;
    projectName: string;
  }) => void;
  saveEmailAttachmentToDocuments: (attachment: EmailAttachment, category: any, relatedEntity: string) => void;
  setActiveMailFolder: (folder: MailFolder) => void;
  setSelectedEmailThreadId: (threadId: string | null) => void;
  setActiveEmailAccountEmail: (email: string) => void;
  setMailSearchQuery: (query: string) => void;
  setSelectedMailLabel: (label: string | null) => void;
  setMailComposeOpen: (open: boolean, initialData?: Partial<EmailMessage> | null) => void;
  setMailSettingsOpen: (open: boolean) => void;
  setMailTemplatesOpen: (open: boolean) => void;
  updateEmailSignature: (userId: string, content: string) => void;

  // Entity Actions (Simulated CRUD)
  addLead: (lead: Omit<Lead, 'id' | 'created'>) => void;
  updateLeadStatus: (id: string, status: LeadStatus) => void;
  addCompany: (company: Omit<Company, 'id' | 'contactsCount' | 'dealsCount' | 'activeProjects' | 'totalRevenue' | 'contacts'>) => void;
  addContact: (contact: Omit<Contact, 'id' | 'lastContacted'>) => void;
  addDeal: (deal: Omit<Deal, 'id' | 'created'>) => void;
  updateDealStage: (id: string, stage: DealStage) => void;
  addProposal: (proposal: Omit<Proposal, 'id' | 'created' | 'status'>) => void;
  addProject: (project: Omit<Project, 'id' | 'spentBudget' | 'progress' | 'status' | 'milestones' | 'profitability'>) => void;
  addTask: (task: Omit<Task, 'id' | 'loggedHours'>) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  addEmployee: (employee: Omit<Employee, 'id' | 'projectsCount' | 'utilization' | 'joinDate' | 'status'>) => void;
  addIntern: (intern: Omit<Intern, 'id' | 'tasksCompleted' | 'tasksPending' | 'loggedHours' | 'attendancePct' | 'trainingProgress' | 'status' | 'evaluations'>) => void;
  addTimesheet: (ts: Omit<TimesheetEntry, 'id' | 'status' | 'employeeName'>) => void;
  approveTimesheet: (id: string) => void;
  addLeave: (leave: Omit<LeaveRequest, 'id' | 'status'>) => void;
  approveLeave: (id: string, approve: boolean) => void;
  addInvoice: (inv: Omit<Invoice, 'id' | 'status' | 'amount' | 'tax' | 'total'>) => void;
  markInvoicePaid: (id: string) => void;
  markNotificationRead: (id: string) => void;
  resetDemoData: () => void;

  // Identity, Onboarding & Security
  registrationRequests: RegistrationRequest[];
  onboardingInvitations: OnboardingInvitation[];
  securityEvents: SecurityEvent[];
  isSecurityDashboardOpen: boolean;
  isOnboardModalOpen: boolean;
  setSecurityDashboardOpen: (open: boolean) => void;
  setOnboardModalOpen: (open: boolean) => void;
  submitRegistrationRequest: (data: { fullName: string; email: string; phone?: string; applicationId?: string; requestedType?: 'EMPLOYEE' | 'INTERN' | 'FREELANCER'; notes?: string }) => { success: boolean; request: RegistrationRequest };
  approveRegistrationRequest: (requestId: string, role: UserRole, department: string, manager: string, designation: string, employmentType: 'EMPLOYEE' | 'INTERN' | 'FREELANCER') => { success: boolean; invitation: OnboardingInvitation };
  rejectRegistrationRequest: (requestId: string, reason?: string) => void;
  onboardPersonnel: (data: { fullName: string; email: string; phone?: string; designation: string; department: string; employmentType: 'EMPLOYEE' | 'INTERN' | 'FREELANCER'; role: UserRole; manager: string; skills?: string[] }) => { success: boolean; invitation: OnboardingInvitation };
  acceptInvitation: (token: string, password?: string) => { success: boolean; user?: User; error?: string };
  revokeInvitation: (invitationId: string) => void;
  changeUserRole: (userId: string, newRole: UserRole) => { success: boolean; error?: string };
  changeUserStatus: (userId: string, newStatus: AccountStatus, reason?: string) => void;
  addTaskWithNotification: (taskData: Omit<Task, 'id' | 'loggedHours'>) => { success: boolean; error?: string };
}

export const useDemoStore = create<DemoStore>((set, get) => ({
  currentUser: DEMO_USERS.ADMIN,
  isAuthenticated: false,
  setIsAuthenticated: (auth: boolean) => set({ isAuthenticated: auth }),
  checkAuth: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('kapate_token') || localStorage.getItem('kapate_access_token');
      const savedRole = localStorage.getItem('kapate_user_role');
      if (savedRole && DEMO_USERS[savedRole]) {
        set({ currentUser: DEMO_USERS[savedRole] });
      }
      set({ isAuthenticated: !!token });
    }
  },
  login: (roleKey?: string) => {
    if (roleKey) {
      get().switchRole(roleKey);
    }
    set({ isAuthenticated: true });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kapate_token');
      localStorage.removeItem('kapate_access_token');
      localStorage.removeItem('kapate_user');
      localStorage.removeItem('kapate_user_role');
    }
    set({ isAuthenticated: false });
    get().showToast('Signed out of Kapate OS', 'info');
  },
  switchRole: (roleKey: string) => {
    const user = DEMO_USERS[roleKey] || DEMO_USERS.ADMIN;
    if (typeof window !== 'undefined') {
      localStorage.setItem('kapate_user_role', roleKey);
    }
    const matchingAcc = get().emailAccounts.find(a => a.email === user.email || a.email === user.internalEmail);
    set({
      currentUser: user,
      activeEmailAccountEmail: matchingAcc ? matchingAcc.email : (user.email || 'shon@kapateconsultancy.com')
    });
    
    // Auto switch active view tab depending on role
    if (user.role === 'CLIENT') {
      set({ activeTab: 'client-portal' });
    } else if (user.role === 'INTERN') {
      set({ activeTab: 'intern-dashboard' });
    } else if (user.role === 'FINANCE') {
      set({ activeTab: 'finance' });
    } else {
      set({ activeTab: 'dashboard' });
    }
    
    get().showToast(`Switched view to ${user.name} (${user.role} role)`, 'info');
  },

  activeTab: 'dashboard',
  setActiveTab: (tab: string) => set({ activeTab: tab }),

  searchQuery: '',
  setSearchQuery: (q: string) => set({ searchQuery: q }),
  isQuickCreateOpen: false,
  setQuickCreateOpen: (open: boolean) => set({ isQuickCreateOpen: open }),
  isGlobalSearchOpen: false,
  setGlobalSearchOpen: (open: boolean) => set({ isGlobalSearchOpen: open }),

  isDemoJourneyOpen: false,
  demoJourneyStep: 1,
  setDemoJourneyOpen: (open: boolean) => set({ isDemoJourneyOpen: open }),
  setDemoJourneyStep: (step: number) => set({ demoJourneyStep: step }),
  nextDemoJourneyStep: () => set((state) => ({ demoJourneyStep: Math.min(17, state.demoJourneyStep + 1) })),
  prevDemoJourneyStep: () => set((state) => ({ demoJourneyStep: Math.max(1, state.demoJourneyStep - 1) })),

  toast: null,
  showToast: (message: string, type = 'success') => {
    set({ toast: { message, type } });
    setTimeout(() => {
      set({ toast: null });
    }, 4000);
  },
  clearToast: () => set({ toast: null }),

  leads: INITIAL_LEADS,
  companies: INITIAL_COMPANIES,
  contacts: INITIAL_CONTACTS,
  deals: INITIAL_DEALS,
  proposals: INITIAL_PROPOSALS,
  contracts: INITIAL_CONTRACTS,
  projects: INITIAL_PROJECTS,
  tasks: INITIAL_TASKS,
  employees: INITIAL_EMPLOYEES,
  interns: INITIAL_INTERNS,
  freelancers: INITIAL_FREELANCERS,
  resources: INITIAL_RESOURCES,
  timesheets: INITIAL_TIMESHEETS,
  attendance: INITIAL_ATTENDANCE,
  leaves: INITIAL_LEAVES,
  invoices: INITIAL_INVOICES,
  payments: INITIAL_PAYMENTS,
  expenses: INITIAL_EXPENSES,
  notifications: INITIAL_NOTIFICATIONS,
  activities: INITIAL_ACTIVITIES,
  documents: INITIAL_DOCUMENTS,

  // Mail System Initial State
  emailAccounts: INITIAL_EMAIL_ACCOUNTS,
  emailThreads: INITIAL_EMAIL_THREADS,
  emails: INITIAL_EMAILS,
  emailTemplates: INITIAL_EMAIL_TEMPLATES,
  emailSignatures: INITIAL_EMAIL_SIGNATURES,
  emailLabels: INITIAL_EMAIL_LABELS,
  activeMailFolder: 'INBOX',
  selectedEmailThreadId: INITIAL_EMAIL_THREADS[0]?.id || null,
  activeEmailAccountEmail: 'shon@kapateconsultancy.com',
  mailSearchQuery: '',
  selectedMailLabel: null,
  isMailComposeOpen: false,
  mailComposeInitialData: null,
  isMailSettingsOpen: false,
  isMailTemplatesOpen: false,

  sendEmail: (msgData) => {
    const activeAcc = get().emailAccounts.find(a => a.email === (msgData.fromEmail || get().activeEmailAccountEmail));
    const sender = msgData.from || (activeAcc ? { name: activeAcc.name, email: activeAcc.email } : {
      name: get().currentUser.name,
      email: get().currentUser.email || 'shon@kapateconsultancy.com'
    });

    const threadId = msgData.threadId || `th-${Date.now()}`;
    const newMsg: EmailMessage = {
      id: `msg-${Date.now()}`,
      threadId,
      from: { name: sender.name, email: sender.email },
      to: msgData.to,
      cc: msgData.cc,
      bcc: msgData.bcc,
      subject: msgData.subject,
      body: msgData.body,
      snippet: msgData.body.replace(/[#*`_\[\]]/g, '').slice(0, 120) + '...',
      timestamp: 'Just now',
      date: new Date().toISOString().split('T')[0],
      folder: 'SENT',
      isRead: true,
      isStarred: false,
      isImportant: msgData.priority === 'Urgent' || msgData.priority === 'Important',
      priority: msgData.priority || 'Normal',
      labels: msgData.labels || ['Work'],
      attachments: msgData.attachments || [],
      relatedProjectId: msgData.relatedProjectId,
      relatedProjectName: msgData.relatedProjectName,
      relatedDealId: msgData.relatedDealId
    };

    set((state) => {
      // Clean up draft if one was being edited
      const draftIdToRemove = msgData.draftId;
      let updatedThreads = state.emailThreads.filter(t => !draftIdToRemove || t.id !== draftIdToRemove);
      let updatedEmails = state.emails.filter(e => !draftIdToRemove || (e.id !== draftIdToRemove && e.threadId !== draftIdToRemove));

      const existingThreadIndex = updatedThreads.findIndex(t => t.id === threadId);

      if (existingThreadIndex >= 0) {
        const existing = updatedThreads[existingThreadIndex];
        const existingParticipants = existing.participants || [];
        const newParticipants = [
          ...existingParticipants,
          { name: sender.name, email: sender.email },
          ...msgData.to,
          ...(msgData.cc || [])
        ];
        const uniqueParticipants = Array.from(
          new Map(newParticipants.map(p => [p.email.toLowerCase(), p])).values()
        );

        const updatedThread: EmailThread = {
          ...existing,
          lastMessageTimestamp: 'Just now',
          lastSenderName: sender.name,
          messageCount: existing.messages.length + 1,
          snippet: newMsg.snippet,
          participants: uniqueParticipants,
          folder: existing.folder === 'DRAFTS' ? 'SENT' : existing.folder,
          hasAttachments: existing.hasAttachments || (newMsg.attachments?.length || 0) > 0,
          messages: [...existing.messages, newMsg]
        };
        updatedThreads[existingThreadIndex] = updatedThread;
      } else {
        const newThread: EmailThread = {
          id: threadId,
          subject: newMsg.subject,
          snippet: newMsg.snippet,
          lastMessageTimestamp: 'Just now',
          lastSenderName: sender.name,
          messageCount: 1,
          participants: [{ name: sender.name, email: sender.email }, ...msgData.to, ...(msgData.cc || [])],
          isUnread: false,
          isStarred: false,
          isImportant: newMsg.isImportant,
          priority: newMsg.priority,
          labels: newMsg.labels,
          folder: 'SENT',
          hasAttachments: (newMsg.attachments?.length || 0) > 0,
          messages: [newMsg],
          relatedProjectId: msgData.relatedProjectId,
          relatedProjectName: msgData.relatedProjectName,
          relatedDealId: msgData.relatedDealId
        };
        updatedThreads = [newThread, ...updatedThreads];
      }

      // Log CRM activity if related
      let newActivities = [...state.activities];
      if (msgData.relatedDealId || msgData.relatedProjectId) {
        newActivities.unshift({
          id: `act-${Date.now()}`,
          entityType: msgData.relatedProjectId ? 'Project' : 'Deal',
          entityId: msgData.relatedProjectId || msgData.relatedDealId || 'CRM',
          entityName: msgData.relatedProjectName || msgData.subject,
          date: new Date().toISOString().split('T')[0],
          action: `Email sent to ${msgData.to.map(t => t.name).join(', ')}: "${msgData.subject}"`,
          user: sender.name
        });
      }

      return {
        emailThreads: updatedThreads,
        emails: [newMsg, ...updatedEmails],
        activities: newActivities,
        selectedEmailThreadId: threadId,
        isMailComposeOpen: false,
        mailComposeInitialData: null
      };
    });

    get().showToast(`Email sent to ${msgData.to.map(t => t.email).join(', ')}`, 'success');
  },

  saveDraft: (draftData) => {
    const sender = get().emailAccounts.find(a => a.email === get().activeEmailAccountEmail) || {
      name: get().currentUser.name,
      email: get().currentUser.email || 'shon@kapateconsultancy.com'
    };

    const draftId = draftData.id || `draft-${Date.now()}`;
    const threadId = draftData.threadId || `th-draft-${Date.now()}`;

    const draftMsg: EmailMessage = {
      id: draftId,
      threadId,
      from: { name: sender.name, email: sender.email },
      to: draftData.to || [],
      cc: draftData.cc,
      bcc: draftData.bcc,
      subject: draftData.subject || '(No Subject)',
      body: draftData.body || '',
      snippet: (draftData.body || '').slice(0, 100) + '...',
      timestamp: 'Draft saved',
      date: new Date().toISOString().split('T')[0],
      folder: 'DRAFTS',
      isRead: true,
      isStarred: false,
      isImportant: false,
      priority: draftData.priority || 'Normal',
      labels: draftData.labels || ['Work'],
      attachments: draftData.attachments || []
    };

    set((state) => {
      const existingThreadIndex = state.emailThreads.findIndex(t => t.id === threadId);
      let updatedThreads = [...state.emailThreads];

      const participants = [
        { name: sender.name, email: sender.email },
        ...(draftData.to || []),
        ...(draftData.cc || [])
      ];
      const uniqueParticipants = Array.from(
        new Map(participants.map(p => [p.email.toLowerCase(), p])).values()
      );

      if (existingThreadIndex >= 0) {
        updatedThreads[existingThreadIndex] = {
          ...updatedThreads[existingThreadIndex],
          subject: draftMsg.subject,
          snippet: draftMsg.snippet,
          participants: uniqueParticipants,
          folder: 'DRAFTS',
          hasAttachments: (draftMsg.attachments?.length || 0) > 0,
          messages: [draftMsg]
        };
      } else {
        const newThread: EmailThread = {
          id: threadId,
          subject: draftMsg.subject,
          snippet: draftMsg.snippet,
          lastMessageTimestamp: 'Draft saved',
          lastSenderName: sender.name,
          messageCount: 1,
          participants: uniqueParticipants,
          isUnread: false,
          isStarred: false,
          isImportant: false,
          priority: 'Normal',
          labels: ['Work'],
          folder: 'DRAFTS',
          hasAttachments: (draftMsg.attachments?.length || 0) > 0,
          messages: [draftMsg]
        };
        updatedThreads = [newThread, ...updatedThreads];
      }

      return {
        emailThreads: updatedThreads,
        emails: [draftMsg, ...state.emails.filter(e => e.id !== draftId && e.threadId !== threadId)]
      };
    });

    get().showToast('Draft saved successfully', 'info');
  },

  deleteDraft: (draftId) => {
    set((state) => ({
      emailThreads: state.emailThreads.filter(t => t.id !== draftId),
      emails: state.emails.filter(e => e.id !== draftId && e.threadId !== draftId),
      selectedEmailThreadId: state.selectedEmailThreadId === draftId ? null : state.selectedEmailThreadId
    }));
    get().showToast('Draft discarded', 'info');
  },

  moveThreadToFolder: (threadId, folder) => {
    set((state) => ({
      emailThreads: state.emailThreads.map(t =>
        t.id === threadId
          ? { ...t, folder, messages: t.messages.map(m => ({ ...m, folder })) }
          : t
      )
    }));
    get().showToast(`Moved conversation to ${folder.toLowerCase()}`, 'info');
  },

  bulkMoveThreadsToFolder: (threadIds, folder) => {
    set((state) => ({
      emailThreads: state.emailThreads.map(t =>
        threadIds.includes(t.id)
          ? { ...t, folder, messages: t.messages.map(m => ({ ...m, folder })) }
          : t
      )
    }));
    get().showToast(`Moved ${threadIds.length} conversations to ${folder.toLowerCase()}`, 'info');
  },

  toggleStarThread: (threadId) => {
    set((state) => ({
      emailThreads: state.emailThreads.map(t =>
        t.id === threadId ? { ...t, isStarred: !t.isStarred } : t
      )
    }));
  },

  toggleImportantThread: (threadId) => {
    set((state) => ({
      emailThreads: state.emailThreads.map(t =>
        t.id === threadId ? { ...t, isImportant: !t.isImportant } : t
      )
    }));
  },

  markThreadRead: (threadId, isRead) => {
    set((state) => ({
      emailThreads: state.emailThreads.map(t =>
        t.id === threadId
          ? { ...t, isUnread: !isRead, messages: t.messages.map(m => ({ ...m, isRead })) }
          : t
      )
    }));
  },

  bulkMarkThreadsRead: (threadIds, isRead) => {
    set((state) => ({
      emailThreads: state.emailThreads.map(t =>
        threadIds.includes(t.id)
          ? { ...t, isUnread: !isRead, messages: t.messages.map(m => ({ ...m, isRead })) }
          : t
      )
    }));
  },

  addLabelToThread: (threadId, label) => {
    set((state) => ({
      emailThreads: state.emailThreads.map(t =>
        t.id === threadId && !t.labels.includes(label)
          ? { ...t, labels: [...t.labels, label] }
          : t
      )
    }));
    get().showToast(`Added label "${label}"`, 'info');
  },

  removeLabelFromThread: (threadId, label) => {
    set((state) => ({
      emailThreads: state.emailThreads.map(t =>
        t.id === threadId
          ? { ...t, labels: t.labels.filter(l => l !== label) }
          : t
      )
    }));
  },

  linkEmailToProject: (threadId, projectId, projectName) => {
    set((state) => {
      const updatedThreads = state.emailThreads.map(t =>
        t.id === threadId
          ? {
              ...t,
              relatedProjectId: projectId,
              relatedProjectName: projectName,
              labels: t.labels.includes('Project') ? t.labels : [...t.labels, 'Project'],
              messages: t.messages.map(m => ({ ...m, relatedProjectId: projectId, relatedProjectName: projectName }))
            }
          : t
      );

      const targetThread = state.emailThreads.find(t => t.id === threadId);
      const newActivity: ActivityLog = {
        id: `act-${Date.now()}`,
        entityType: 'Project',
        entityId: projectId,
        entityName: projectName,
        date: new Date().toISOString().split('T')[0],
        action: `Email thread "${targetThread?.subject || 'Communication'}" linked to project timeline`,
        user: state.currentUser.name
      };

      return {
        emailThreads: updatedThreads,
        activities: [newActivity, ...state.activities]
      };
    });

    get().showToast(`Conversation linked to ${projectName}!`, 'success');
  },

  createTaskFromEmail: (threadId, taskData) => {
    get().addTask({
      title: taskData.title,
      projectId: taskData.projectId,
      projectName: taskData.projectName,
      assignedTo: taskData.assignedTo,
      priority: taskData.priority,
      status: 'TODO',
      dueDate: taskData.dueDate,
      estimatedHours: taskData.estimatedHours,
      description: taskData.description
    });

    set((state) => ({
      emailThreads: state.emailThreads.map(t =>
        t.id === threadId
          ? {
              ...t,
              labels: t.labels.includes('Task') ? t.labels : [...t.labels, 'Task'],
              messages: t.messages.map(m => ({ ...m, createdTaskId: `TSK-${state.tasks.length + 101}` }))
            }
          : t
      )
    }));

    get().showToast(`Task "${taskData.title}" created from email!`, 'success');
  },

  saveEmailAttachmentToDocuments: (attachment, category, relatedEntity) => {
    const newDoc: AppDocument = {
      id: `DOC-${String(get().documents.length + 1).padStart(3, '0')}`,
      title: attachment.filename,
      category: category || 'Project Documents',
      fileType: (attachment.fileType === 'PDF' || attachment.fileType === 'DOCX' || attachment.fileType === 'ZIP' ? attachment.fileType : 'PDF'),
      size: attachment.size,
      date: new Date().toISOString().split('T')[0],
      owner: get().currentUser.name,
      relatedEntity: relatedEntity || 'Project Nexus'
    };

    set((state) => ({
      documents: [newDoc, ...state.documents]
    }));

    get().showToast(`Attachment "${attachment.filename}" saved to Documents (${newDoc.category})`, 'success');
  },

  setActiveMailFolder: (folder) => set({ activeMailFolder: folder, selectedMailLabel: null }),
  setSelectedEmailThreadId: (threadId) => {
    set({ selectedEmailThreadId: threadId });
    if (threadId) {
      get().markThreadRead(threadId, true);
    }
  },
  setActiveEmailAccountEmail: (email) => set({ activeEmailAccountEmail: email }),
  setMailSearchQuery: (query) => set({ mailSearchQuery: query }),
  setSelectedMailLabel: (label) => set({ selectedMailLabel: label }),
  setMailComposeOpen: (open, initialData = null) => set({ isMailComposeOpen: open, mailComposeInitialData: initialData }),
  setMailSettingsOpen: (open) => set({ isMailSettingsOpen: open }),
  setMailTemplatesOpen: (open) => set({ isMailTemplatesOpen: open }),
  updateEmailSignature: (userId, content) => {
    set((state) => ({
      emailSignatures: state.emailSignatures.map(s =>
        s.userId === userId ? { ...s, content } : s
      )
    }));
    get().showToast('Email signature updated', 'success');
  },

  addLead: (leadData) => {
    const newLead: Lead = {
      ...leadData,
      id: `KAP-${String(get().leads.length + 1).padStart(3, '0')}`,
      created: new Date().toISOString().split('T')[0],
      score: 85
    };
    set((state) => ({ leads: [newLead, ...state.leads] }));
    get().showToast(`Lead ${newLead.name} created successfully!`, 'success');
  },

  updateLeadStatus: (id, status) => {
    set((state) => ({
      leads: state.leads.map(l => l.id === id ? { ...l, status } : l)
    }));
    get().showToast(`Lead status updated to "${status}"`, 'info');
  },

  addCompany: (compData) => {
    const newCompany: Company = {
      ...compData,
      id: `comp-${get().companies.length + 1}`,
      contactsCount: 0,
      dealsCount: 0,
      activeProjects: 0,
      totalRevenue: '₹0',
      contacts: []
    };
    set((state) => ({ companies: [newCompany, ...state.companies] }));
    get().showToast(`Company "${newCompany.name}" added to CRM`, 'success');
  },

  addContact: (cntData) => {
    const newContact: Contact = {
      ...cntData,
      id: `cnt-${get().contacts.length + 1}`,
      lastContacted: new Date().toISOString().split('T')[0]
    };
    set((state) => ({ contacts: [newContact, ...state.contacts] }));
    get().showToast(`Contact ${newContact.name} added`, 'success');
  },

  addDeal: (dealData) => {
    const newDeal: Deal = {
      ...dealData,
      id: `DEAL-${get().deals.length + 101}`,
      created: new Date().toISOString().split('T')[0]
    };
    set((state) => ({ deals: [newDeal, ...state.deals] }));
    get().showToast(`Deal "${newDeal.title}" created in pipeline`, 'success');
  },

  updateDealStage: (id, stage) => {
    set((state) => ({
      deals: state.deals.map(d => d.id === id ? { ...d, stage } : d)
    }));
    get().showToast(`Deal stage updated to ${stage}`, 'info');
  },

  addProposal: (propData) => {
    const newProp: Proposal = {
      ...propData,
      id: `PROP-2026-${String(get().proposals.length + 1).padStart(2, '0')}`,
      created: new Date().toISOString().split('T')[0],
      status: 'Sent'
    };
    set((state) => ({ proposals: [newProp, ...state.proposals] }));
    get().showToast(`Proposal "${newProp.title}" generated & sent!`, 'success');
  },

  addProject: (prjData) => {
    const newProject: Project = {
      ...prjData,
      id: `PRJ-${String(get().projects.length + 1).padStart(3, '0')}`,
      spentBudget: 0,
      progress: 0,
      status: 'Planning',
      milestones: [
        { id: `m-${Date.now()}-1`, name: 'Discovery & Requirements', progress: 100, dueDate: new Date().toISOString().split('T')[0], status: 'Completed' },
        { id: `m-${Date.now()}-2`, name: 'System Architecture', progress: 0, dueDate: prjData.deadline, status: 'In Progress' }
      ],
      profitability: {
        revenue: prjData.budget,
        employeeCost: 0,
        cloudCost: 0,
        aiApiCost: 0,
        otherCost: 0,
        grossProfit: prjData.budget,
        grossMargin: 100.0
      }
    };
    set((state) => ({ projects: [newProject, ...state.projects] }));
    get().showToast(`Project "${newProject.name}" created successfully!`, 'success');
  },

  addTask: (taskData) => {
    const newTask: Task = {
      ...taskData,
      id: `TSK-${get().tasks.length + 101}`,
      loggedHours: 0
    };
    set((state) => ({ tasks: [newTask, ...state.tasks] }));
    get().showToast(`Task "${newTask.title}" assigned to ${newTask.assignedTo}`, 'success');
  },

  updateTaskStatus: (id, status) => {
    set((state) => {
      const updatedTasks = state.tasks.map(t => t.id === id ? { ...t, status } : t);
      
      // Calculate new project completion % if task is updated
      const targetTask = state.tasks.find(t => t.id === id);
      if (targetTask) {
        const projTasks = updatedTasks.filter(t => t.projectId === targetTask.projectId);
        const completedCount = projTasks.filter(t => t.status === 'COMPLETED').length;
        const newProgress = Math.round((completedCount / (projTasks.length || 1)) * 100);
        
        return {
          tasks: updatedTasks,
          projects: state.projects.map(p => p.id === targetTask.projectId ? { ...p, progress: newProgress } : p)
        };
      }
      return { tasks: updatedTasks };
    });
    get().showToast(`Task status updated to ${status}`, 'info');
  },

  addEmployee: (empData) => {
    const newEmp: Employee = {
      ...empData,
      id: `emp-${get().employees.length + 101}`,
      projectsCount: 1,
      utilization: 80,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    };
    set((state) => ({ employees: [newEmp, ...state.employees] }));
    get().showToast(`Employee ${newEmp.name} onboarded successfully`, 'success');
  },

  addIntern: (internData) => {
    const newIntern: Intern = {
      ...internData,
      id: `int-${get().interns.length + 201}`,
      tasksCompleted: 0,
      tasksPending: 3,
      loggedHours: 0,
      attendancePct: 100,
      trainingProgress: 10,
      status: 'Active',
      evaluations: {
        technicalSkills: 85,
        problemSolving: 85,
        communication: 90,
        teamwork: 90,
        learning: 95,
        taskCompletion: 80
      }
    };
    set((state) => ({ interns: [newIntern, ...state.interns] }));
    get().showToast(`Intern ${newIntern.name} registered under mentor ${newIntern.mentor}`, 'success');
  },

  addTimesheet: (tsData) => {
    const newTS: TimesheetEntry = {
      ...tsData,
      id: `ts-${Date.now()}`,
      status: 'Submitted',
      employeeName: get().currentUser.name
    };
    set((state) => ({ timesheets: [newTS, ...state.timesheets] }));
    get().showToast(`Timesheet submitted for ${newTS.hours} billable hours`, 'success');
  },

  approveTimesheet: (id) => {
    set((state) => ({
      timesheets: state.timesheets.map(t => t.id === id ? { ...t, status: 'Approved' } : t)
    }));
    get().showToast('Timesheet approved!', 'success');
  },

  addLeave: (leaveData) => {
    const newLeave: LeaveRequest = {
      ...leaveData,
      id: `lv-${Date.now()}`,
      status: 'Pending'
    };
    set((state) => ({ leaves: [newLeave, ...state.leaves] }));
    get().showToast('Leave request submitted to manager', 'info');
  },

  approveLeave: (id, approve) => {
    set((state) => ({
      leaves: state.leaves.map(l => l.id === id ? { ...l, status: approve ? 'Approved' : 'Rejected' } : l)
    }));
    get().showToast(`Leave request ${approve ? 'Approved' : 'Rejected'}`, approve ? 'success' : 'warning');
  },

  addInvoice: (invData) => {
    const items = invData.items || [];
    const amount = items.reduce((sum, item) => sum + item.amount, 0);
    const tax = Math.round(amount * 0.18);
    const total = amount + tax;

    const newInv: Invoice = {
      ...invData,
      id: `INV-2026-${String(get().invoices.length + 1).padStart(3, '0')}`,
      status: 'Sent',
      amount,
      tax,
      total,
      items
    };
    set((state) => ({ invoices: [newInv, ...state.invoices] }));
    get().showToast(`Invoice ${newInv.id} created for ₹${(total / 100000).toFixed(2)}L`, 'success');
  },

  markInvoicePaid: (id) => {
    set((state) => {
      const target = state.invoices.find(i => i.id === id);
      const paidDate = new Date().toISOString().split('T')[0];
      const updatedInvoices = state.invoices.map(i => i.id === id ? { ...i, status: 'Paid' as const, paidDate, paymentReference: 'DEMO-PAY-8849' } : i);
      
      const newPayment: Payment = {
        id: `PMT-${Date.now()}`,
        invoiceId: id,
        client: target?.client || 'Client',
        amount: target?.total || 0,
        date: paidDate,
        method: 'Bank Transfer',
        reference: 'DEMO-PAY-8849'
      };

      return {
        invoices: updatedInvoices,
        payments: [newPayment, ...state.payments]
      };
    });
    get().showToast(`Invoice ${id} marked as PAID. Payment logged!`, 'success');
  },

  addExpense: (expData: any) => {
    const newExp: Expense = {
      ...expData,
      id: `EXP-${get().expenses.length + 1}`,
      status: 'Paid'
    };
    set((state) => ({ expenses: [newExp, ...state.expenses] }));
    get().showToast(`Expense ₹${newExp.amount.toLocaleString('en-IN')} logged under ${newExp.category}`, 'success');
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  },

  resetDemoData: () => {
    set({
      leads: INITIAL_LEADS,
      companies: INITIAL_COMPANIES,
      contacts: INITIAL_CONTACTS,
      deals: INITIAL_DEALS,
      proposals: INITIAL_PROPOSALS,
      contracts: INITIAL_CONTRACTS,
      projects: INITIAL_PROJECTS,
      tasks: INITIAL_TASKS,
      employees: INITIAL_EMPLOYEES,
      interns: INITIAL_INTERNS,
      freelancers: INITIAL_FREELANCERS,
      resources: INITIAL_RESOURCES,
      timesheets: INITIAL_TIMESHEETS,
      attendance: INITIAL_ATTENDANCE,
      leaves: INITIAL_LEAVES,
      invoices: INITIAL_INVOICES,
      payments: INITIAL_PAYMENTS,
      expenses: INITIAL_EXPENSES,
      notifications: INITIAL_NOTIFICATIONS,
      activities: INITIAL_ACTIVITIES,
      documents: INITIAL_DOCUMENTS,
      registrationRequests: INITIAL_REGISTRATION_REQUESTS,
      onboardingInvitations: INITIAL_ONBOARDING_INVITATIONS,
      securityEvents: INITIAL_SECURITY_EVENTS
    });
    get().showToast('Demo environment reset to initial sample state', 'info');
  },

  // =========================================================================
  // IDENTITY, ONBOARDING & SECURITY ENGINE
  // =========================================================================
  registrationRequests: INITIAL_REGISTRATION_REQUESTS,
  onboardingInvitations: INITIAL_ONBOARDING_INVITATIONS,
  securityEvents: INITIAL_SECURITY_EVENTS,
  isSecurityDashboardOpen: false,
  isOnboardModalOpen: false,
  setSecurityDashboardOpen: (open) => set({ isSecurityDashboardOpen: open }),
  setOnboardModalOpen: (open) => set({ isOnboardModalOpen: open }),

  submitRegistrationRequest: (data) => {
    const nextSeq = get().registrationRequests.length + 1;
    const newReq: RegistrationRequest = {
      id: `REQ-${String(nextSeq).padStart(3, '0')}`,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      applicationId: data.applicationId || `APP-2026-${String(100 + nextSeq)}`,
      requestedType: data.requestedType || 'EMPLOYEE',
      status: 'PENDING',
      notes: data.notes || 'Applicant registration submitted via portal.',
      created: new Date().toISOString().split('T')[0]
    };

    const newEvent: SecurityEvent = {
      id: `SEC-${Date.now()}`,
      action: 'REGISTRATION_REQUEST_CREATED',
      actor: 'Public Applicant',
      target: `${data.fullName} (${data.email})`,
      details: `New onboarding request queued. Status: PENDING. System role and permissions must be assigned by Admin.`,
      severity: 'info',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    set((state) => ({
      registrationRequests: [newReq, ...state.registrationRequests],
      securityEvents: [newEvent, ...state.securityEvents]
    }));

    return { success: true, request: newReq };
  },

  approveRegistrationRequest: (requestId, role, department, manager, designation, employmentType) => {
    const req = get().registrationRequests.find(r => r.id === requestId);
    if (!req) return { success: false, invitation: null as any };

    const isIntern = employmentType === 'INTERN' || role === 'INTERN';
    const isFreelancer = employmentType === 'FREELANCER';
    const prefix = isIntern ? 'INT' : isFreelancer ? 'FRL' : 'EMP';
    
    // Count existing to generate atomic-style ID
    const count = (isIntern ? get().interns.length : get().employees.length) + 1;
    const kapateId = `KAP-${prefix}-${String(count).padStart(6, '0')}`;
    
    // Provision internal company email
    const baseName = req.fullName.split(' ')[0].toLowerCase();
    const internalEmail = `${baseName}@kapateconsultancy.com`;

    const token = `inv_tok_${Math.random().toString(36).substring(2, 12)}`;
    const expiresAt = new Date(Date.now() + 72 * 3600 * 1000).toISOString();

    const newInv: OnboardingInvitation = {
      id: `INV-${Date.now().toString().slice(-4)}`,
      token,
      email: req.email,
      fullName: req.fullName,
      assignedRole: role,
      department,
      manager,
      designation,
      employmentType,
      kapateId,
      internalEmail,
      expiresAt,
      isUsed: false,
      isRevoked: false,
      created: new Date().toISOString().split('T')[0]
    };

    // Add to workforce list in 'Inactive' / invited state
    if (isIntern) {
      const newIntern: Intern = {
        id: `INT-${count}`,
        name: req.fullName,
        role: designation,
        college: 'University Partner Institution',
        mentor: manager,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '2026-12-31',
        status: 'Active',
        email: internalEmail,
        kapateId,
        internalEmail,
        tasksCompleted: 0,
        tasksPending: 0,
        loggedHours: 0,
        attendancePct: 100,
        trainingProgress: 10,
        mentorFeedback: 'Candidate successfully approved. Mentorship initialized.',
        evaluations: {
          technicalSkills: 80,
          problemSolving: 85,
          communication: 90,
          teamwork: 85,
          learning: 95,
          taskCompletion: 80
        }
      };
      set((state) => ({ interns: [newIntern, ...state.interns] }));
    } else {
      const newEmployee: Employee = {
        id: `EMP-${count}`,
        name: req.fullName,
        role: designation,
        department,
        status: 'Active',
        email: internalEmail,
        phone: req.phone || '+91 98000 00000',
        manager,
        skills: ['Full Stack', 'Cloud', 'AI Solutions'],
        projectsCount: 1,
        utilization: 80,
        joinDate: new Date().toISOString().split('T')[0],
        kapateId,
        internalEmail
      };
      set((state) => ({ employees: [newEmployee, ...state.employees] }));
    }

    const newEvent: SecurityEvent = {
      id: `SEC-${Date.now()}`,
      action: 'REGISTRATION_APPROVED',
      actor: get().currentUser.name,
      target: `${req.fullName} (${kapateId})`,
      details: `Approved application. Assigned role: ${role}. Provisioned ${internalEmail}. Generated invitation token.`,
      severity: 'success',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    set((state) => ({
      registrationRequests: state.registrationRequests.map(r => r.id === requestId ? {
        ...r,
        status: 'APPROVED',
        reviewedAt: new Date().toISOString().split('T')[0],
        reviewedBy: get().currentUser.name
      } : r),
      onboardingInvitations: [newInv, ...state.onboardingInvitations],
      securityEvents: [newEvent, ...state.securityEvents]
    }));

    get().showToast(`Approved ${req.fullName}! Assigned Kapate ID ${kapateId}`, 'success');
    return { success: true, invitation: newInv };
  },

  rejectRegistrationRequest: (requestId, reason) => {
    const req = get().registrationRequests.find(r => r.id === requestId);
    if (!req) return;

    const newEvent: SecurityEvent = {
      id: `SEC-${Date.now()}`,
      action: 'REGISTRATION_REJECTED',
      actor: get().currentUser.name,
      target: req.fullName,
      details: `Application rejected. Reason: ${reason || 'Does not match current criteria.'}`,
      severity: 'warning',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    set((state) => ({
      registrationRequests: state.registrationRequests.map(r => r.id === requestId ? {
        ...r,
        status: 'REJECTED',
        rejectionReason: reason || 'Requirements not met',
        reviewedAt: new Date().toISOString().split('T')[0],
        reviewedBy: get().currentUser.name
      } : r),
      securityEvents: [newEvent, ...state.securityEvents]
    }));

    get().showToast(`Registration request for ${req.fullName} was rejected.`, 'info');
  },

  onboardPersonnel: (data) => {
    const isIntern = data.employmentType === 'INTERN' || data.role === 'INTERN';
    const isFreelancer = data.employmentType === 'FREELANCER';
    const prefix = isIntern ? 'INT' : isFreelancer ? 'FRL' : 'EMP';
    const count = (isIntern ? get().interns.length : get().employees.length) + 1;
    const kapateId = `KAP-${prefix}-${String(count).padStart(6, '0')}`;
    
    const baseName = data.fullName.split(' ')[0].toLowerCase();
    const internalEmail = `${baseName}@kapateconsultancy.com`;

    const token = `inv_tok_${Math.random().toString(36).substring(2, 12)}`;
    const expiresAt = new Date(Date.now() + 72 * 3600 * 1000).toISOString();

    const newInv: OnboardingInvitation = {
      id: `INV-${Date.now().toString().slice(-4)}`,
      token,
      email: data.email,
      fullName: data.fullName,
      assignedRole: data.role,
      department: data.department,
      manager: data.manager,
      designation: data.designation,
      employmentType: data.employmentType,
      kapateId,
      internalEmail,
      expiresAt,
      isUsed: false,
      isRevoked: false,
      created: new Date().toISOString().split('T')[0]
    };

    if (isIntern) {
      const newIntern: Intern = {
        id: `INT-${count}`,
        name: data.fullName,
        role: data.designation,
        college: 'University Partner Institution',
        mentor: data.manager,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '2026-12-31',
        status: 'Active',
        email: internalEmail,
        kapateId,
        internalEmail,
        tasksCompleted: 0,
        tasksPending: 0,
        loggedHours: 0,
        attendancePct: 100,
        trainingProgress: 10,
        mentorFeedback: 'Directly onboarded by Administration. Welcome!',
        evaluations: {
          technicalSkills: 85,
          problemSolving: 85,
          communication: 90,
          teamwork: 90,
          learning: 95,
          taskCompletion: 85
        }
      };
      set((state) => ({ interns: [newIntern, ...state.interns] }));
    } else {
      const newEmployee: Employee = {
        id: `EMP-${count}`,
        name: data.fullName,
        role: data.designation,
        department: data.department,
        status: 'Active',
        email: internalEmail,
        phone: data.phone || '+91 98000 00000',
        manager: data.manager,
        skills: data.skills && data.skills.length > 0 ? data.skills : ['Solutions', 'Cloud', 'Engineering'],
        projectsCount: 1,
        utilization: 80,
        joinDate: new Date().toISOString().split('T')[0],
        kapateId,
        internalEmail
      };
      set((state) => ({ employees: [newEmployee, ...state.employees] }));
    }

    const newEvent: SecurityEvent = {
      id: `SEC-${Date.now()}`,
      action: 'ONBOARD_PERSONNEL_CREATED',
      actor: get().currentUser.name,
      target: `${data.fullName} (${kapateId})`,
      details: `Direct onboarding initiated. Role: ${data.role}. Internal email: ${internalEmail}. Invitation created.`,
      severity: 'success',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    set((state) => ({
      onboardingInvitations: [newInv, ...state.onboardingInvitations],
      securityEvents: [newEvent, ...state.securityEvents]
    }));

    get().showToast(`Onboarded ${data.fullName}! Assigned Kapate ID ${kapateId}`, 'success');
    return { success: true, invitation: newInv };
  },

  acceptInvitation: (token, password) => {
    const inv = get().onboardingInvitations.find(i => i.token === token);
    if (!inv) {
      return { success: false, error: 'Invalid or unrecognized invitation token.' };
    }
    if (inv.isRevoked) {
      return { success: false, error: 'This invitation has been revoked by Kapate administration.' };
    }
    if (inv.isUsed) {
      return { success: false, error: 'This invitation has already been accepted and activated.' };
    }

    // Create / activate user account
    const activatedUser: User = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: inv.fullName,
      email: inv.email,
      role: inv.assignedRole,
      designation: inv.designation,
      department: inv.department,
      kapateId: inv.kapateId,
      internalEmail: inv.internalEmail,
      status: 'ACTIVE'
    };

    // Auto-provision corporate email account in mail system if not present
    const existingMailAccount = get().emailAccounts.find(a => a.email === inv.internalEmail);
    if (!existingMailAccount) {
      const newMailAccount: EmailAccount = {
        id: `acc-${Date.now().toString().slice(-4)}`,
        userId: activatedUser.id,
        email: inv.internalEmail,
        name: inv.fullName,
        designation: inv.designation,
        department: inv.department,
        isShared: false,
        quotaUsedMB: 120,
        quotaTotalMB: 10240
      };
      set((state) => ({ emailAccounts: [...state.emailAccounts, newMailAccount] }));
    }

    // Add welcome notification
    const notif: Notification = {
      id: `NOTIF-${Date.now()}`,
      title: 'Welcome to Kapate OS!',
      message: `Your account is active. Your assigned Kapate ID is ${inv.kapateId} and your corporate email is ${inv.internalEmail}.`,
      timestamp: 'Just now',
      time: 'Just now',
      type: 'system',
      read: false
    };

    const newEvent: SecurityEvent = {
      id: `SEC-${Date.now()}`,
      action: 'INVITATION_ACCEPTED',
      actor: inv.fullName,
      target: `${inv.fullName} (${inv.kapateId})`,
      details: `Invitation accepted with password setup. Account status -> ACTIVE. Mailbox provisioned.`,
      severity: 'success',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    set((state) => ({
      currentUser: activatedUser,
      isAuthenticated: true,
      onboardingInvitations: state.onboardingInvitations.map(i => i.id === inv.id ? { ...i, isUsed: true } : i),
      notifications: [notif, ...state.notifications],
      securityEvents: [newEvent, ...state.securityEvents]
    }));

    get().showToast(`Welcome ${inv.fullName}! Your account is now active.`, 'success');
    return { success: true, user: activatedUser };
  },

  revokeInvitation: (invitationId) => {
    const inv = get().onboardingInvitations.find(i => i.id === invitationId);
    if (!inv) return;

    const newEvent: SecurityEvent = {
      id: `SEC-${Date.now()}`,
      action: 'INVITATION_REVOKED',
      actor: get().currentUser.name,
      target: inv.fullName,
      details: `Revoked onboarding invitation token for ${inv.email}. Token invalidated.`,
      severity: 'warning',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    set((state) => ({
      onboardingInvitations: state.onboardingInvitations.map(i => i.id === invitationId ? { ...i, isRevoked: true } : i),
      securityEvents: [newEvent, ...state.securityEvents]
    }));

    get().showToast(`Revoked invitation for ${inv.fullName}`, 'info');
  },

  changeUserRole: (userId, newRole) => {
    const actor = get().currentUser;
    if (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
      get().showToast('Permission denied: Only administrators can modify roles.', 'error');
      return { success: false, error: 'Unauthorized' };
    }

    const newEvent: SecurityEvent = {
      id: `SEC-${Date.now()}`,
      action: 'ROLE_MODIFIED',
      actor: actor.name,
      target: `User ${userId}`,
      details: `Updated system role to ${newRole}. Privilege boundaries updated.`,
      severity: 'alert',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    set((state) => ({
      employees: state.employees.map(e => e.id === userId ? { ...e, role: newRole } : e),
      securityEvents: [newEvent, ...state.securityEvents]
    }));

    get().showToast(`User role updated to ${newRole}`, 'success');
    return { success: true };
  },

  changeUserStatus: (userId, newStatus, reason) => {
    const actor = get().currentUser;
    if (actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
      get().showToast('Permission denied: Only administrators can change account status.', 'error');
      return;
    }

    const newEvent: SecurityEvent = {
      id: `SEC-${Date.now()}`,
      action: `ACCOUNT_STATUS_${newStatus}`,
      actor: actor.name,
      target: `User ${userId}`,
      details: `Account status transitioned to ${newStatus}. Reason: ${reason || 'Administrative action'}.`,
      severity: newStatus === 'ACTIVE' ? 'success' : 'alert',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    set((state) => ({
      employees: state.employees.map(e => e.id === userId ? { ...e, status: newStatus === 'ACTIVE' ? 'Active' : 'Inactive' } : e),
      securityEvents: [newEvent, ...state.securityEvents]
    }));

    get().showToast(`Account status set to ${newStatus}`, 'info');
  },

  addTaskWithNotification: (taskData) => {
    const actor = get().currentUser;
    if (actor.role === 'CLIENT') {
      get().showToast('Permission denied: Clients cannot assign internal tasks directly.', 'error');
      return { success: false, error: 'Clients cannot assign internal employee tasks directly.' };
    }

    if (actor.role === 'INTERN') {
      const isAssigningToAdmin = taskData.assignedTo.includes('Shon') || taskData.assignedTo.includes('Amit') || taskData.assigneeRole === 'ADMIN' || taskData.assigneeRole === 'MANAGER';
      if (isAssigningToAdmin) {
        get().showToast('Permission denied: Interns cannot assign tasks to managers or administrators.', 'error');
        return { success: false, error: 'Interns cannot assign tasks to managers or administrators.' };
      }
    }

    const taskId = `TSK-${String(get().tasks.length + 1).padStart(3, '0')}`;
    const newTask: Task = {
      ...taskData,
      id: taskId,
      loggedHours: 0
    };

    // Create in-app notification for the assignee
    const notif: Notification = {
      id: `NOTIF-${Date.now()}`,
      title: `New Task: ${taskData.title}`,
      message: `Assigned by ${actor.name} on ${taskData.projectName}. Due: ${taskData.dueDate}`,
      timestamp: 'Just now',
      time: 'Just now',
      type: 'task',
      read: false
    };

    // Auto-generate internal email notification to the assignee
    const assigneeEmail = `${taskData.assignedTo.split(' ')[0].toLowerCase()}@kapateconsultancy.com`;
    const emailSubject = `New Task Assigned — ${taskData.projectName}`;
    const emailBody = `Hello ${taskData.assignedTo},\n\nA new delivery task has been assigned to you by ${actor.name}.\n\nProject: ${taskData.projectName}\nTask: ${taskData.title}\nPriority: ${taskData.priority}\nDue Date: ${taskData.dueDate}\n\nPlease review and track your progress in Kapate OS.`;

    const newThreadId = `thread-task-${Date.now()}`;
    const taskPriority: EmailPriority = taskData.priority === 'Urgent' ? 'Urgent' : taskData.priority === 'High' ? 'Important' : 'Normal';

    const newMailMsg: EmailMessage = {
      id: `msg-task-${Date.now()}`,
      threadId: newThreadId,
      from: { name: actor.name, email: actor.email || 'system@kapateconsultancy.com', avatar: actor.avatar },
      to: [{ name: taskData.assignedTo, email: assigneeEmail, type: 'TO' }],
      subject: emailSubject,
      body: emailBody,
      snippet: `A new delivery task has been assigned to you by ${actor.name}.`,
      timestamp: 'Just now',
      date: new Date().toISOString().split('T')[0],
      priority: taskPriority,
      folder: 'INBOX',
      isRead: false,
      isStarred: false,
      isImportant: true,
      labels: ['Project', 'Work'],
      attachments: [],
      relatedProjectId: taskData.projectId,
      relatedProjectName: taskData.projectName
    };

    const newThread: EmailThread = {
      id: newThreadId,
      subject: emailSubject,
      snippet: newMailMsg.snippet,
      lastMessageTimestamp: 'Just now',
      lastSenderName: actor.name,
      messageCount: 1,
      unreadCount: 1,
      folder: 'INBOX',
      isStarred: false,
      isImportant: true,
      isUnread: true,
      hasAttachments: false,
      priority: taskPriority,
      labels: ['Project', 'Work'],
      participants: [
        { name: actor.name, email: actor.email || 'system@kapateconsultancy.com', avatar: actor.avatar },
        { name: taskData.assignedTo, email: assigneeEmail }
      ],
      messages: [newMailMsg],
      relatedProjectId: taskData.projectId,
      relatedProjectName: taskData.projectName
    };

    set((state) => ({
      tasks: [newTask, ...state.tasks],
      notifications: [notif, ...state.notifications],
      emails: [newMailMsg, ...state.emails],
      emailThreads: [newThread, ...state.emailThreads]
    }));

    get().showToast(`Task assigned to ${taskData.assignedTo}. In-app and internal email notifications dispatched.`, 'success');
    return { success: true };
  }
}));
