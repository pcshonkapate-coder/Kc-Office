import fs from 'fs';
import path from 'path';
import { Employee, Intern, Freelancer, User, SecuritySession, AuditLogEntry, UserRole } from '@/types';
import { hashPassword } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';

export interface StoreSchema {
  version: number;
  lastUpdated: string;
  users: (User & { passwordHash?: string })[];
  employees: Employee[];
  interns: Intern[];
  freelancers: Freelancer[];
  sessions: SecuritySession[];
  audit_logs: AuditLogEntry[];
}

const DEFAULT_STORE: StoreSchema = {
  version: 1,
  lastUpdated: new Date().toISOString(),
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
  ]
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

  private loadStore(): StoreSchema {
    try {
      if (fs.existsSync(this.filePath)) {
        const stat = fs.statSync(this.filePath);
        if (this.inMemoryStore && stat.mtimeMs <= this.lastLoadedMtime) {
          return this.inMemoryStore;
        }

        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed: StoreSchema = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.employees) && Array.isArray(parsed.users)) {
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
    const adminIndex = store.users.findIndex(
      u => u.email === 'admin@kapateconsultancy.in' || u.email === 'shon@kapateconsultancy.in'
    );
    if (adminIndex === -1) {
      store.users.unshift(DEFAULT_STORE.users[0]);
    } else {
      // Ensure role is SUPER_ADMIN and passwordHash exists
      store.users[adminIndex].role = 'SUPER_ADMIN';
      if (!store.users[adminIndex].passwordHash) {
        store.users[adminIndex].passwordHash = hashPassword('Admin@KC8421174957');
      }
    }

    const empIndex = store.employees.findIndex(
      e => e.email === 'admin@kapateconsultancy.in' || e.email === 'shon@kapateconsultancy.in'
    );
    if (empIndex === -1) {
      store.employees.unshift(DEFAULT_STORE.employees[0]);
    }
  }

  private saveStore() {
    if (!this.inMemoryStore) return;
    this.inMemoryStore.lastUpdated = new Date().toISOString();

    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const tempPath = `${this.filePath}.${Date.now()}.tmp`;
      const dataStr = JSON.stringify(this.inMemoryStore, null, 2);
      fs.writeFileSync(tempPath, dataStr, 'utf-8');
      fs.renameSync(tempPath, this.filePath);
      try {
        this.lastLoadedMtime = fs.statSync(this.filePath).mtimeMs;
      } catch {}
    } catch (e) {
      console.error('[DataStore] Failed to write persistent store file:', e);
    }

    // Asynchronously synchronize with MongoDB Atlas if available
    this.syncToMongo().catch(() => {});
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
    const index = store.employees.findIndex(e => e.id === id || e.kapateId === id);
    if (index === -1) return false;

    // Prevent deleting Master Admin
    if (store.employees[index].email === 'admin@kapateconsultancy.in') {
      throw new Error('Protected Account: The Master Admin employee record cannot be deleted.');
    }

    if (soft) {
      (store.employees[index] as any).deletedAt = new Date().toISOString();
      store.employees[index].status = 'Inactive';
    } else {
      store.employees.splice(index, 1);
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

  public getUserByEmail(email: string): (User & { passwordHash?: string }) | null {
    const store = this.loadStore();
    const clean = email.toLowerCase().trim();
    const user = store.users.find(u => u.email.toLowerCase() === clean || (u.internalEmail && u.internalEmail.toLowerCase() === clean));
    return user || null;
  }

  public addUser(userData: Partial<User & { passwordHash?: string }>): User & { passwordHash?: string } {
    const store = this.loadStore();
    const cleanEmail = (userData.email || '').toLowerCase().trim();
    if (!cleanEmail) throw new Error('Email is required to create a user account.');

    const existing = this.getUserByEmail(cleanEmail);
    if (existing) {
      return existing;
    }

    const newUser: User & { passwordHash?: string } = {
      id: userData.id || `usr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      name: userData.name || 'Enterprise User',
      email: cleanEmail,
      role: userData.role || 'EMPLOYEE',
      designation: userData.designation || 'Software Consultant',
      department: userData.department || 'Engineering',
      kapateId: userData.kapateId || this.generateNextKapateId('EMP'),
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
      passwordHash: userData.passwordHash || hashPassword('KapateOS@2026')
    };

    store.users.push(newUser);
    this.saveStore();

    this.addAuditLog({
      actor: 'Admin',
      action: 'USER_CREATED',
      module: 'security',
      targetResource: `users/${newUser.id}`,
      targetUser: newUser.email,
      newValue: JSON.stringify({ name: newUser.name, role: newUser.role }),
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
}

// Global Singleton DataStore Instance
declare global {
  // eslint-disable-next-line no-var
  var _kapateDataStore: DataStore | undefined;
}

if (!global._kapateDataStore) {
  global._kapateDataStore = new DataStore();
}

export const dataStore = global._kapateDataStore;
export default dataStore;
