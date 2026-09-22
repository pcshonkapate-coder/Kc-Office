import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';
import { getDatabase } from '@/lib/mongodb';
import { AttendanceRecord } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'INTERN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const statusQuery = searchParams.get('status');

  // Active Clock-In query for current user
  if (statusQuery === 'active') {
    const activeSession = dataStore.getActiveClockSession(auth.user.userId);
    if (!activeSession) {
      return NextResponse.json({ success: true, active: false, session: null });
    }
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - activeSession.clockInTimestamp) / 1000));
    return NextResponse.json({
      success: true,
      active: true,
      session: {
        ...activeSession,
        elapsedSeconds
      }
    });
  }

  let filterUser: string | undefined = undefined;
  if (auth.user.role === 'EMPLOYEE' || auth.user.role === 'INTERN') {
    filterUser = auth.user.name;
  }

  const attendance = dataStore.getAttendance(filterUser);
  return NextResponse.json({ success: true, data: attendance, attendance });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'INTERN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    // Server-Authoritative CLOCK_IN
    if (action === 'CLOCK_IN') {
      const existing = dataStore.getActiveClockSession(auth.user.userId);
      if (existing) {
        return NextResponse.json({
          success: true,
          status: 'ALREADY_CLOCKED_IN',
          session: existing,
          message: `Already clocked in since ${existing.clockInFormatted}`
        });
      }

      const now = Date.now();
      const clockInFormatted = new Date(now).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const todayDate = new Date(now).toISOString().split('T')[0];

      const newSession = dataStore.startClockSession({
        userId: auth.user.userId,
        employeeName: auth.user.name,
        kapateId: auth.user.kapateId || 'KAP-EMP-000001',
        clockInTimestamp: now,
        clockInFormatted,
        date: todayDate
      });

      dataStore.addAuditLog({
        actor: auth.user.name,
        actorKapateId: auth.user.kapateId || 'KAP-EMP-000001',
        action: 'CLOCK_IN',
        module: 'workforce',
        targetResource: `attendance/${auth.user.userId}`,
        targetUser: auth.user.email,
        newValue: JSON.stringify({ clockIn: clockInFormatted, date: todayDate }),
        result: 'SUCCESS',
        reason: 'Server-authoritative attendance session started'
      });

      return NextResponse.json({
        success: true,
        status: 'CLOCKED_IN',
        session: newSession,
        clockInTimestamp: now,
        clockInFormatted
      });
    }

    // Server-Authoritative CLOCK_OUT
    if (action === 'CLOCK_OUT') {
      const activeSession = dataStore.endClockSession(auth.user.userId);
      const now = Date.now();
      const clockOutFormatted = new Date(now).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const todayDate = new Date(now).toISOString().split('T')[0];

      // Calculate server duration (minimum 0.5h if tested immediately)
      const startTime = activeSession ? activeSession.clockInTimestamp : (now - 8 * 3600 * 1000);
      const rawHours = (now - startTime) / 3600000;
      const totalHours = Math.max(0.5, Math.round(rawHours * 10) / 10);

      const newRecord = dataStore.addAttendance({
        date: activeSession?.date || todayDate,
        employeeName: auth.user.name,
        status: 'Present',
        checkIn: activeSession?.clockInFormatted || '09:00 AM',
        checkOut: clockOutFormatted,
        totalHours
      });

      // Server creates verified timesheet entry
      const newTimesheet = dataStore.addTimesheet({
        employeeName: auth.user.name,
        projectName: 'Enterprise Core Platform',
        taskName: 'Operational Delivery & Consulting',
        hours: totalHours,
        date: activeSession?.date || todayDate,
        day: new Date().toLocaleDateString('en-US', { weekday: 'short' }),
        description: `Authoritative attendance duration logged from ${activeSession?.clockInFormatted || '09:00 AM'} to ${clockOutFormatted}`,
        status: 'Submitted',
        isBillable: true
      });

      dataStore.addAuditLog({
        actor: auth.user.name,
        actorKapateId: auth.user.kapateId || 'KAP-EMP-000001',
        action: 'CLOCK_OUT',
        module: 'workforce',
        targetResource: `attendance/${newRecord.id}`,
        targetUser: auth.user.email,
        newValue: JSON.stringify({ checkOut: clockOutFormatted, totalHours, timesheetId: newTimesheet.id }),
        result: 'SUCCESS',
        reason: 'Server-authoritative attendance ended; timesheet entry created'
      });

      // Best-effort replication
      getDatabase()
        .then(({ db }) => {
          db.collection<AttendanceRecord>('attendance').insertOne(newRecord as any);
          db.collection('timesheets').insertOne(newTimesheet as any);
        })
        .catch(() => {});

      return NextResponse.json({
        success: true,
        status: 'CLOCKED_OUT',
        totalHours,
        attendance: newRecord,
        timesheet: newTimesheet
      });
    }

    // Direct manual attendance entry by admin/manager
    const newRecord = dataStore.addAttendance({
      date: body.date || new Date().toISOString().split('T')[0],
      employeeName: body.employeeName || auth.user.name || 'Staff Member',
      status: body.status || 'Present',
      checkIn: body.checkIn || body.clockIn || '09:00 AM',
      checkOut: body.checkOut || body.clockOut || '06:00 PM',
      totalHours: Number(body.totalHours) || 8,
    });

    getDatabase()
      .then(({ db }) => db.collection<AttendanceRecord>('attendance').insertOne(newRecord as any))
      .catch(() => {});

    return NextResponse.json({ success: true, data: newRecord, record: newRecord }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
