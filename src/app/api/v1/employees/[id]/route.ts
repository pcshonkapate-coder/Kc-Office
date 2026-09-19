import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'FINANCE']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const employee = dataStore.getEmployeeById(id);

  if (!employee) {
    return NextResponse.json({ success: false, error: 'Employee not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: employee });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const body = await req.json();

  const updated = dataStore.updateEmployee(id, body);
  if (!updated) {
    return NextResponse.json({ success: false, error: 'Employee not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  try {
    const success = dataStore.deleteEmployee(id, true);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Employee not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Employee successfully soft-deleted.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
