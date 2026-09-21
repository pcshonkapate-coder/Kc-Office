import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';
import { getDatabase } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const settings = dataStore.getSystemSettings();

  return NextResponse.json({
    success: true,
    data: settings
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error || 'Only Super Admin can update system configuration.' }, { status: 403 });
  }

  try {
    const updates = await req.json();
    const updatedSettings = dataStore.updateSystemSettings(updates);

    dataStore.addAuditLog({
      actor: auth.user.name,
      actorKapateId: auth.user.kapateId,
      actorName: auth.user.name,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: 'SETTINGS_UPDATE',
      module: 'system',
      resource: 'System Configuration',
      targetResource: 'system/settings',
      targetLabel: 'Enterprise Settings',
      severity: 'warning',
      details: 'Updated enterprise operational parameters and security settings.',
      reason: 'Admin modified system parameters',
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    // Best-effort replication to MongoDB
    getDatabase()
      .then(async ({ db }) => {
        await db.collection('system_config').updateOne(
          { _id: 'system_settings' as any },
          { $set: { settings: updatedSettings, updatedAt: new Date().toISOString(), updatedBy: auth.user.email } },
          { upsert: true }
        );
      })
      .catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'System settings successfully persisted.',
      data: updatedSettings
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
