import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';
import { getDatabase } from '@/lib/mongodb';
import { TimesheetEntry } from '@/types';

function getWorkweekKey(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'current-week';
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  } catch {
    return 'current-week';
  }
}

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

  // Compute server-authoritative weekly overtime (>40h standard week)
  const employeeWeekTotals: Record<string, number> = {};
  timesheets.forEach(ts => {
    const emp = ts.employeeName || 'Unknown';
    const weekKey = `${emp}__${getWorkweekKey(ts.date)}`;
    employeeWeekTotals[weekKey] = (employeeWeekTotals[weekKey] || 0) + (Number(ts.hours) || 0);
  });

  const enrichedTimesheets = timesheets.map(ts => {
    const emp = ts.employeeName || 'Unknown';
    const weekKey = `${emp}__${getWorkweekKey(ts.date)}`;
    const weekTotal = employeeWeekTotals[weekKey] || Number(ts.hours) || 0;
    const isOvertime = weekTotal > 40;
    const overtimeHours = isOvertime ? Math.round((weekTotal - 40) * 10) / 10 : 0;
    return {
      ...ts,
      weeklyTotalHours: weekTotal,
      isOvertime,
      overtimeHours
    };
  });

  return NextResponse.json({ success: true, data: enrichedTimesheets, timesheets: enrichedTimesheets });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'INTERN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const empName = body.employeeName || auth.user.name || 'Staff Member';
    const dateStr = body.date || new Date().toISOString().split('T')[0];
    const hours = Number(body.hours) || 8;

    // Check existing week hours for overtime flagging
    const weekKey = getWorkweekKey(dateStr);
    const existingWeekHours = dataStore.getTimesheets(empName)
      .filter(t => getWorkweekKey(t.date) === weekKey)
      .reduce((sum, t) => sum + (Number(t.hours) || 0), 0);

    const projectedWeekTotal = existingWeekHours + hours;
    const isOvertime = projectedWeekTotal > 40;
    const overtimeHours = isOvertime ? Math.round((projectedWeekTotal - 40) * 10) / 10 : 0;

    const newEntry = dataStore.addTimesheet({
      date: dateStr,
      day: body.day || new Date().toLocaleDateString('en-US', { weekday: 'short' }),
      projectName: body.projectName || 'General Work',
      taskName: body.taskName || body.task || 'Consultancy & Implementation',
      hours,
      isBillable: body.isBillable !== false && body.billable !== false,
      description: body.description || '',
      status: body.status || 'Submitted',
      employeeName: empName,
    });

    const responseEntry = {
      ...newEntry,
      weeklyTotalHours: projectedWeekTotal,
      isOvertime,
      overtimeHours
    };

    // Best-effort replication
    getDatabase()
      .then(({ db }) => db.collection<TimesheetEntry>('timesheets').insertOne(newEntry as any))
      .catch(() => {});

    return NextResponse.json({ success: true, data: responseEntry, timesheet: responseEntry }, { status: 201 });
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

    // Verify timesheet immutability: Cannot modify already Approved timesheets
    const existingTimesheets = dataStore.getTimesheets();
    const existing = existingTimesheets.find(t => t.id === body.id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Timesheet entry not found' }, { status: 404 });
    }

    if (existing.status === 'Approved' && auth.user.role !== 'SUPER_ADMIN' && body.status !== 'Rejected') {
      return NextResponse.json({
        success: false,
        error: 'Forbidden: Cannot modify an already Approved timesheet entry. Approved records are immutable for payroll audit compliance.'
      }, { status: 403 });
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
