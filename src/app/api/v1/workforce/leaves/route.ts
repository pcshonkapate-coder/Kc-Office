import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { LeaveRequest } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'INTERN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { db } = await getDatabase();
  const query: Record<string, any> = {};

  if (auth.user.role === 'EMPLOYEE' || auth.user.role === 'INTERN') {
    query.employeeName = auth.user.name;
  }

  const leaves = await db.collection<LeaveRequest>('leaves').find(query).sort({ startDate: -1 }).toArray();
  return NextResponse.json({ data: leaves });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'INTERN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { db } = await getDatabase();

  const newLeave: LeaveRequest = {
    id: `leave-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    employeeName: body.employeeName || auth.user.name || 'Staff Member',
    leaveType: body.leaveType || 'Casual Leave',
    startDate: body.startDate || new Date().toISOString().split('T')[0],
    endDate: body.endDate || new Date().toISOString().split('T')[0],
    days: Number(body.days) || 1,
    reason: body.reason || '',
    status: body.status || 'Pending',
  };

  await db.collection<LeaveRequest>('leaves').insertOne(newLeave as any);
  return NextResponse.json({ data: newLeave }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: 'Leave request ID is required' }, { status: 400 });
  }

  const { db } = await getDatabase();
  const { _id, ...updateData } = body;

  const result = await db.collection<LeaveRequest>('leaves').findOneAndUpdate(
    { id: body.id },
    { $set: updateData },
    { returnDocument: 'after' }
  );

  return NextResponse.json({ data: result });
}
