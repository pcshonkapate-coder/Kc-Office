import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  // Only SUPER_ADMIN or ADMIN can wipe or reset the OS
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { db } = await getDatabase();

  // Clear all operational collections to guarantee a fresh, pristine enterprise OS
  const collectionsToClear = [
    'leads',
    'deals',
    'companies',
    'contacts',
    'projects',
    'tasks',
    'invoices',
    'payments',
    'expenses',
    'employees',
    'interns',
    'freelancers',
    'timesheets',
    'attendance',
    'leaves',
    'mail_threads',
    'mail_messages',
    'registration_requests',
    'onboarding_invitations',
    'security_logs',
    'notifications',
  ];

  for (const col of collectionsToClear) {
    await db.collection(col).deleteMany({});
  }

  return NextResponse.json({
    success: true,
    message: 'Kapate OS has been successfully reset. All operational collections are clean and ready for live production use.',
  });
}
