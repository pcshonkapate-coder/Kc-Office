import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { TimesheetEntry } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'FINANCE']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { db } = await getDatabase();
  const query: Record<string, any> = {};

  // Employees can only see their own timesheets unless admin/PM
  if (auth.user.role === 'EMPLOYEE' || auth.user.role === 'INTERN') {
    query.employeeName = auth.user.name;
  }

  const timesheets = await db.collection<TimesheetEntry>('timesheets').find(query).sort({ date: -1 }).toArray();
  return NextResponse.json({ data: timesheets });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'INTERN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { db } = await getDatabase();

  const newEntry: TimesheetEntry = {
    id: `ts-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    date: body.date || new Date().toISOString().split('T')[0],
    day: body.day || new Date().toLocaleDateString('en-US', { weekday: 'short' }),
    projectName: body.projectName || 'General Work',
    taskName: body.taskName || 'Consultancy & Implementation',
    hours: Number(body.hours) || 0,
    isBillable: body.isBillable !== false,
    description: body.description || '',
    status: body.status || 'Draft',
    employeeName: body.employeeName || auth.user.name || 'Staff Member',
  };

  await db.collection<TimesheetEntry>('timesheets').insertOne(newEntry as any);
  return NextResponse.json({ data: newEntry }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: 'Timesheet ID is required' }, { status: 400 });
  }

  const { db } = await getDatabase();
  const { _id, ...updateData } = body;

  const result = await db.collection<TimesheetEntry>('timesheets').findOneAndUpdate(
    { id: body.id },
    { $set: updateData },
    { returnDocument: 'after' }
  );

  return NextResponse.json({ data: result });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Timesheet ID is required' }, { status: 400 });
  }

  const { db } = await getDatabase();
  await db.collection('timesheets').deleteOne({ id });
  return NextResponse.json({ success: true, message: 'Timesheet entry deleted' });
}
