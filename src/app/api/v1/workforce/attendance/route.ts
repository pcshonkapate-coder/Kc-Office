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

  let filterUser: string | undefined = undefined;
  if (auth.user.role === 'EMPLOYEE' || auth.user.role === 'INTERN') {
    filterUser = auth.user.userId;
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
    const body = await req.json();
    const newRecord = dataStore.addAttendance({
      date: body.date || new Date().toISOString().split('T')[0],
      employeeName: body.employeeName || auth.user.name || 'Staff Member',
      status: body.status || 'Present',
      checkIn: body.checkIn || body.clockIn || '09:00 AM',
      checkOut: body.checkOut || body.clockOut || '06:00 PM',
      totalHours: Number(body.totalHours) || 8,
    });

    // Best-effort replication
    getDatabase()
      .then(({ db }) => db.collection<AttendanceRecord>('attendance').insertOne(newRecord as any))
      .catch(() => {});

    return NextResponse.json({ success: true, data: newRecord, record: newRecord }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
