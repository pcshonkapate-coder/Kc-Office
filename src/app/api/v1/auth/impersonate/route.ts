import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, signAuthToken } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';

export async function POST(req: NextRequest) {
  // Only Super Admin can impersonate
  const auth = await requireAuth(req, ['SUPER_ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { targetUserId, reason } = body;

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: 'targetUserId is required' }, { status: 400 });
    }

    const users = dataStore.getUsers();
    const target = users.find(u => u.id === targetUserId || u.email.toLowerCase() === targetUserId.toLowerCase() || u.kapateId === targetUserId);

    if (!target) {
      return NextResponse.json({ success: false, error: 'Target user not found' }, { status: 404 });
    }

    // Generate impersonation token
    const token = signAuthToken({
      userId: target.id,
      email: target.email,
      name: target.name,
      role: target.role,
      designation: target.designation,
      department: target.department,
      kapateId: target.kapateId
    });

    dataStore.addAuditLog({
      actor: auth.user.name,
      actorKapateId: auth.user.kapateId || 'KAP-EMP-000001',
      action: 'IMPERSONATION_STARTED',
      module: 'security',
      targetResource: `users/${target.id}`,
      targetUser: target.email,
      newValue: `Impersonated as ${target.name} (${target.role})`,
      result: 'SUCCESS',
      reason: reason || 'Super Admin operational audit & diagnosis'
    });

    return NextResponse.json({
      success: true,
      token,
      targetUser: {
        id: target.id,
        name: target.name,
        email: target.email,
        role: target.role,
        kapateId: target.kapateId,
        department: target.department
      },
      actualUser: auth.user
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  dataStore.addAuditLog({
    actor: auth.user.name,
    actorKapateId: auth.user.kapateId || 'KAP-EMP-000001',
    action: 'IMPERSONATION_ENDED',
    module: 'security',
    targetResource: `users/${auth.user.userId}`,
    targetUser: auth.user.email,
    result: 'SUCCESS',
    reason: 'Super Admin terminated impersonation session'
  });

  return NextResponse.json({
    success: true,
    message: 'Impersonation session terminated. Privilege restored.'
  });
}
