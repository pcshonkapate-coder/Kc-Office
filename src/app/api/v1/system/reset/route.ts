import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';

export async function POST(req: NextRequest) {
  // Only SUPER_ADMIN can execute system reset
  const auth = await requireAuth(req, ['SUPER_ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: auth.status });
  }

  // Production safety guard
  const isProduction = process.env.NODE_ENV === 'production' && !process.env.ALLOW_SYSTEM_RESET;
  if (isProduction) {
    return NextResponse.json(
      {
        success: false,
        error: 'System reset is disabled in production environments. Contact infrastructure engineering.'
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { confirmationPhrase } = body;

    // Strict safety confirmation requirement
    if (confirmationPhrase !== 'CONFIRM_ENTERPRISE_SYSTEM_RESET') {
      return NextResponse.json(
        {
          success: false,
          error: 'Explicit confirmation required. Please provide confirmationPhrase: "CONFIRM_ENTERPRISE_SYSTEM_RESET".'
        },
        { status: 400 }
      );
    }

    const { db } = await getDatabase();

    const collectionsToClear = [
      'leads',
      'deals',
      'companies',
      'contacts',
      'invoices',
      'payments',
      'expenses',
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
      await db.collection(col).deleteMany({}).catch(() => {});
    }

    dataStore.addAuditLog({
      actor: auth.user.name,
      actorKapateId: auth.user.kapateId,
      actorName: auth.user.name,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: 'SYSTEM_RESET_EXECUTED',
      module: 'system',
      resource: 'System Reset Engine',
      targetResource: 'system/reset',
      targetLabel: 'All Operational Collections',
      severity: 'critical',
      details: 'Operational records reset by Super Admin under explicit confirmation phrase.',
      reason: 'Admin executed reset command',
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      message: 'Kapate OS operational collections have been reset. Master configuration and administrator accounts preserved.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'System reset failed' }, { status: 500 });
  }
}
