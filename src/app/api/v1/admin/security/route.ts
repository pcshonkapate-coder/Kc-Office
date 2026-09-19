import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { INITIAL_SESSIONS, INITIAL_ENTERPRISE_USERS } from '@/data/superAdminData';
import { SecuritySession } from '@/types';

let localSessionsCache: SecuritySession[] = [...INITIAL_SESSIONS];

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let sessions = [...localSessionsCache];

  try {
    const { db } = await getDatabase();
    const dbSessions = await db.collection<SecuritySession>('security_sessions').find({}).toArray();
    if (dbSessions && dbSessions.length > 0) {
      sessions = dbSessions;
      localSessionsCache = [...dbSessions];
    }
  } catch {
    // Fallback
  }

  const activeCount = sessions.filter(s => s.status === 'ACTIVE').length;
  const lockedUsersCount = INITIAL_ENTERPRISE_USERS.filter(u => u.status === 'LOCKED').length;

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
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { action, sessionId, userId } = body;

    if (action === 'revoke_session') {
      if (!sessionId) {
        return NextResponse.json({ error: 'Session ID is required.' }, { status: 400 });
      }

      const session = localSessionsCache.find(s => s.id === sessionId);
      if (session) {
        session.status = 'REVOKED';
      }

      try {
        const { db } = await getDatabase();
        await db.collection('security_sessions').updateOne({ id: sessionId }, { $set: { status: 'REVOKED' } });
        await db.collection('audit_logs').insertOne({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: auth.user.userId,
          actorName: auth.user.name,
          actorEmail: auth.user.email,
          actorRole: auth.user.role,
          action: 'SESSION_REVOKED',
          resource: 'Security Center',
          targetId: sessionId,
          targetLabel: session ? `${session.userName} (${session.ipAddress})` : sessionId,
          severity: 'warning',
          details: `Security session revoked manually by admin.`,
          ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        });
      } catch {
        // Fallback
      }

      return NextResponse.json({
        success: true,
        message: 'Security session revoked successfully.'
      });
    }

    if (action === 'force_logout_all') {
      if (!userId) {
        return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
      }

      localSessionsCache.forEach(s => {
        if (s.userId === userId) {
          s.status = 'REVOKED';
        }
      });

      try {
        const { db } = await getDatabase();
        await db.collection('security_sessions').updateMany({ userId }, { $set: { status: 'REVOKED' } });
        await db.collection('audit_logs').insertOne({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: auth.user.userId,
          actorName: auth.user.name,
          actorEmail: auth.user.email,
          actorRole: auth.user.role,
          action: 'FORCE_LOGOUT_ALL',
          resource: 'Security Center',
          targetId: userId,
          severity: 'warning',
          details: `Terminated all active authentication sessions for user ID: ${userId}.`,
          ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        });
      } catch {
        // Fallback
      }

      return NextResponse.json({
        success: true,
        message: 'All sessions for user terminated successfully.'
      });
    }

    return NextResponse.json({ error: 'Invalid security action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
