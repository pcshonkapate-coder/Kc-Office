import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, signAuthToken } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';
import { getDatabase } from '@/lib/mongodb';
import { User } from '@/types';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error || 'Only Super Administrators can initiate user impersonation.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, targetUserId, reason } = body;

    if (action === 'exit') {
      dataStore.addAuditLog({
        actor: auth.user.name,
        actorKapateId: auth.user.kapateId,
        actorName: auth.user.name,
        actorEmail: auth.user.email,
        actorRole: auth.user.role,
        action: 'IMPERSONATION_END',
        module: 'security',
        resource: 'Impersonation Engine',
        targetResource: 'impersonation/exit',
        targetLabel: 'Normal Session Restored',
        severity: 'info',
        details: 'Super Administrator exited impersonation session and restored original privileges.',
        reason: 'Super Admin exited impersonation session',
        result: 'SUCCESS',
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      });

      return NextResponse.json({
        success: true,
        message: 'Impersonation session terminated successfully.'
      });
    }

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: 'Target user ID is required.' }, { status: 400 });
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json({
        success: false,
        error: 'Mandatory Compliance Requirement: You must provide a valid business reason (min 5 chars) for impersonation.'
      }, { status: 400 });
    }

    const rawTarget = dataStore.getUserById(targetUserId) || dataStore.getUserByEmail(targetUserId);
    if (!rawTarget) {
      return NextResponse.json({ success: false, error: 'Target user not found.' }, { status: 404 });
    }

    const { passwordHash, ...targetUser } = rawTarget;

    if (targetUser.id === auth.user.userId) {
      return NextResponse.json({ success: false, error: 'Cannot impersonate your own active session.' }, { status: 400 });
    }

    // Generate impersonated token
    const impersonatedToken = signAuthToken({
      userId: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      designation: targetUser.designation,
      department: targetUser.department,
      kapateId: targetUser.kapateId,
    });

    dataStore.addAuditLog({
      actor: auth.user.name,
      actorKapateId: auth.user.kapateId,
      actorName: auth.user.name,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: 'IMPERSONATION_START',
      module: 'security',
      resource: 'Impersonation Engine',
      targetResource: `users/${targetUser.id}`,
      targetUser: targetUser.email,
      targetLabel: `${targetUser.name} (${targetUser.email} / ${targetUser.role})`,
      severity: 'warning',
      details: `Super Admin started impersonating ${targetUser.email} [${targetUser.role}]. Reason: "${reason.trim()}".`,
      reason: reason.trim(),
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    // Best-effort replication
    getDatabase()
      .then(async ({ db }) => {
        await db.collection('audit_logs').insertOne({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: auth.user.userId,
          actorName: auth.user.name,
          actorEmail: auth.user.email,
          actorRole: auth.user.role,
          action: 'IMPERSONATION_START',
          resource: 'Impersonation Engine',
          targetId: targetUser.id,
          targetLabel: `${targetUser.name} (${targetUser.email} / ${targetUser.role})`,
          severity: 'warning',
          details: `Super Admin started impersonating ${targetUser.email} [${targetUser.role}]. Reason: "${reason.trim()}".`,
          ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        });
      })
      .catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Impersonation active for ${targetUser.name} (${targetUser.role})`,
      data: {
        token: impersonatedToken,
        targetUser,
        originalUser: auth.user,
        reason: reason.trim(),
        startedAt: new Date().toISOString(),
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  return NextResponse.json({
    success: true,
    message: 'Impersonation session exited successfully.'
  });
}
