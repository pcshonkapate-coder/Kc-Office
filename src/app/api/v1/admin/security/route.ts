import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';
import { getDatabase } from '@/lib/mongodb';
import { SecuritySession } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const sessions = dataStore.getSessions();
  const users = dataStore.getUsers();
  const activeCount = sessions.filter(s => s.status === 'ACTIVE').length;
  const lockedUsersCount = users.filter(u => u.status === 'LOCKED').length;

  return NextResponse.json({
    success: true,
    data: {
      sessions,
      summary: {
        totalSessions: sessions.length,
        activeSessions: activeCount,
        lockedAccounts: lockedUsersCount,
        mfaEnforced: true,
        sessionTimeoutMins: 60,
        maxLoginAttempts: 5,
      }
    }
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { action, sessionId, userId } = body;

    if (action === 'revoke_session') {
      if (!sessionId) {
        return NextResponse.json({ success: false, error: 'Session ID is required.' }, { status: 400 });
      }

      dataStore.revokeSession(sessionId);

      dataStore.addAuditLog({
        actor: auth.user.name || auth.user.email,
        action: 'SESSION_REVOKED',
        module: 'security',
        targetResource: `sessions/${sessionId}`,
        targetUser: auth.user.email,
        result: 'SUCCESS',
        reason: 'Security session revoked manually by administrator.'
      });

      // Best-effort replication
      getDatabase()
        .then(async ({ db }) => {
          await db.collection('security_sessions').updateOne({ id: sessionId }, { $set: { status: 'REVOKED' } });
        })
        .catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'Security session revoked successfully.'
      });
    }

    if (action === 'force_logout_all') {
      if (!userId) {
        return NextResponse.json({ success: false, error: 'User ID is required.' }, { status: 400 });
      }

      dataStore.revokeAllUserSessions(userId);

      dataStore.addAuditLog({
        actor: auth.user.name || auth.user.email,
        action: 'FORCE_LOGOUT_ALL',
        module: 'security',
        targetResource: `users/${userId}/sessions`,
        targetUser: userId,
        result: 'SUCCESS',
        reason: `Terminated all active authentication sessions for user ID: ${userId}.`
      });

      // Best-effort replication
      getDatabase()
        .then(async ({ db }) => {
          await db.collection('security_sessions').updateMany({ userId }, { $set: { status: 'REVOKED' } });
        })
        .catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'All sessions for user terminated successfully.'
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid security action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
