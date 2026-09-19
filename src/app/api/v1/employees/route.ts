import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'FINANCE']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get('search') || '').toLowerCase().trim();
  const department = searchParams.get('department');
  const status = searchParams.get('status');

  let employees = dataStore.getEmployees();

  if (search) {
    employees = employees.filter(e =>
      e.name.toLowerCase().includes(search) ||
      e.email.toLowerCase().includes(search) ||
      (e.kapateId && e.kapateId.toLowerCase().includes(search)) ||
      (e.role && e.role.toLowerCase().includes(search))
    );
  }

  if (department && department !== 'ALL') {
    employees = employees.filter(e => e.department.toLowerCase() === department.toLowerCase());
  }

  if (status && status !== 'ALL') {
    employees = employees.filter(e => e.status.toLowerCase() === status.toLowerCase());
  }

  return NextResponse.json({
    success: true,
    data: employees,
    count: employees.length
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ success: false, error: 'Employee name is required.' }, { status: 400 });
    }

    const created = dataStore.addEmployee(body);

    // Immediate post-insert verification
    const verified = dataStore.getEmployeeById(created.id);
    if (!verified) {
      return NextResponse.json(
        { success: false, error: 'Database persistence verification failed.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: verified,
      message: `Employee ${verified.name} (${verified.kapateId}) created successfully.`
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
