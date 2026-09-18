import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { db } = await getDatabase();

  // Create default admin user if not exists
  const existingAdmin = await db.collection('users').findOne({ email: 'admin@kapate.internal' });
  if (!existingAdmin) {
    await db.collection('users').insertOne({
      id: 'usr-admin-1',
      name: 'Executive Lead',
      email: 'admin@kapate.internal',
      role: 'SUPER_ADMIN',
      department: 'Executive Leadership',
      designation: 'Managing Director & Principal Architect',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    success: true,
    message: 'Initial administration kernel validated.',
  });
}
