import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';
import { getDatabase } from '@/lib/mongodb';
import { AuditLogEntry } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get('search') || '').toLowerCase().trim();
  const severity = searchParams.get('severity');
  const action = searchParams.get('action');
  const resource = searchParams.get('resource');
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  let logs = dataStore.getAuditLogs();

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
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { action, resource, targetId, targetLabel, severity = 'info', details, metadata } = body;

    if (!action || !resource || !details) {
      return NextResponse.json({ success: false, error: 'Action, resource, and details are required for audit entry.' }, { status: 400 });
    }

    const newLog = dataStore.addAuditLog({
      action,
      module: resource,
      resource,
      targetResource: targetId,
      targetLabel,
      severity: severity as 'info' | 'warning' | 'critical',
      details,
      reason: details,
      actor: auth.user.name,
      actorKapateId: auth.user.kapateId,
      actorName: auth.user.name,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      metadata
    });

    // Best-effort replication
    getDatabase()
      .then(async ({ db }) => {
        await db.collection('audit_logs').insertOne(newLog as any);
      })
      .catch(() => {});

    return NextResponse.json({
      success: true,
      data: newLog
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
