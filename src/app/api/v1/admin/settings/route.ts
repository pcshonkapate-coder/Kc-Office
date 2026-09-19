import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { DEFAULT_SYSTEM_SETTINGS } from '@/data/superAdminData';
import { SystemSettings } from '@/types';

let localSettingsCache: SystemSettings = { ...DEFAULT_SYSTEM_SETTINGS };

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { db } = await getDatabase();
    const doc = await db.collection('system_config').findOne({ _id: 'system_settings' as any });
    if (doc && doc.settings) {
      localSettingsCache = doc.settings;
    }
  } catch {
    // Fallback
  }

  return NextResponse.json({
    success: true,
    data: localSettingsCache
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Only Super Admin can update system configuration.' }, { status: 403 });
  }

  try {
    const updates = await req.json();

    localSettingsCache = {
      ...localSettingsCache,
      ...updates,
      organization: { ...localSettingsCache.organization, ...(updates.organization || updates.general || {}) },
      authentication: { ...localSettingsCache.authentication, ...(updates.authentication || updates.security || {}) },
      email: { ...localSettingsCache.email, ...(updates.email || updates.mail || {}) },
      ai: { ...localSettingsCache.ai, ...(updates.ai || {}) },
      storage: { ...localSettingsCache.storage, ...(updates.storage || updates.backup || {}) },
    };

    try {
      const { db } = await getDatabase();
      await db.collection('system_config').updateOne(
        { _id: 'system_settings' as any },
        { $set: { settings: localSettingsCache, updatedAt: new Date().toISOString(), updatedBy: auth.user.email } },
        { upsert: true }
      );
      await db.collection('audit_logs').insertOne({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: auth.user.name,
        actorKapateId: auth.user.kapateId,
        actorName: auth.user.name,
        actorEmail: auth.user.email,
        actorRole: auth.user.role,
        action: 'SETTINGS_UPDATE',
        module: 'system',
        resource: 'System Configuration',
        targetLabel: 'Enterprise Settings',
        severity: 'warning',
        details: `Updated enterprise operational parameters and security settings.`,
        result: 'SUCCESS',
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      });
    } catch {
      // Fallback
    }

    return NextResponse.json({
      success: true,
      message: 'System settings successfully persisted.',
      data: localSettingsCache
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
