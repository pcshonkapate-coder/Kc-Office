import fs from 'fs';
import path from 'path';
import type {
  Employee, Intern, Freelancer, User, SecuritySession, AuditLogEntry, UserRole,
  RegistrationRequest, OnboardingInvitation, Project, Task, Lead, Company, Contact,
  Deal, DealStage, Proposal, Contract, TimesheetEntry, AttendanceRecord, LeaveRequest, Invoice,
  Payment, Expense, AppDocument, SystemSettings
} from '../types';
import { hashPassword } from './auth';
import { getDatabase } from './mongodb';
import { DEFAULT_SYSTEM_SETTINGS, DEFAULT_ROLE_PERMISSIONS } from '../data/superAdminData';

export interface ActiveClockSession {
  userId: string;
  employeeName: string;
  kapateId: string;
  clockInTimestamp: number;
  clockInFormatted: string;
  date: string;
}

export interface StoreSchema {
  version: number;
  lastUpdated: string;
  users: (User & { passwordHash?: string })[];
  employees: Employee[];
  interns: Intern[];
  freelancers: Freelancer[];
  sessions: SecuritySession[];
  audit_logs: AuditLogEntry[];
  registration_requests: RegistrationRequest[];
  onboarding_invitations: OnboardingInvitation[];
  projects: Project[];
  tasks: Task[];
  leads: Lead[];
  companies: Company[];
  contacts: Contact[];
  deals: Deal[];
  proposals: Proposal[];
  contracts: Contract[];
  timesheets: TimesheetEntry[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  documents: AppDocument[];
  systemSettings?: SystemSettings;
  rolePermissions?: Record<UserRole, string[]>;
  activeClockSessions?: Record<string, ActiveClockSession>;
}

const DEFAULT_STORE: StoreSchema = {
  version: 1,
  lastUpdated: new Date().toISOString(),
  activeClockSessions: {},
  systemSettings: DEFAULT_SYSTEM_SETTINGS,
  rolePermissions: DEFAULT_ROLE_PERMISSIONS,
  projects: [],
  tasks: [],
  leads: [],
  companies: [],
  contacts: [],
  deals: [],
  proposals: [],
  contracts: [],
  timesheets: [],
  attendance: [],
  leaves: [],
  invoices: [],
  payments: [],
  expenses: [],
  documents: [],
  users: [
    {
      id: 'usr-admin',
      name: 'Shon Kapate',
      email: 'admin@kapateconsultancy.in',
      role: 'SUPER_ADMIN' as UserRole,
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
      lastLoginAt: new Date().toISOString(),
      mfaEnabled: true,
      created: '2024-01-01',
      passwordHash: hashPassword('Admin@KC8421174957')
    }
  ],
  employees: [
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
  ],
  interns: [],
  freelancers: [],
  sessions: [
    {
      id: 'sess-001',
      userId: 'usr-admin',
      userName: 'Shon Kapate',
      email: 'admin@kapateconsultancy.in',
      role: 'SUPER_ADMIN',
      ipAddress: '127.0.0.1 (Workstation)',
      userAgent: 'Kapate OS Enterprise Client',
      loginAt: new Date().toISOString(),
      lastActiveAt: 'Just now',
      isImpersonated: false,
      status: 'ACTIVE'
    }
  ],
  audit_logs: [
    {
      id: 'aud-001',
      timestamp: new Date().toISOString(),
      actor: 'Shon Kapate',
      actorKapateId: 'KAP-EMP-000001',
      action: 'SYSTEM_INITIALIZATION',
      module: 'system',
      targetResource: 'store/init',
      targetUser: 'System',
      previousValue: '',
      newValue: 'Production Dual-Tier Persistent Store Activated',
      ipAddress: '127.0.0.1',
      result: 'SUCCESS',
      requestId: 'req-sys-boot',
      reason: 'Standardizing Kapate OS production database persistence'
    }
  ],
  registration_requests: [],
  onboarding_invitations: []
};

class DataStore {
  private inMemoryStore: StoreSchema | null = null;
  private filePath: string;
  private lastLoadedMtime: number = 0;

  constructor() {
    // Determine storage location
    const primaryDir = path.join(process.cwd(), 'data');
    const primaryPath = path.join(primaryDir, 'kapate_store.json');
    const tmpPath = path.join('/tmp', 'kapate_store.json');

    let targetPath = primaryPath;
    try {
      if (process.env.VERCEL) {
        targetPath = tmpPath;
      } else {
        if (!fs.existsSync(primaryDir)) {
          fs.mkdirSync(primaryDir, { recursive: true });
        }
        const testFile = path.join(primaryDir, `.write_test_${Date.now()}`);
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        targetPath = primaryPath;
      }
    } catch {
      targetPath = tmpPath;
    }

    this.filePath = targetPath;

    // In serverless, if /tmp doesn't have the file yet, bootstrap from repository data if available
    if (this.filePath === tmpPath && !fs.existsSync(tmpPath)) {
      try {
        if (fs.existsSync(primaryPath)) {
          fs.copyFileSync(primaryPath, tmpPath);
        }
      } catch (e) {
        console.warn('[DataStore] Notice: bootstrap from primaryPath failed, will use DEFAULT_STORE:', e);
      }
    }

    this.loadStore();
  }

  public loadStore(forceReload: boolean = false): StoreSchema {
    try {
      if (fs.existsSync(this.filePath)) {
        const stat = fs.statSync(this.filePath);
        if (!forceReload && this.inMemoryStore && stat.mtimeMs <= this.lastLoadedMtime) {
          return this.inMemoryStore;
        }

        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed: StoreSchema = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.employees) && Array.isArray(parsed.users)) {
          if (!Array.isArray(parsed.registration_requests)) parsed.registration_requests = [];
          if (!Array.isArray(parsed.onboarding_invitations)) parsed.onboarding_invitations = [];
          if (!Array.isArray(parsed.projects)) parsed.projects = [];
          if (!Array.isArray(parsed.tasks)) parsed.tasks = [];
          if (!Array.isArray(parsed.leads)) parsed.leads = [];
          if (!Array.isArray(parsed.companies)) parsed.companies = [];
          if (!Array.isArray(parsed.contacts)) parsed.contacts = [];
          if (!Array.isArray(parsed.deals)) parsed.deals = [];
          if (!Array.isArray(parsed.proposals)) parsed.proposals = [];
          if (!Array.isArray(parsed.contracts)) parsed.contracts = [];
          if (!Array.isArray(parsed.timesheets)) parsed.timesheets = [];
          if (!Array.isArray(parsed.attendance)) parsed.attendance = [];
          if (!Array.isArray(parsed.leaves)) parsed.leaves = [];
          if (!Array.isArray(parsed.invoices)) parsed.invoices = [];
          if (!Array.isArray(parsed.payments)) parsed.payments = [];
          if (!Array.isArray(parsed.expenses)) parsed.expenses = [];
          if (!Array.isArray(parsed.documents)) parsed.documents = [];
          if (!parsed.systemSettings) parsed.systemSettings = { ...DEFAULT_SYSTEM_SETTINGS };
          if (!parsed.rolePermissions) parsed.rolePermissions = { ...DEFAULT_ROLE_PERMISSIONS };
          // Ensure master admin always exists
          this.ensureMasterAdmin(parsed);
          this.inMemoryStore = parsed;
          this.lastLoadedMtime = stat.mtimeMs;
          return this.inMemoryStore;
        }
      }
    } catch (e) {
      console.warn('[DataStore] Warning reading persistent store file, initializing defaults:', e);
    }

    // Initialize with default if not already initialized
    if (!this.inMemoryStore) {
      const fresh = JSON.parse(JSON.stringify(DEFAULT_STORE)) as StoreSchema;
      this.ensureMasterAdmin(fresh);
      this.inMemoryStore = fresh;
      this.saveStore();
    }
    return this.inMemoryStore;
  }

  private ensureMasterAdmin(store: StoreSchema) {
    // 1. Ensure Super Admin
    const adminIndex = store.users.findIndex(
      u => u.email === 'admin@kapateconsultancy.in' || u.email === 'shon@kapateconsultancy.in'
    );
    if (adminIndex === -1) {
      store.users.unshift(DEFAULT_STORE.users[0]);
    } else {
      store.users[adminIndex].role = 'SUPER_ADMIN';
      store.users[adminIndex].status = 'ACTIVE';
      store.users[adminIndex].failedLogins = 0;
      store.users[adminIndex].lockedUntil = null;
      if (!store.users[adminIndex].passwordHash) {
        store.users[adminIndex].passwordHash = hashPassword('Admin@KC8421174957');
      }
    }

    const empAdminIndex = store.employees.findIndex(
      e => e.email === 'admin@kapateconsultancy.in' || e.email === 'shon@kapateconsultancy.in'
    );
    if (empAdminIndex === -1) {
      store.employees.unshift(DEFAULT_STORE.employees[0]);
    }

    // 2. Ensure Default Employee User
    const empUser = store.users.find(u => u.email === 'employee@kapateconsultancy.in' || u.kapateId === 'KAP-EMP-000002');
    if (!empUser) {
      store.users.push({
        id: 'usr-employee-default',
        name: 'Aarav Deshmukh',
        email: 'employee@kapateconsultancy.in',
        role: 'EMPLOYEE' as UserRole,
        designation: 'Lead Solutions Engineer',
        department: 'Engineering',
        kapateId: 'KAP-EMP-000002',
        internalEmail: 'employee@kapateconsultancy.in',
        status: 'ACTIVE',
        phone: '+91 98230 11223',
        manager: 'Shon Kapate',
        skills: ['Enterprise Architecture', 'React 19', 'Next.js 16', 'FastAPI'],
        assignedProjects: ['PRJ-2026-001'],
        failedLogins: 0,
        lockedUntil: null,
        lastLoginAt: new Date().toISOString(),
        mfaEnabled: false,
        created: '2024-01-01',
        passwordHash: hashPassword('KapateOS@2026')
      });
    } else {
      empUser.status = 'ACTIVE';
      empUser.failedLogins = 0;
      empUser.lockedUntil = null;
    }

    // 3. Ensure Default Project Manager User
    const pmUser = store.users.find(u => u.email === 'manager@kapateconsultancy.in' || u.role === 'PROJECT_MANAGER');
    if (!pmUser) {
      store.users.push({
        id: 'usr-manager-default',
        name: 'Mukul Deshmukh',
        email: 'manager@kapateconsultancy.in',
        role: 'PROJECT_MANAGER' as UserRole,
        designation: 'Lead Delivery Manager',
        department: 'Consulting & Delivery',
        kapateId: 'KAP-EMP-000007',
        internalEmail: 'manager@kapateconsultancy.in',
        status: 'ACTIVE',
        phone: '+91 98230 44556',
        manager: 'Shon Kapate',
        skills: ['Delivery Oversight', 'Kanban Management', 'SOW Execution'],
        assignedProjects: ['PRJ-2026-001', 'PRJ-2026-002'],
        failedLogins: 0,
        lockedUntil: null,
        lastLoginAt: new Date().toISOString(),
        mfaEnabled: false,
        created: '2024-01-01',
        passwordHash: hashPassword('KapateOS@2026')
      });
    } else {
      pmUser.status = 'ACTIVE';
      pmUser.failedLogins = 0;
      pmUser.lockedUntil = null;
    }

    // 4. Ensure Default Intern User
    const internUser = store.users.find(u => u.email === 'intern@kapateconsultancy.in' || u.role === 'INTERN');
    if (!internUser) {
      store.users.push({
        id: 'usr-intern-default',
        name: 'Ananya Roy',
        email: 'intern@kapateconsultancy.in',
        role: 'INTERN' as UserRole,
        designation: 'AI/ML Engineering Intern',
        department: 'Technology & Algorithms',
        kapateId: 'KAP-INT-000001',
        internalEmail: 'intern@kapateconsultancy.in',
        status: 'ACTIVE',
        phone: '+91 98765 11122',
        manager: 'Mukul Deshmukh',
        skills: ['Python 3.11', 'Data Structures', 'Machine Learning'],
        assignedProjects: [],
        failedLogins: 0,
        lockedUntil: null,
        lastLoginAt: new Date().toISOString(),
        mfaEnabled: false,
        created: '2024-01-01',
        passwordHash: hashPassword('KapateOS@2026')
      });
    } else {
      internUser.status = 'ACTIVE';
      internUser.failedLogins = 0;
      internUser.lockedUntil = null;
    }

    // 5. Unsuspend standard employee records if suspended
    store.users.forEach(u => {
      if (['aarav.verma@example.com', 'priya.mehta@kapateconsultancy.in', 'mukul@kapateconsultancy.in', 'vikram.malhotra@kapateconsultancy.in'].includes(u.email)) {
        u.status = 'ACTIVE';
        u.failedLogins = 0;
        u.lockedUntil = null;
      }
    });
  }

  private saveStore() {
    if (!this.inMemoryStore) return;
    this.inMemoryStore.lastUpdated = new Date().toISOString();

    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const tempPath = `${this.filePath}.${Date.now()}.${Math.random().toString(36).substring(2, 7)}.tmp`;
    const dataStr = JSON.stringify(this.inMemoryStore, null, 2);

    try {
      fs.writeFileSync(tempPath, dataStr, 'utf-8');
      try {
        fs.renameSync(tempPath, this.filePath);
      } catch {
        // Fallback for Windows NTFS locking or permission collisions during atomic overwrite
        fs.copyFileSync(tempPath, this.filePath);
        try {
          fs.unlinkSync(tempPath);
        } catch {}
      }
      try {
        this.lastLoadedMtime = fs.statSync(this.filePath).mtimeMs;
      } catch {}
    } catch (e) {
      console.error('[DataStore] Failed to write persistent store file:', e);
    } finally {
      // Ensure temp file is always cleaned up and never leaves orphaned files
      if (fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch {}
      }
    }

    // Asynchronously synchronize with MongoDB Atlas if available
    this.syncToMongo().catch(() => {});
  }

  public getFilePath(): string {
    return this.filePath;
  }

  private async syncToMongo() {
    try {
      const { db } = await getDatabase();
      if (!db || !this.inMemoryStore) return;

      // Upsert employees
      for (const emp of this.inMemoryStore.employees) {
        await db.collection('employees').updateOne(
          { id: emp.id },
          { $set: emp },
          { upsert: true }
        );
      }

      // Upsert users
      for (const usr of this.inMemoryStore.users) {
        await db.collection('users').updateOne(
          { id: usr.id },
          { $set: usr },
          { upsert: true }
        );
      }

      // Upsert registration requests
      if (Array.isArray(this.inMemoryStore.registration_requests)) {
        for (const req of this.inMemoryStore.registration_requests) {
          await db.collection('registration_requests').updateOne(
            { id: req.id },
            { $set: req },
            { upsert: true }
          );
        }
      }

      // Upsert onboarding invitations
      if (Array.isArray(this.inMemoryStore.onboarding_invitations)) {
        for (const inv of this.inMemoryStore.onboarding_invitations) {
          await db.collection('onboarding_invitations').updateOne(
            { id: inv.id },
            { $set: inv },
            { upsert: true }
          );
        }
      }
    } catch {
      // Cloud cluster offline or unreachable, local durable storage is active
    }
  }

  // ==========================================
  // EMPLOYEE METHODS
  // ==========================================

  public getEmployees(includeDeleted = false): Employee[] {
    const store = this.loadStore();
    if (includeDeleted) return [...store.employees];
    return store.employees.filter(e => (e as any).deletedAt == null && (e.status as string) !== 'DELETED');
  }

  public getEmployeeById(idOrKapateId: string): Employee | null {
    const store = this.loadStore();
    const clean = idOrKapateId.trim().toLowerCase();
    const emp = store.employees.find(
      e => e.id.toLowerCase() === clean || (e.kapateId && e.kapateId.toLowerCase() === clean)
    );
    return emp || null;
  }

  public generateNextKapateId(type: 'EMP' | 'INT' | 'FRL' = 'EMP'): string {
    const store = this.loadStore();
    let maxNumber = 0;

    const prefix = `KAP-${type}-`;
    const allRecords = [...store.employees, ...store.interns, ...store.freelancers];

    for (const rec of allRecords) {
      if (rec.kapateId && rec.kapateId.startsWith(prefix)) {
        const numPart = parseInt(rec.kapateId.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNumber) {
          maxNumber = numPart;
        }
      }
    }

    const nextNumber = maxNumber + 1;
    return `${prefix}${String(nextNumber).padStart(6, '0')}`;
  }

  public addEmployee(empData: Partial<Employee>): Employee {
    const store = this.loadStore();
    const kapateId = empData.kapateId || this.generateNextKapateId('EMP');
    const cleanName = empData.name?.trim() || 'New Employee';
    const baseName = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.');
    const internalEmail = empData.internalEmail || `${baseName}@kapateconsultancy.in`;

    const newEmp: Employee = {
      id: empData.id || `emp-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      name: cleanName,
      email: empData.email || internalEmail,
      role: empData.role || 'Software Engineer',
      department: empData.department || 'Engineering',
      phone: empData.phone || '+91 98230 00000',
      manager: empData.manager || 'Shon Kapate',
      skills: Array.isArray(empData.skills) && empData.skills.length > 0 ? empData.skills : ['Engineering', 'System Architecture'],
      joinDate: empData.joinDate || new Date().toISOString().split('T')[0],
      status: empData.status || 'Active',
      projectsCount: empData.projectsCount ?? 0,
      utilization: empData.utilization ?? 100,
      kapateId,
      internalEmail
    };

    // Prepend new employee
    store.employees.unshift(newEmp);
    this.saveStore();

    // Log audit event
    this.addAuditLog({
      actor: 'Admin',
      action: 'EMPLOYEE_CREATED',
      module: 'workforce',
      targetResource: `employees/${newEmp.id}`,
      targetUser: newEmp.email,
      newValue: JSON.stringify({ name: newEmp.name, role: newEmp.role, kapateId: newEmp.kapateId }),
      result: 'SUCCESS',
      reason: 'Onboarded new enterprise employee record'
    });

    return newEmp;
  }

  public updateEmployee(id: string, patch: Partial<Employee>): Employee | null {
    const store = this.loadStore();
    const index = store.employees.findIndex(e => e.id === id || e.kapateId === id);
    if (index === -1) return null;

    store.employees[index] = {
      ...store.employees[index],
      ...patch
    };

    this.saveStore();
    return store.employees[index];
  }

  public deleteEmployee(id: string, soft = true): boolean {
    const store = this.loadStore();
    const cleanId = id.trim().toLowerCase();
    const index = store.employees.findIndex(
      e => e.id.toLowerCase() === cleanId || (e.kapateId && e.kapateId.toLowerCase() === cleanId)
    );
    if (index === -1) return false;

    // Prevent deleting Master Admin
    const emp = store.employees[index];
    if (
      emp.email.toLowerCase() === 'admin@kapateconsultancy.in' ||
      emp.email.toLowerCase() === 'shon@kapateconsultancy.in' ||
      emp.kapateId === 'KAP-EMP-000001'
    ) {
      throw new Error('Protected Account: The Master Admin employee record cannot be deleted.');
    }

    if (soft) {
      (store.employees[index] as any).deletedAt = new Date().toISOString();
      store.employees[index].status = 'Inactive';
    } else {
      store.employees.splice(index, 1);
    }

    // Also deactivate or remove linked user account if present
    const userIndex = store.users.findIndex(
      u => u.email.toLowerCase() === emp.email.toLowerCase() || (u.kapateId && u.kapateId.toLowerCase() === cleanId)
    );
    if (userIndex !== -1 && store.users[userIndex].email !== 'admin@kapateconsultancy.in') {
      if (soft) {
        store.users[userIndex].status = 'SUSPENDED';
      } else {
        store.users.splice(userIndex, 1);
      }
    }

    this.saveStore();
    return true;
  }

  // ==========================================
  // USER / AUTH ACCOUNT METHODS
  // ==========================================

  public getUsers(): (User & { passwordHash?: string })[] {
    const store = this.loadStore();
    return [...store.users];
  }

  public getUserById(id: string): (User & { passwordHash?: string }) | null {
    const store = this.loadStore();
    const user = store.users.find(u => u.id === id);
    return user || null;
  }

  public getUserByEmail(emailOrId: string): (User & { passwordHash?: string }) | null {
    const store = this.loadStore();
    const clean = (emailOrId || '').toLowerCase().trim();
    if (!clean) return null;

    // Direct role alias shortcuts
    if (clean === 'admin' || clean === 'superadmin' || clean === 'shon') {
      return store.users.find(u => u.role === 'SUPER_ADMIN') || null;
    }
    if (clean === 'employee' || clean === 'emp' || clean === 'engineer') {
      return store.users.find(u => u.email === 'employee@kapateconsultancy.in' || u.role === 'EMPLOYEE') || null;
    }
    if (clean === 'manager' || clean === 'pm') {
      return store.users.find(u => u.email === 'manager@kapateconsultancy.in' || u.role === 'PROJECT_MANAGER') || null;
    }
    if (clean === 'intern') {
      return store.users.find(u => u.email === 'intern@kapateconsultancy.in' || u.role === 'INTERN') || null;
    }

    const user = store.users.find(u => 
      u.email.toLowerCase() === clean || 
      (u.internalEmail && u.internalEmail.toLowerCase() === clean) ||
      (u.kapateId && u.kapateId.toLowerCase() === clean)
    );
    return user || null;
  }

  public addUser(userData: Partial<User & { passwordHash?: string; password?: string }>): User & { passwordHash?: string } {
    const store = this.loadStore();
    const cleanEmail = (userData.email || '').toLowerCase().trim();
    if (!cleanEmail) throw new Error('Email is required to create a user account.');

    const existing = this.getUserByEmail(cleanEmail);
    if (existing) {
      if (userData.password) {
        existing.passwordHash = hashPassword(userData.password);
        this.saveStore();
      } else if (userData.passwordHash) {
        existing.passwordHash = userData.passwordHash;
        this.saveStore();
      }
      return existing;
    }

    const assignedKapateId = userData.kapateId || this.generateNextKapateId(
      userData.role === 'INTERN' ? 'INT' : 'EMP'
    );

    const initialPasswordHash = userData.password
      ? hashPassword(userData.password)
      : (userData.passwordHash || hashPassword('KapateOS@2026'));

    const newUser: User & { passwordHash?: string } = {
      id: userData.id || `usr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      name: userData.name || 'Enterprise User',
      email: cleanEmail,
      role: userData.role || 'EMPLOYEE',
      designation: userData.designation || 'Software Consultant',
      department: userData.department || 'Engineering',
      kapateId: assignedKapateId,
      internalEmail: userData.internalEmail || cleanEmail,
      status: userData.status || 'ACTIVE',
      phone: userData.phone || '+91 98230 00000',
      manager: userData.manager || 'Shon Kapate',
      skills: userData.skills || ['Enterprise Solutions'],
      assignedProjects: userData.assignedProjects || [],
      failedLogins: 0,
      lockedUntil: null,
      lastLoginAt: new Date().toISOString(),
      mfaEnabled: userData.mfaEnabled ?? false,
      created: new Date().toISOString().split('T')[0],
      passwordHash: initialPasswordHash
    };

    store.users.push(newUser);

    // Synchronize into store.employees if employee/staff role and not already present
    if (newUser.role !== 'CLIENT') {
      const existingEmp = store.employees.find(
        e => e.email.toLowerCase() === cleanEmail || (e.kapateId && e.kapateId.toLowerCase() === assignedKapateId.toLowerCase())
      );
      if (!existingEmp) {
        store.employees.unshift({
          id: `EMP-${store.employees.length + 101}`,
          name: newUser.name,
          email: newUser.email,
          role: newUser.designation || 'Software Engineer',
          department: newUser.department || 'Engineering',
          phone: newUser.phone || '',
          manager: newUser.manager || 'Shon Kapate',
          skills: newUser.skills || [],
          joinDate: new Date().toISOString().split('T')[0],
          status: 'Active',
          projectsCount: 0,
          utilization: 100,
          kapateId: assignedKapateId,
          internalEmail: newUser.internalEmail
        });
      }
    }

    this.saveStore();

    this.addAuditLog({
      actor: 'Admin',
      action: 'USER_CREATED',
      module: 'security',
      targetResource: `users/${newUser.id}`,
      targetUser: newUser.email,
      newValue: JSON.stringify({ name: newUser.name, role: newUser.role, kapateId: newUser.kapateId }),
      result: 'SUCCESS',
      reason: 'Created enterprise user login account'
    });

    return newUser;
  }

  public updateUser(id: string, patch: Partial<User & { passwordHash?: string }>): (User & { passwordHash?: string }) | null {
    const store = this.loadStore();
    const index = store.users.findIndex(u => u.id === id || u.email.toLowerCase() === id.toLowerCase());
    if (index === -1) return null;

    store.users[index] = {
      ...store.users[index],
      ...patch
    };

    this.saveStore();
    return store.users[index];
  }

  // ==========================================
  // SESSIONS METHODS
  // ==========================================

  public getSessions(): SecuritySession[] {
    const store = this.loadStore();
    return store.sessions.filter(s => s.status === 'ACTIVE');
  }

  public addSession(session: SecuritySession) {
    const store = this.loadStore();
    // Remove existing sessions for same user or id
    store.sessions = store.sessions.filter(s => s.id !== session.id);
    store.sessions.unshift(session);
    this.saveStore();
  }

  public revokeSession(sessionId: string): boolean {
    const store = this.loadStore();
    const sess = store.sessions.find(s => s.id === sessionId);
    if (!sess) return false;
    sess.status = 'REVOKED';
    this.saveStore();
    return true;
  }

  public revokeAllUserSessions(userId: string): number {
    const store = this.loadStore();
    let count = 0;
    store.sessions.forEach(s => {
      if (s.userId === userId && s.status === 'ACTIVE') {
        s.status = 'REVOKED';
        count++;
      }
    });
    if (count > 0) this.saveStore();
    return count;
  }

  // ==========================================
  // DOCUMENTS METHODS
  // ==========================================

  public getDocuments(): AppDocument[] {
    const store = this.loadStore();
    return [...(store.documents || [])];
  }

  // ==========================================
  // AUDIT LOG METHODS
  // ==========================================

  public getAuditLogs(limit = 100): AuditLogEntry[] {
    const store = this.loadStore();
    return store.audit_logs.slice(0, limit);
  }

  public addAuditLog(entry: Partial<AuditLogEntry>) {
    const store = this.loadStore();
    const newEntry: AuditLogEntry = {
      id: entry.id || `aud-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: entry.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: entry.actor || 'System',
      actorKapateId: entry.actorKapateId || 'KAP-EMP-000001',
      action: entry.action || 'ACTIVITY',
      module: entry.module || 'system',
      targetResource: entry.targetResource || 'system',
      targetUser: entry.targetUser || 'System',
      previousValue: entry.previousValue || '',
      newValue: entry.newValue || '',
      ipAddress: entry.ipAddress || '127.0.0.1',
      result: entry.result || 'SUCCESS',
      requestId: entry.requestId || `req-${Date.now().toString(36)}`,
      reason: entry.reason || ''
    };
    store.audit_logs.unshift(newEntry);
    // Keep max 500 logs in durable store
    if (store.audit_logs.length > 500) {
      store.audit_logs = store.audit_logs.slice(0, 500);
    }
    this.saveStore();
  }

  // ==========================================
  // REGISTRATION REQUESTS METHODS
  // ==========================================

  public getRegistrationRequests(): RegistrationRequest[] {
    const store = this.loadStore();
    return [...(store.registration_requests || [])];
  }

  public getRegistrationRequestById(id: string): RegistrationRequest | null {
    const store = this.loadStore();
    return (store.registration_requests || []).find(r => r.id === id || r.applicationId === id) || null;
  }

  public addRegistrationRequest(requestData: RegistrationRequest): RegistrationRequest {
    const store = this.loadStore();
    store.registration_requests = store.registration_requests || [];
    
    // Check if duplicate email already pending
    const existingIndex = store.registration_requests.findIndex(
      r => r.email.toLowerCase() === requestData.email.toLowerCase() && r.status === 'PENDING'
    );
    if (existingIndex !== -1) {
      store.registration_requests[existingIndex] = {
        ...store.registration_requests[existingIndex],
        ...requestData,
        id: store.registration_requests[existingIndex].id
      };
      this.saveStore();
      return store.registration_requests[existingIndex];
    }

    store.registration_requests.unshift(requestData);
    this.saveStore();
    return requestData;
  }

  public updateRegistrationRequest(id: string, patch: Partial<RegistrationRequest>): RegistrationRequest | null {
    const store = this.loadStore();
    store.registration_requests = store.registration_requests || [];
    const index = store.registration_requests.findIndex(r => r.id === id || r.applicationId === id);
    if (index === -1) return null;

    store.registration_requests[index] = {
      ...store.registration_requests[index],
      ...patch
    };
    this.saveStore();
    return store.registration_requests[index];
  }

  // ==========================================
  // ONBOARDING INVITATIONS METHODS
  // ==========================================

  public getOnboardingInvitations(): OnboardingInvitation[] {
    const store = this.loadStore();
    return [...(store.onboarding_invitations || [])];
  }

  public getInvitationByToken(token: string): OnboardingInvitation | null {
    const store = this.loadStore();
    return (store.onboarding_invitations || []).find(i => i.token === token) || null;
  }

  public addInvitation(inv: OnboardingInvitation): OnboardingInvitation {
    const store = this.loadStore();
    store.onboarding_invitations = store.onboarding_invitations || [];
    store.onboarding_invitations.unshift(inv);
    this.saveStore();
    return inv;
  }

  public updateInvitation(tokenOrId: string, patch: Partial<OnboardingInvitation>): OnboardingInvitation | null {
    const store = this.loadStore();
    store.onboarding_invitations = store.onboarding_invitations || [];
    const index = store.onboarding_invitations.findIndex(i => i.token === tokenOrId || i.id === tokenOrId);
    if (index === -1) return null;

    store.onboarding_invitations[index] = {
      ...store.onboarding_invitations[index],
      ...patch
    };
    this.saveStore();
    return store.onboarding_invitations[index];
  }

  // ==========================================
  // PROJECTS METHODS
  // ==========================================

  public getProjects(filter?: { client?: string; manager?: string }): Project[] {
    const store = this.loadStore();
    let list = [...(store.projects || [])];
    if (filter?.client) {
      const q = filter.client.toLowerCase();
      list = list.filter(p => p.client.toLowerCase().includes(q));
    }
    if (filter?.manager) {
      const q = filter.manager.toLowerCase();
      list = list.filter(p => p.manager?.toLowerCase().includes(q));
    }
    return list;
  }

  public getProjectById(id: string): Project | null {
    const store = this.loadStore();
    return (store.projects || []).find(p => p.id === id) || null;
  }

  public addProject(prjData: Partial<Project>): Project {
    const store = this.loadStore();
    store.projects = store.projects || [];
    const count = store.projects.length + 1;
    const newPrj: Project = {
      id: prjData.id || `PRJ-${String(count).padStart(3, '0')}`,
      name: prjData.name || 'New Client Engagement',
      client: prjData.client || 'Enterprise Client',
      budget: prjData.budget ?? 1000000,
      spentBudget: prjData.spentBudget ?? 0,
      progress: prjData.progress ?? 0,
      status: prjData.status || 'Planning',
      deadline: prjData.deadline || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      team: Array.isArray(prjData.team) && prjData.team.length > 0 ? prjData.team : ['Shon Kapate'],
      manager: prjData.manager || 'Shon Kapate',
      description: prjData.description || 'Enterprise project delivery engagement.',
      milestones: prjData.milestones || [
        { id: `m-${Date.now()}-1`, name: 'Discovery & Requirements Lock', progress: 100, dueDate: new Date().toISOString().split('T')[0], status: 'Completed' },
        { id: `m-${Date.now()}-2`, name: 'Architecture & Staging Provisioning', progress: 20, dueDate: prjData.deadline || '2026-11-30', status: 'In Progress' }
      ],
      profitability: prjData.profitability || {
        revenue: prjData.budget ?? 1000000,
        employeeCost: Math.round((prjData.budget ?? 1000000) * 0.45),
        cloudCost: Math.round((prjData.budget ?? 1000000) * 0.08),
        aiApiCost: Math.round((prjData.budget ?? 1000000) * 0.05),
        otherCost: 10000,
        grossProfit: Math.round((prjData.budget ?? 1000000) * 0.42),
        grossMargin: 42.0
      }
    };
    store.projects.unshift(newPrj);
    this.saveStore();

    this.addAuditLog({
      actor: newPrj.manager,
      action: 'PROJECT_CREATED',
      module: 'delivery',
      targetResource: `projects/${newPrj.id}`,
      targetUser: newPrj.client,
      newValue: JSON.stringify({ name: newPrj.name, budget: newPrj.budget }),
      result: 'SUCCESS',
      reason: 'Created enterprise delivery project'
    });

    return newPrj;
  }

  public updateProject(id: string, patch: Partial<Project>): Project | null {
    const store = this.loadStore();
    store.projects = store.projects || [];
    const index = store.projects.findIndex(p => p.id === id);
    if (index === -1) return null;

    store.projects[index] = {
      ...store.projects[index],
      ...patch
    };
    this.saveStore();
    return store.projects[index];
  }

  public deleteProject(id: string): boolean {
    const store = this.loadStore();
    store.projects = store.projects || [];
    const prev = store.projects.length;
    store.projects = store.projects.filter(p => p.id !== id);
    if (store.projects.length !== prev) {
      this.saveStore();
      return true;
    }
    return false;
  }

  // ==========================================
  // TASKS METHODS
  // ==========================================

  public getTasks(filter?: { projectId?: string; assignedTo?: string; status?: string }): Task[] {
    const store = this.loadStore();
    let list = [...(store.tasks || [])];
    if (filter?.projectId && filter.projectId !== 'ALL') {
      list = list.filter(t => t.projectId === filter.projectId);
    }
    if (filter?.assignedTo) {
      const q = filter.assignedTo.toLowerCase();
      list = list.filter(t => t.assignedTo?.toLowerCase().includes(q));
    }
    if (filter?.status) {
      list = list.filter(t => t.status === filter.status);
    }
    return list;
  }

  public getTaskById(id: string): Task | null {
    const store = this.loadStore();
    return (store.tasks || []).find(t => t.id === id) || null;
  }

  public addTask(taskData: Partial<Task>): Task {
    const store = this.loadStore();
    store.tasks = store.tasks || [];
    const count = store.tasks.length + 101;
    const newTask: Task = {
      id: taskData.id || `TSK-${count}`,
      title: taskData.title || 'Untitled Task',
      projectId: taskData.projectId || 'PRJ-001',
      projectName: taskData.projectName || 'Enterprise Core Platform',
      assignedTo: taskData.assignedTo || 'Shon Kapate',
      assigneeRole: taskData.assigneeRole || 'ENGINEER',
      priority: taskData.priority || 'Medium',
      status: taskData.status || 'TODO',
      dueDate: taskData.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      estimatedHours: taskData.estimatedHours ?? 8,
      loggedHours: taskData.loggedHours ?? 0,
      description: taskData.description || '',
      clientVisible: taskData.clientVisible ?? false
    };

    store.tasks.unshift(newTask);
    this.saveStore();
    return newTask;
  }

  public updateTask(id: string, patch: Partial<Task>): Task | null {
    const store = this.loadStore();
    store.tasks = store.tasks || [];
    const index = store.tasks.findIndex(t => t.id === id);
    if (index === -1) return null;

    store.tasks[index] = {
      ...store.tasks[index],
      ...patch
    };

    if (patch.status && store.tasks[index].projectId) {
      const pId = store.tasks[index].projectId;
      const projTasks = store.tasks.filter(t => t.projectId === pId);
      const done = projTasks.filter(t => t.status === 'COMPLETED').length;
      const newProgress = Math.round((done / (projTasks.length || 1)) * 100);
      this.updateProject(pId, { progress: newProgress });
    }

    this.saveStore();
    return store.tasks[index];
  }

  public deleteTask(id: string): boolean {
    const store = this.loadStore();
    store.tasks = store.tasks || [];
    const prevLen = store.tasks.length;
    store.tasks = store.tasks.filter(t => t.id !== id);
    if (store.tasks.length !== prevLen) {
      this.saveStore();
      return true;
    }
    return false;
  }

  // ==========================================
  // CRM LEADS METHODS
  // ==========================================

  public getLeads(statusFilter?: string): Lead[] {
    const store = this.loadStore();
    let list = [...(store.leads || [])];
    if (statusFilter && statusFilter !== 'ALL') {
      list = list.filter(l => l.status === statusFilter);
    }
    return list;
  }

  public getLeadById(id: string): Lead | null {
    const store = this.loadStore();
    return (store.leads || []).find(l => l.id === id) || null;
  }

  public addLead(leadData: Partial<Lead>): Lead {
    const store = this.loadStore();
    store.leads = store.leads || [];
    const count = store.leads.length + 1;
    const newLead: Lead = {
      id: leadData.id || `KAP-${String(count).padStart(3, '0')}`,
      name: leadData.name || 'New Enterprise Lead',
      email: leadData.email || '',
      phone: leadData.phone || '',
      company: leadData.company || 'Prospective Organization',
      service: leadData.service || 'AI Solutions',
      budget: leadData.budget || '₹10L - ₹25L',
      source: leadData.source || 'Website',
      owner: leadData.owner || 'Shon Kapate',
      status: leadData.status || 'New Lead',
      score: leadData.score ?? 85,
      description: leadData.description || '',
      created: leadData.created || new Date().toISOString().split('T')[0],
      nextFollowUp: leadData.nextFollowUp || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
    };
    store.leads.unshift(newLead);
    this.saveStore();
    return newLead;
  }

  public updateLead(id: string, patch: Partial<Lead>): Lead | null {
    const store = this.loadStore();
    store.leads = store.leads || [];
    const index = store.leads.findIndex(l => l.id === id);
    if (index === -1) return null;

    store.leads[index] = {
      ...store.leads[index],
      ...patch
    };
    this.saveStore();
    return store.leads[index];
  }

  public deleteLead(id: string): boolean {
    const store = this.loadStore();
    store.leads = store.leads || [];
    const prev = store.leads.length;
    store.leads = store.leads.filter(l => l.id !== id);
    if (store.leads.length !== prev) {
      this.saveStore();
      return true;
    }
    return false;
  }

  // ==========================================
  // CRM COMPANIES & CONTACTS
  // ==========================================

  public getCompanies(): Company[] {
    const store = this.loadStore();
    return [...(store.companies || [])];
  }

  public addCompany(compData: Partial<Company>): Company {
    const store = this.loadStore();
    store.companies = store.companies || [];
    const newCompany: Company = {
      id: compData.id || `comp-${store.companies.length + 1}`,
      name: compData.name || 'Enterprise Client Co',
      industry: compData.industry || 'Technology',
      website: compData.website || '',
      location: compData.location || 'India',
      contactsCount: compData.contactsCount ?? 0,
      dealsCount: compData.dealsCount ?? 0,
      activeProjects: compData.activeProjects ?? 0,
      totalRevenue: compData.totalRevenue || '₹0',
      contacts: compData.contacts || []
    };
    store.companies.unshift(newCompany);
    this.saveStore();
    return newCompany;
  }

  public updateCompany(id: string, patch: Partial<Company>): Company | null {
    const store = this.loadStore();
    store.companies = store.companies || [];
    const index = store.companies.findIndex(c => c.id === id);
    if (index === -1) return null;
    store.companies[index] = {
      ...store.companies[index],
      ...patch
    };
    this.saveStore();
    return store.companies[index];
  }

  public deleteCompany(id: string): boolean {
    const store = this.loadStore();
    store.companies = store.companies || [];
    const prev = store.companies.length;
    store.companies = store.companies.filter(c => c.id !== id);
    if (store.companies.length !== prev) {
      this.saveStore();
      return true;
    }
    return false;
  }

  public getContacts(companyIdOrName?: string): Contact[] {
    const store = this.loadStore();
    let list = [...(store.contacts || [])];
    if (companyIdOrName) {
      const q = companyIdOrName.toLowerCase();
      list = list.filter(c => c.company.toLowerCase().includes(q));
    }
    return list;
  }

  public addContact(cntData: Partial<Contact>): Contact {
    const store = this.loadStore();
    store.contacts = store.contacts || [];
    const newContact: Contact = {
      id: cntData.id || `cnt-${store.contacts.length + 1}`,
      name: cntData.name || 'Key Stakeholder',
      designation: cntData.designation || 'Vice President of Technology',
      company: cntData.company || 'Enterprise Partner',
      email: cntData.email || 'contact@client.com',
      phone: cntData.phone || '+91 98230 00000',
      relationship: cntData.relationship || 'Key Decision Maker',
      lastContacted: cntData.lastContacted || new Date().toISOString().split('T')[0],
      owner: cntData.owner || 'Shon Kapate'
    };
    store.contacts.unshift(newContact);
    this.saveStore();
    return newContact;
  }

  public deleteContact(id: string): boolean {
    const store = this.loadStore();
    store.contacts = store.contacts || [];
    const prev = store.contacts.length;
    store.contacts = store.contacts.filter(c => c.id !== id);
    if (store.contacts.length !== prev) {
      this.saveStore();
      return true;
    }
    return false;
  }

  // ==========================================
  // DEALS METHODS
  // ==========================================

  public getDeals(): Deal[] {
    const store = this.loadStore();
    return [...(store.deals || [])];
  }

  public addDeal(dealData: Partial<Deal>): Deal {
    const store = this.loadStore();
    store.deals = store.deals || [];
    const val = typeof dealData.value === 'number' ? dealData.value : parseFloat(dealData.value as any) || 2500000;
    const newDeal: Deal = {
      id: dealData.id || `DEAL-${store.deals.length + 101}`,
      title: dealData.title || 'Enterprise Solutions Contract',
      company: dealData.company || 'Enterprise Partner',
      contact: dealData.contact || 'Executive Sponsor',
      value: val,
      stage: (dealData.stage as DealStage) || 'NEW LEAD',
      probability: dealData.probability ?? 60,
      owner: dealData.owner || 'Shon Kapate',
      expectedClose: dealData.expectedClose || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      service: dealData.service || 'AI Solutions',
      created: dealData.created || new Date().toISOString().split('T')[0]
    };
    store.deals.unshift(newDeal);
    this.saveStore();
    return newDeal;
  }

  public updateDeal(id: string, patch: Partial<Deal>): Deal | null {
    const store = this.loadStore();
    store.deals = store.deals || [];
    const index = store.deals.findIndex(d => d.id === id);
    if (index === -1) return null;

    store.deals[index] = {
      ...store.deals[index],
      ...patch
    };
    this.saveStore();
    return store.deals[index];
  }

  public deleteDeal(id: string): boolean {
    const store = this.loadStore();
    store.deals = store.deals || [];
    const prev = store.deals.length;
    store.deals = store.deals.filter(d => d.id !== id);
    if (store.deals.length !== prev) {
      this.saveStore();
      return true;
    }
    return false;
  }

  // ==========================================
  // FINANCE & INVOICES
  // ==========================================

  public getInvoices(companyId?: string): Invoice[] {
    const store = this.loadStore();
    let list = [...(store.invoices || [])];
    if (companyId) {
      list = list.filter(i => (i as any).companyId === companyId || i.client.toLowerCase().includes(companyId.toLowerCase()));
    }
    return list;
  }

  public getInvoiceById(id: string): Invoice | undefined {
    const store = this.loadStore();
    return (store.invoices || []).find(i => i.id === id);
  }

  public addInvoice(invData: Partial<Invoice>): Invoice {
    const store = this.loadStore();
    store.invoices = store.invoices || [];
    const count = store.invoices.length + 42;
    const amt = invData.amount ?? 500000;
    const tax = invData.tax ?? Math.round(amt * 0.18);
    const newInvoice: Invoice = {
      id: invData.id || `INV-${String(count).padStart(4, '0')}`,
      client: invData.client || 'Enterprise Client',
      projectName: invData.projectName || 'Enterprise AI Consulting',
      amount: amt,
      tax: tax,
      total: invData.total ?? (amt + tax),
      status: invData.status || 'Sent',
      dueDate: invData.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      billingAddress: invData.billingAddress || '742 Evergreen Terrace, Tech Park, BLR',
      gstin: invData.gstin || '27AABCK1234F1Z5',
      items: invData.items || [
        { description: 'Milestone Delivery - Architecture & Staging Provisioning', qty: 1, rate: amt, amount: amt }
      ],
      paymentReference: invData.paymentReference,
      paidDate: invData.paidDate
    };
    store.invoices.unshift(newInvoice);
    this.saveStore();
    return newInvoice;
  }

  public updateInvoice(id: string, patch: Partial<Invoice>): Invoice | null {
    const store = this.loadStore();
    store.invoices = store.invoices || [];
    const index = store.invoices.findIndex(i => i.id === id);
    if (index === -1) return null;

    store.invoices[index] = {
      ...store.invoices[index],
      ...patch
    };
    this.saveStore();
    return store.invoices[index];
  }

  public deleteInvoice(id: string): boolean {
    const store = this.loadStore();
    store.invoices = store.invoices || [];
    const prev = store.invoices.length;
    store.invoices = store.invoices.filter(i => i.id !== id);
    if (store.invoices.length !== prev) {
      this.saveStore();
      return true;
    }
    return false;
  }

  // ==========================================
  // TIMESHEETS, ATTENDANCE & LEAVES
  // ==========================================

  public getTimesheets(employeeNameOrId?: string): TimesheetEntry[] {
    const store = this.loadStore();
    let list = [...(store.timesheets || [])];
    if (employeeNameOrId) {
      const q = employeeNameOrId.toLowerCase();
      list = list.filter(t => t.employeeName?.toLowerCase().includes(q));
    }
    return list;
  }

  public addTimesheet(tsData: Partial<TimesheetEntry>): TimesheetEntry {
    const store = this.loadStore();
    store.timesheets = store.timesheets || [];
    const newTs: TimesheetEntry = {
      id: tsData.id || `ts-${Date.now()}`,
      employeeName: tsData.employeeName || 'Shon Kapate',
      projectName: tsData.projectName || 'Enterprise Core Platform',
      taskName: tsData.taskName || 'Core system development',
      hours: tsData.hours ?? 8,
      date: tsData.date || new Date().toISOString().split('T')[0],
      day: tsData.day || new Date().toLocaleDateString('en-US', { weekday: 'short' }),
      description: tsData.description || 'Feature implementation and tests',
      status: tsData.status || 'Submitted',
      isBillable: tsData.isBillable ?? true
    };
    store.timesheets.unshift(newTs);
    this.saveStore();
    return newTs;
  }

  public updateTimesheet(id: string, patch: Partial<TimesheetEntry>): TimesheetEntry | null {
    const store = this.loadStore();
    store.timesheets = store.timesheets || [];
    const index = store.timesheets.findIndex(t => t.id === id);
    if (index === -1) return null;

    store.timesheets[index] = {
      ...store.timesheets[index],
      ...patch
    };
    this.saveStore();
    return store.timesheets[index];
  }

  public deleteTimesheet(id: string): boolean {
    const store = this.loadStore();
    store.timesheets = store.timesheets || [];
    const prev = store.timesheets.length;
    store.timesheets = store.timesheets.filter(t => t.id !== id);
    if (store.timesheets.length !== prev) {
      this.saveStore();
      return true;
    }
    return false;
  }

  public getAttendance(employeeName?: string): AttendanceRecord[] {
    const store = this.loadStore();
    let list = [...(store.attendance || [])];
    if (employeeName) {
      list = list.filter(a => a.employeeName.toLowerCase().includes(employeeName.toLowerCase()));
    }
    return list;
  }

  public addAttendance(record: Partial<AttendanceRecord>): AttendanceRecord {
    const store = this.loadStore();
    store.attendance = store.attendance || [];
    const newRec: AttendanceRecord = {
      id: record.id || `att-${Date.now()}`,
      employeeName: record.employeeName || 'Shon Kapate',
      date: record.date || new Date().toISOString().split('T')[0],
      checkIn: record.checkIn || '09:00 AM',
      checkOut: record.checkOut || '06:00 PM',
      totalHours: record.totalHours ?? 8,
      status: record.status || 'Present'
    };
    store.attendance.unshift(newRec);
    this.saveStore();
    return newRec;
  }

  public getActiveClockSession(userId: string): ActiveClockSession | null {
    const store = this.loadStore();
    if (!store.activeClockSessions) return null;
    return store.activeClockSessions[userId] || null;
  }

  public startClockSession(session: ActiveClockSession): ActiveClockSession {
    const store = this.loadStore();
    store.activeClockSessions = store.activeClockSessions || {};
    store.activeClockSessions[session.userId] = session;
    this.saveStore();
    return session;
  }

  public endClockSession(userId: string): ActiveClockSession | null {
    const store = this.loadStore();
    if (!store.activeClockSessions || !store.activeClockSessions[userId]) return null;
    const session = store.activeClockSessions[userId];
    delete store.activeClockSessions[userId];
    this.saveStore();
    return session;
  }

  public getLeaves(employeeName?: string): LeaveRequest[] {
    const store = this.loadStore();
    let list = [...(store.leaves || [])];
    if (employeeName) {
      list = list.filter(l => l.employeeName.toLowerCase().includes(employeeName.toLowerCase()));
    }
    return list;
  }

  public addLeave(leaveData: Partial<LeaveRequest>): LeaveRequest {
    const store = this.loadStore();
    store.leaves = store.leaves || [];
    const newLeave: LeaveRequest = {
      id: leaveData.id || `leave-${Date.now()}`,
      employeeName: leaveData.employeeName || 'Shon Kapate',
      leaveType: leaveData.leaveType || 'Casual Leave',
      startDate: leaveData.startDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      endDate: leaveData.endDate || new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      days: leaveData.days ?? 2,
      reason: leaveData.reason || 'Personal time',
      status: leaveData.status || 'Pending'
    };
    store.leaves.unshift(newLeave);
    this.saveStore();
    return newLeave;
  }

  public updateLeave(id: string, patch: Partial<LeaveRequest>): LeaveRequest | null {
    const store = this.loadStore();
    store.leaves = store.leaves || [];
    const index = store.leaves.findIndex(l => l.id === id);
    if (index === -1) return null;

    store.leaves[index] = {
      ...store.leaves[index],
      ...patch
    };
    this.saveStore();
    return store.leaves[index];
  }

  // ==========================================
  // EXPENSES METHODS
  // ==========================================

  public getExpenses(category?: string, status?: string): Expense[] {
    const store = this.loadStore();
    let list = [...(store.expenses || [])];
    if (category && category !== 'ALL') {
      list = list.filter(e => e.category?.toLowerCase() === category.toLowerCase());
    }
    if (status && status !== 'ALL') {
      list = list.filter(e => e.status?.toLowerCase() === status.toLowerCase());
    }
    return list;
  }

  public getExpenseById(id: string): Expense | undefined {
    const store = this.loadStore();
    return (store.expenses || []).find(e => e.id === id);
  }

  public addExpense(data: Partial<Expense>): Expense {
    const store = this.loadStore();
    store.expenses = store.expenses || [];
    const newExpense: Expense = {
      id: data.id || `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      vendor: data.vendor || 'Vendor',
      category: data.category || 'Cloud Infrastructure',
      amount: Number(data.amount) || 0,
      date: data.date || new Date().toISOString().split('T')[0],
      projectName: data.projectName || undefined,
      status: data.status || 'Paid',
    };
    store.expenses.unshift(newExpense);
    this.saveStore();
    return newExpense;
  }

  public updateExpense(id: string, patch: Partial<Expense>): Expense | null {
    const store = this.loadStore();
    store.expenses = store.expenses || [];
    const index = store.expenses.findIndex(e => e.id === id);
    if (index === -1) return null;
    store.expenses[index] = { ...store.expenses[index], ...patch };
    this.saveStore();
    return store.expenses[index];
  }

  public deleteExpense(id: string): boolean {
    const store = this.loadStore();
    store.expenses = store.expenses || [];
    const initialLen = store.expenses.length;
    store.expenses = store.expenses.filter(e => e.id !== id);
    if (store.expenses.length !== initialLen) {
      this.saveStore();
      return true;
    }
    return false;
  }

  // ==========================================
  // PAYMENTS METHODS
  // ==========================================

  public getPayments(client?: string, invoiceId?: string): Payment[] {
    const store = this.loadStore();
    let list = [...(store.payments || [])];
    if (client) {
      list = list.filter(p => p.client?.toLowerCase().includes(client.toLowerCase()));
    }
    if (invoiceId) {
      list = list.filter(p => p.invoiceId === invoiceId);
    }
    return list;
  }

  public getPaymentById(id: string): Payment | undefined {
    const store = this.loadStore();
    return (store.payments || []).find(p => p.id === id);
  }

  public addPayment(data: Partial<Payment>): Payment {
    const store = this.loadStore();
    store.payments = store.payments || [];
    const newPayment: Payment = {
      id: data.id || `pay-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      invoiceId: data.invoiceId || '',
      client: data.client || 'Client',
      amount: Number(data.amount) || 0,
      date: data.date || new Date().toISOString().split('T')[0],
      method: data.method || 'Bank Transfer',
      reference: data.reference || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
    };
    store.payments.unshift(newPayment);

    // If linked to an invoice, update invoice status in dataStore
    if (newPayment.invoiceId) {
      const invIndex = (store.invoices || []).findIndex(i => i.id === newPayment.invoiceId);
      if (invIndex !== -1) {
        store.invoices[invIndex] = {
          ...store.invoices[invIndex],
          status: 'Paid',
          paidDate: newPayment.date,
          paymentReference: newPayment.reference
        };
      }
    }

    this.saveStore();
    return newPayment;
  }

  // ==========================================
  // INTERNS METHODS
  // ==========================================

  public getInterns(): Intern[] {
    const store = this.loadStore();
    return [...(store.interns || [])];
  }

  public getInternById(id: string): Intern | undefined {
    const store = this.loadStore();
    return (store.interns || []).find(i => i.id === id);
  }

  public addIntern(data: Partial<Intern>): Intern {
    const store = this.loadStore();
    store.interns = store.interns || [];
    const count = store.interns.length + 1;
    const newIntern: Intern = {
      id: data.id || `INT-${String(count).padStart(3, '0')}`,
      name: data.name || 'Intern Name',
      email: data.email || 'intern@kapateconsultancy.in',
      role: data.role || 'Software Engineering Intern',
      mentor: data.mentor || 'Shon Kapate',
      college: data.college || 'Engineering Institute',
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: data.endDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      status: (data.status as 'Active' | 'Completed') || 'Active',
      tasksCompleted: data.tasksCompleted ?? 0,
      tasksPending: data.tasksPending ?? 0,
      loggedHours: data.loggedHours ?? 0,
      attendancePct: data.attendancePct ?? 100,
      trainingProgress: data.trainingProgress ?? 0,
      mentorFeedback: data.mentorFeedback || 'Good performance',
      evaluations: data.evaluations || {
        technicalSkills: 80,
        problemSolving: 80,
        communication: 85,
        teamwork: 85,
        learning: 90,
        taskCompletion: 80
      },
      kapateId: data.kapateId,
      internalEmail: data.internalEmail
    };
    store.interns.unshift(newIntern);
    this.saveStore();
    return newIntern;
  }

  public updateIntern(id: string, patch: Partial<Intern>): Intern | null {
    const store = this.loadStore();
    store.interns = store.interns || [];
    const idx = store.interns.findIndex(i => i.id === id);
    if (idx === -1) return null;
    store.interns[idx] = { ...store.interns[idx], ...patch };
    this.saveStore();
    return store.interns[idx];
  }

  public deleteIntern(id: string): boolean {
    const store = this.loadStore();
    store.interns = store.interns || [];
    const len = store.interns.length;
    store.interns = store.interns.filter(i => i.id !== id);
    if (store.interns.length !== len) {
      this.saveStore();
      return true;
    }
    return false;
  }

  // ==========================================
  // FREELANCERS METHODS
  // ==========================================

  public getFreelancers(): Freelancer[] {
    const store = this.loadStore();
    return [...(store.freelancers || [])];
  }

  public getFreelancerById(id: string): Freelancer | undefined {
    const store = this.loadStore();
    return (store.freelancers || []).find(f => f.id === id);
  }

  public addFreelancer(data: Partial<Freelancer>): Freelancer {
    const store = this.loadStore();
    store.freelancers = store.freelancers || [];
    const count = store.freelancers.length + 1;
    const newFreelancer: Freelancer = {
      id: data.id || `FRL-${String(count).padStart(3, '0')}`,
      name: data.name || 'Freelancer Name',
      skill: data.skill || 'Cloud Architecture & DevOps',
      projects: Array.isArray(data.projects) ? data.projects : ['Enterprise Platform'],
      hourlyRate: data.hourlyRate ? String(data.hourlyRate) : '₹3,500/hr',
      availability: data.availability || 'Full-time (Contract)',
      status: (data.status as 'Active' | 'Available' | 'On Contract') || 'Active',
      kapateId: data.kapateId,
      internalEmail: data.internalEmail
    };
    store.freelancers.unshift(newFreelancer);
    this.saveStore();
    return newFreelancer;
  }

  public updateFreelancer(id: string, patch: Partial<Freelancer>): Freelancer | null {
    const store = this.loadStore();
    store.freelancers = store.freelancers || [];
    const idx = store.freelancers.findIndex(f => f.id === id);
    if (idx === -1) return null;
    store.freelancers[idx] = { ...store.freelancers[idx], ...patch };
    this.saveStore();
    return store.freelancers[idx];
  }

  public deleteFreelancer(id: string): boolean {
    const store = this.loadStore();
    store.freelancers = store.freelancers || [];
    const len = store.freelancers.length;
    store.freelancers = store.freelancers.filter(f => f.id !== id);
    if (store.freelancers.length !== len) {
      this.saveStore();
      return true;
    }
    return false;
  }

  // ==========================================
  // SYSTEM SETTINGS & RBAC PERMISSIONS METHODS
  // ==========================================

  public getSystemSettings(): SystemSettings {
    const store = this.loadStore();
    return store.systemSettings || { ...DEFAULT_SYSTEM_SETTINGS };
  }

  public updateSystemSettings(updates: Partial<SystemSettings>): SystemSettings {
    const store = this.loadStore();
    const current = store.systemSettings || { ...DEFAULT_SYSTEM_SETTINGS };
    store.systemSettings = {
      ...current,
      ...updates,
      organization: { ...current.organization, ...(updates.organization || {}) },
      authentication: { ...current.authentication, ...(updates.authentication || {}) },
      email: { ...current.email, ...(updates.email || {}) },
      ai: { ...current.ai, ...(updates.ai || {}) },
      storage: { ...current.storage, ...(updates.storage || {}) },
    };
    this.saveStore();
    return store.systemSettings;
  }

  public getRolePermissions(): Record<UserRole, string[]> {
    const store = this.loadStore();
    return store.rolePermissions || { ...DEFAULT_ROLE_PERMISSIONS };
  }

  public updateRolePermissions(role: UserRole, permissions: string[]): Record<UserRole, string[]> {
    const store = this.loadStore();
    store.rolePermissions = store.rolePermissions || { ...DEFAULT_ROLE_PERMISSIONS };
    store.rolePermissions[role] = permissions;
    this.saveStore();
    return store.rolePermissions;
  }

  public resetRolePermissions(): Record<UserRole, string[]> {
    const store = this.loadStore();
    store.rolePermissions = { ...DEFAULT_ROLE_PERMISSIONS };
    this.saveStore();
    return store.rolePermissions;
  }
}

// Global Singleton DataStore Instance
declare global {
  // eslint-disable-next-line no-var
  var _kapateDataStore: DataStore | undefined;
}

if (!global._kapateDataStore || typeof (global._kapateDataStore as any).getActiveClockSession !== 'function') {
  global._kapateDataStore = new DataStore();
}

export const dataStore = global._kapateDataStore;
export default dataStore;
