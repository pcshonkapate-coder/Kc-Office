import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();

  if (!q) {
    return NextResponse.json({
      success: true,
      data: {
        projects: [],
        tasks: [],
        leads: [],
        invoices: [],
        employees: []
      }
    });
  }

  const role = auth.user.role;
  const userName = auth.user.name.toLowerCase();

  // RBAC Permission Flags
  const canSeeCommercial = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'PROJECT_MANAGER';
  const canSeeFinance = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'FINANCE';
  const isClient = role === 'CLIENT';
  const isIntern = role === 'INTERN';

  // Projects search
  let projects = dataStore.getProjects().filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.client.toLowerCase().includes(q) ||
    p.description?.toLowerCase().includes(q)
  );
  if (isClient) {
    projects = projects.filter(p => p.client.toLowerCase().includes(userName));
  } else if (isIntern) {
    // Interns only see assigned team projects or internal training initiatives
    projects = projects.filter(p =>
      (p.team && p.team.some(m => m.toLowerCase().includes(userName))) ||
      p.name.toLowerCase().includes('internal') ||
      p.client.toLowerCase().includes('internal') ||
      p.name.toLowerCase().includes('training')
    );
  }

  // Tasks search
  let tasks = dataStore.getTasks().filter(t =>
    t.title.toLowerCase().includes(q) ||
    t.projectName?.toLowerCase().includes(q) ||
    t.assignedTo?.toLowerCase().includes(q)
  );
  if (isClient) {
    tasks = tasks.filter(t => t.clientVisible || t.assignedTo?.toLowerCase().includes(userName));
  } else if (isIntern) {
    tasks = tasks.filter(t => t.assignedTo?.toLowerCase().includes(userName));
  }

  // Leads search (Strictly blocked for Interns and Clients)
  let leads: any[] = [];
  if (canSeeCommercial) {
    leads = dataStore.getLeads().filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.company.toLowerCase().includes(q) ||
      l.service.toLowerCase().includes(q)
    );
  }

  // Invoices search (Strictly blocked for Interns and regular employees)
  let invoices: any[] = [];
  if (canSeeFinance) {
    invoices = dataStore.getInvoices().filter(i =>
      i.id.toLowerCase().includes(q) ||
      i.client.toLowerCase().includes(q) ||
      i.projectName?.toLowerCase().includes(q)
    );
  } else if (isClient) {
    invoices = dataStore.getInvoices().filter(i =>
      i.client.toLowerCase().includes(userName) &&
      (i.id.toLowerCase().includes(q) || i.projectName?.toLowerCase().includes(q))
    );
  }

  // Employees directory (Blocked for clients)
  let employees: any[] = [];
  if (!isClient) {
    employees = dataStore.getEmployees().filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.role.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q) ||
      (e.kapateId && e.kapateId.toLowerCase().includes(q))
    ).map(e => ({
      id: e.id,
      name: e.name,
      role: e.role,
      department: e.department,
      kapateId: e.kapateId,
      email: e.email
    }));
  }

  return NextResponse.json({
    success: true,
    data: {
      projects,
      tasks,
      leads,
      invoices,
      employees
    }
  });
}
