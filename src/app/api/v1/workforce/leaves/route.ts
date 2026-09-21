import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';
import { getDatabase } from '@/lib/mongodb';
import { LeaveRequest } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'INTERN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  let filterUser: string | undefined = undefined;
  if (auth.user.role === 'EMPLOYEE' || auth.user.role === 'INTERN') {
    filterUser = auth.user.userId;
  }

  const leaves = dataStore.getLeaves(filterUser);
  return NextResponse.json({ success: true, data: leaves, leaves });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'INTERN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const newLeave = dataStore.addLeave({
      employeeName: body.employeeName || auth.user.name || 'Staff Member',
      leaveType: body.leaveType || body.type || 'Casual Leave',
      startDate: body.startDate || new Date().toISOString().split('T')[0],
      endDate: body.endDate || new Date().toISOString().split('T')[0],
      days: Number(body.days) || 1,
      reason: body.reason || '',
      status: body.status || 'Pending',
    });

    // Best-effort replication
    getDatabase()
      .then(({ db }) => db.collection<LeaveRequest>('leaves').insertOne(newLeave as any))
      .catch(() => {});

    return NextResponse.json({ success: true, data: newLeave, leave: newLeave }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Leave request ID is required' }, { status: 400 });
    }

    const { id, _id, ...updateData } = body;
    const updated = dataStore.updateLeave(id, updateData);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Leave request not found' }, { status: 404 });
    }

    // Best-effort replication
    getDatabase()
      .then(({ db }) => db.collection<LeaveRequest>('leaves').updateOne({ id }, { $set: updateData }))
      .catch(() => {});

    return NextResponse.json({ success: true, data: updated, leave: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
