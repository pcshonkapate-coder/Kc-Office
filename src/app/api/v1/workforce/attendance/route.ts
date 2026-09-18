import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { AttendanceRecord } from '@/types';

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

  const attendance = await db.collection<AttendanceRecord>('attendance').find(query).sort({ date: -1 }).toArray();
  return NextResponse.json({ data: attendance });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'INTERN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { db } = await getDatabase();

  const newRecord: AttendanceRecord = {
    id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    date: body.date || new Date().toISOString().split('T')[0],
    employeeName: body.employeeName || auth.user.name || 'Staff Member',
    status: body.status || 'Present',
    checkIn: body.checkIn || '09:00 AM',
    checkOut: body.checkOut || '06:00 PM',
    totalHours: Number(body.totalHours) || 8,
  };

  await db.collection<AttendanceRecord>('attendance').insertOne(newRecord as any);
  return NextResponse.json({ data: newRecord }, { status: 201 });
}
