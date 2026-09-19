import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { INITIAL_AUDIT_LOGS } from '@/data/superAdminData';
import { AuditLogEntry } from '@/types';

let localAuditCache: AuditLogEntry[] = [...INITIAL_AUDIT_LOGS];

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get('search') || '').toLowerCase().trim();
  const severity = searchParams.get('severity');
  const action = searchParams.get('action');
  const resource = searchParams.get('resource');
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  let logs = [...localAuditCache];

  try {
    const { db } = await getDatabase();
    const dbLogs = await db.collection<AuditLogEntry>('audit_logs')
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    if (dbLogs && dbLogs.length > 0) {
      logs = dbLogs;
      localAuditCache = [...dbLogs];
    }
  } catch {
    // Fallback
  }

  if (search) {
    logs = logs.filter(l =>
      (l.details || l.reason || '').toLowerCase().includes(search) ||
      (l.actorName || l.actor || '').toLowerCase().includes(search) ||
      (l.actorEmail || l.targetUser || '').toLowerCase().includes(search) ||
      l.action.toLowerCase().includes(search) ||
      (l.targetLabel && l.targetLabel.toLowerCase().includes(search))
    );
  }

  if (severity && severity !== 'ALL') {
    logs = logs.filter(l => l.severity === severity);
  }

  if (action && action !== 'ALL') {
    logs = logs.filter(l => l.action.includes(action));
  }

  if (resource && resource !== 'ALL') {
    logs = logs.filter(l => l.resource === resource || l.module === resource);
  }

  return NextResponse.json({
    success: true,
    data: logs.slice(0, limit),
    total: logs.length
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { action, resource, targetId, targetLabel, severity = 'info', details, metadata } = body;

    if (!action || !resource || !details) {
      return NextResponse.json({ error: 'Action, resource, and details are required for audit entry.' }, { status: 400 });
    }

    const newLog: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      actor: auth.user.name,
      actorKapateId: auth.user.kapateId,
      actorName: auth.user.name,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action,
      module: resource,
      resource,
      targetResource: targetId,
      targetLabel,
      severity: severity as 'info' | 'warning' | 'critical',
      details,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      metadata
    };

    localAuditCache.unshift(newLog);

    try {
      const { db } = await getDatabase();
      await db.collection('audit_logs').insertOne(newLog as any);
    } catch {
      // Fallback
    }

    return NextResponse.json({
      success: true,
      data: newLog
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
