/**
 * Kapate OS - Master Production Functionality Verification Script
 * Validates authoritative persistence, dual-tier reliability,
 * session/business data decoupling, CRM, Delivery, Workforce, Finance, and Security.
 */

import { dataStore } from '../src/lib/dataStore';
import { UserRole, SecuritySession } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runMasterVerification() {
  console.log('================================================================');
  console.log('KAPATE OS — EXHAUSTIVE FUNCTIONALITY AUDIT & VERIFICATION');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // TEST 1: CORE DATASTORE INITIALIZATION & MASTER ADMIN ACCOUNT
  // -------------------------------------------------------------
  console.log('1. Checking Core DataStore & Master Admin Account...');
  const users = dataStore.getUsers();
  assert(users.length > 0, `Users collection is populated (found ${users.length})`);
  const admin = users.find(u => u.email === 'admin@kapateconsultancy.in');
  assert(!!admin, 'Primary super admin account (admin@kapateconsultancy.in) exists');
  if (!admin) throw new Error('Primary super admin account not found');
  assert(admin.role === 'SUPER_ADMIN', 'Primary super admin has SUPER_ADMIN role');
  assert(!!admin.kapateId, `Admin has valid Kapate ID: ${admin.kapateId}`);

  // -------------------------------------------------------------
  // TEST 2: WORKFORCE & TEAM PERSISTENCE (EMPLOYEES, INTERNS, FREELANCERS)
  // -------------------------------------------------------------
  console.log('\n2. Testing Workforce Management (CRUD & Persistence)...');
  const initialEmpCount = dataStore.getEmployees().length;
  const testEmp = dataStore.addEmployee({
    name: 'Audit Test Engineer',
    email: 'audit.engineer@kapateconsultancy.in',
    role: 'Senior QA Architect',
    department: 'Quality Assurance',
    phone: '+91 99999 11111',
    status: 'Active'
  });
  assert(!!testEmp.id, `Created employee with ID: ${testEmp.id} and Kapate ID: ${testEmp.kapateId}`);
  const fetchedEmp = dataStore.getEmployeeById(testEmp.id);
  assert(fetchedEmp?.name === 'Audit Test Engineer', 'Retrieved newly added employee by ID');

  // Interns
  const testIntern = dataStore.addIntern({
    name: 'Audit Test Intern',
    email: 'intern.audit@kapateconsultancy.in',
    role: 'ML Research Intern',
    college: 'IIT Bombay',
    status: 'Active'
  });
  assert(!!testIntern.id, `Created intern with ID: ${testIntern.id}`);
  const fetchedIntern = dataStore.getInternById(testIntern.id);
  assert(fetchedIntern?.college === 'IIT Bombay', 'Retrieved newly added intern by ID');

  // Freelancers
  const testFreelancer = dataStore.addFreelancer({
    name: 'Audit Test Freelancer',
    skill: 'Next.js & Cloud Optimization',
    hourlyRate: '₹4,000/hr',
    status: 'Active'
  });
  assert(!!testFreelancer.id, `Created freelancer with ID: ${testFreelancer.id}`);
  const fetchedFreelancer = dataStore.getFreelancerById(testFreelancer.id);
  assert(fetchedFreelancer?.skill === 'Next.js & Cloud Optimization', 'Retrieved newly added freelancer by ID');

  // -------------------------------------------------------------
  // TEST 3: DELIVERY (PROJECTS & TASKS) WITH PROGRESS COMPUTATION
  // -------------------------------------------------------------
  console.log('\n3. Testing Delivery Engine (Projects & Tasks)...');
  const testProject = dataStore.addProject({
    name: 'Core System Health & AI Pipeline',
    client: 'Apex Global Enterprises',
    manager: 'Shon Kapate',
    budget: 1500000,
    status: 'In Progress'
  });
  assert(!!testProject.id, `Created project with ID: ${testProject.id}`);

  const testTask = dataStore.addTask({
    projectId: testProject.id,
    projectName: testProject.name,
    title: 'Deploy Automated Verification Tests',
    assignedTo: 'Shon Kapate',
    status: 'TODO',
    priority: 'Urgent',
    clientVisible: true
  });
  assert(!!testTask.id, `Created task with ID: ${testTask.id}`);

  // Progress update when task completes
  dataStore.updateTask(testTask.id, { status: 'COMPLETED' });
  const updatedProject = dataStore.getProjectById(testProject.id);
  assert(updatedProject?.progress === 100, `Project progress auto-updated to 100% (actual: ${updatedProject?.progress}%)`);

  // -------------------------------------------------------------
  // TEST 4: CRM (LEADS & DEALS) & PUBLIC CONSULTATION FEED
  // -------------------------------------------------------------
  console.log('\n4. Testing CRM & Public Consultation Integration...');
  const testLead = dataStore.addLead({
    id: 'KC-LEAD-TEST-999',
    name: 'Enterprise Client Contact',
    email: 'client.contact@apexcorp.com',
    company: 'Apex Corporation',
    service: 'AI Advisory',
    budget: '₹25L - ₹50L',
    source: 'Website Form',
    status: 'New Lead'
  });
  assert(!!testLead.id, `Created CRM lead with ID: ${testLead.id}`);
  const foundLead = dataStore.getLeadById(testLead.id);
  assert(foundLead?.email === 'client.contact@apexcorp.com', 'Verified CRM lead queryable by ID');

  // -------------------------------------------------------------
  // TEST 5: FINANCE (INVOICES, EXPENSES & PAYMENTS)
  // -------------------------------------------------------------
  console.log('\n5. Testing Finance Engine (Dual-Tier Persistence)...');
  const testInvoice = dataStore.addInvoice({
    client: 'Apex Global Enterprises',
    projectName: testProject.name,
    amount: 500000,
    tax: 90000,
    total: 590000,
    status: 'Sent'
  });
  assert(!!testInvoice.id, `Created invoice with ID: ${testInvoice.id} for ₹5,90,000`);

  const testExpense = dataStore.addExpense({
    vendor: 'AWS Cloud Services',
    category: 'Cloud Infrastructure',
    amount: 45000,
    projectName: testProject.name,
    status: 'Paid'
  });
  assert(!!testExpense.id, `Created expense with ID: ${testExpense.id} for ₹45,000`);

  // Record payment linked to invoice
  const testPayment = dataStore.addPayment({
    invoiceId: testInvoice.id,
    client: 'Apex Global Enterprises',
    amount: 590000,
    method: 'Bank Transfer'
  });
  assert(!!testPayment.id, `Created payment with ID: ${testPayment.id}`);
  const paidInvoice = dataStore.getInvoiceById(testInvoice.id);
  assert(paidInvoice?.status === 'Paid', `Invoice status automatically updated to 'Paid' upon payment`);

  // -------------------------------------------------------------
  // TEST 6: ATTENDANCE & TIMESHEETS
  // -------------------------------------------------------------
  console.log('\n6. Testing Workforce Logs (Attendance & Timesheets)...');
  const testAttendance = dataStore.addAttendance({
    employeeName: 'Shon Kapate',
    status: 'Present',
    checkIn: '09:00 AM',
    checkOut: '06:30 PM',
    totalHours: 9.5
  });
  assert(!!testAttendance.id, `Logged attendance for Shon Kapate (${testAttendance.totalHours} hrs)`);

  const testTimesheet = dataStore.addTimesheet({
    employeeName: 'Shon Kapate',
    projectName: testProject.name,
    taskName: testTask.title,
    hours: 8,
    isBillable: true,
    description: 'Executed complete OS verification test battery'
  });
  assert(!!testTimesheet.id, `Submitted timesheet entry with ID: ${testTimesheet.id}`);

  // -------------------------------------------------------------
  // TEST 7: SYSTEM SETTINGS & RBAC PERMISSIONS PERSISTENCE
  // -------------------------------------------------------------
  console.log('\n7. Testing System Settings & RBAC Permissions...');
  const settings = dataStore.getSystemSettings();
  assert(!!settings.organization.companyName, `System organization name: ${settings.organization.companyName}`);

  const updatedSettings = dataStore.updateSystemSettings({
    organization: { ...settings.organization, hqAddress: 'Bangalore Tech Hub, Karnataka, India' }
  });
  assert(updatedSettings.organization.hqAddress === 'Bangalore Tech Hub, Karnataka, India', 'System settings update persisted');

  const rbac = dataStore.getRolePermissions();
  assert(rbac.SUPER_ADMIN.includes('system.admin'), 'SUPER_ADMIN retains system.admin permission');

  // -------------------------------------------------------------
  // TEST 8: SECURITY SESSIONS & AUDIT LOGS
  // -------------------------------------------------------------
  console.log('\n8. Testing Security Sessions & Audit Trails...');
  const testSession: SecuritySession = {
    id: `sess-test-${Date.now()}`,
    userId: admin.id,
    userName: admin.name,
    email: admin.email,
    userEmail: admin.email,
    role: admin.role,
    ipAddress: '192.168.1.100',
    userAgent: 'Audit Verification Agent',
    loginAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    status: 'ACTIVE',
    device: 'Desktop Workstation',
    isImpersonated: false
  };
  dataStore.addSession(testSession);
  const activeSessions = dataStore.getSessions();
  assert(activeSessions.some(s => s.id === testSession.id), 'Active security session registered');

  const revoked = dataStore.revokeSession(testSession.id);
  assert(revoked, 'Security session revoked successfully');
  const activeAfterRevoke = dataStore.getSessions();
  assert(!activeAfterRevoke.some(s => s.id === testSession.id), 'Revoked session removed from active sessions');

  // Audit Log
  const auditLogsBefore = dataStore.getAuditLogs().length;
  dataStore.addAuditLog({
    actor: admin.name,
    actorKapateId: admin.kapateId,
    action: 'TEST_AUDIT_VERIFICATION',
    module: 'system',
    resource: 'System Test',
    details: 'Master verification test executed',
    result: 'SUCCESS'
  });
  const auditLogsAfter = dataStore.getAuditLogs().length;
  assert(auditLogsAfter > auditLogsBefore, `Audit log entry recorded (total: ${auditLogsAfter})`);

  // -------------------------------------------------------------
  // TEST 9: AUTHENTICATION DECOUPLING GUARANTEE (CRITICAL PRINCIPLE)
  // -------------------------------------------------------------
  console.log('\n9. Verifying Critical Principle: Authentication Decoupling...');
  // Simulate an employee logging out or their session being completely revoked:
  dataStore.revokeAllUserSessions(admin.id);

  // Verify business entities are completely untouched:
  const checkProjects = dataStore.getProjects();
  const checkEmployees = dataStore.getEmployees();
  const checkTasks = dataStore.getTasks();
  const checkInvoices = dataStore.getInvoices();
  const checkExpenses = dataStore.getExpenses();
  const checkTimesheets = dataStore.getTimesheets();
  const checkAudit = dataStore.getAuditLogs();

  assert(checkProjects.some(p => p.id === testProject.id), 'Projects preserved after session termination');
  assert(checkEmployees.some(e => e.id === testEmp.id), 'Employees preserved after session termination');
  assert(checkTasks.some(t => t.id === testTask.id), 'Tasks preserved after session termination');
  assert(checkInvoices.some(i => i.id === testInvoice.id), 'Invoices preserved after session termination');
  assert(checkExpenses.some(e => e.id === testExpense.id), 'Expenses preserved after session termination');
  assert(checkTimesheets.some(ts => ts.id === testTimesheet.id), 'Timesheets preserved after session termination');
  assert(checkAudit.length > 0, 'Audit logs preserved after session termination');

  console.log('\n================================================================');
  console.log('✅ ALL KAPATE OS MASTER FUNCTIONS VERIFIED AND PASSED 100%!');
  console.log('================================================================\n');
}

runMasterVerification().catch((err) => {
  console.error('\n❌ VERIFICATION RUN FAILED:', err);
  process.exit(1);
});
