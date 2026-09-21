import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';
import { getDatabase } from '@/lib/mongodb';
import { TimesheetEntry } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'FINANCE', 'INTERN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  let filterUser: string | undefined = undefined;
  // Employees/interns can only see their own timesheets unless admin/PM
  if (auth.user.role === 'EMPLOYEE' || auth.user.role === 'INTERN') {
    filterUser = auth.user.name;
  }

  const timesheets = dataStore.getTimesheets(filterUser);
  return NextResponse.json({ success: true, data: timesheets, timesheets });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'INTERN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const newEntry = dataStore.addTimesheet({
      date: body.date || new Date().toISOString().split('T')[0],
      day: body.day || new Date().toLocaleDateString('en-US', { weekday: 'short' }),
      projectName: body.projectName || 'General Work',
      taskName: body.taskName || body.task || 'Consultancy & Implementation',
      hours: Number(body.hours) || 8,
      isBillable: body.isBillable !== false && body.billable !== false,
      description: body.description || '',
      status: body.status || 'Submitted',
      employeeName: body.employeeName || auth.user.name || 'Staff Member',
    });

    // Best-effort replication
    getDatabase()
      .then(({ db }) => db.collection<TimesheetEntry>('timesheets').insertOne(newEntry as any))
      .catch(() => {});

    return NextResponse.json({ success: true, data: newEntry, timesheet: newEntry }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Timesheet ID is required' }, { status: 400 });
    }

    const { id, _id, ...updateData } = body;
    const updated = dataStore.updateTimesheet(id, updateData);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Timesheet entry not found' }, { status: 404 });
    }

    // Best-effort replication
    getDatabase()
      .then(({ db }) => db.collection<TimesheetEntry>('timesheets').updateOne({ id }, { $set: updateData }))
      .catch(() => {});

    return NextResponse.json({ success: true, data: updated, timesheet: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Timesheet ID is required' }, { status: 400 });
    }

    dataStore.deleteTimesheet(id);

    // Best-effort replication
    getDatabase()
      .then(({ db }) => db.collection('timesheets').deleteOne({ id }))
      .catch(() => {});

    return NextResponse.json({ success: true, message: 'Timesheet entry deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
