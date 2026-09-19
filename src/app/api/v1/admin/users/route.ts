import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, hashPassword } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { INITIAL_ENTERPRISE_USERS } from '@/data/superAdminData';
import { User, UserRole } from '@/types';

// In-memory cache fallback for when cloud database is in local isolated mode
let localUsersCache: User[] = [...INITIAL_ENTERPRISE_USERS];

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get('search') || '').toLowerCase().trim();
  const role = searchParams.get('role');
  const status = searchParams.get('status');
  const department = searchParams.get('department');

  let users = [...localUsersCache];

  try {
    const { db } = await getDatabase();
    const dbUsers = await db.collection<User>('users').find({}).toArray();
    if (dbUsers && dbUsers.length > 0) {
      users = dbUsers;
      localUsersCache = [...dbUsers];
    }
  } catch {
    // Database connection fallback
  }

  if (search) {
    users = users.filter(u =>
      u.name.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search) ||
      (u.kapateId && u.kapateId.toLowerCase().includes(search)) ||
      (u.designation && u.designation.toLowerCase().includes(search))
    );
  }

  if (role && role !== 'ALL') {
    users = users.filter(u => u.role === role);
  }

  if (status && status !== 'ALL') {
    users = users.filter(u => u.status === status);
  }

  if (department && department !== 'ALL') {
    users = users.filter(u => u.department === department);
  }

  return NextResponse.json({
    success: true,
    data: users,
    total: users.length
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { name, email, role, department, designation, phone, password } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Name, email, and role are required fields.' }, { status: 400 });
    }

    // Standardize email to @kapateconsultancy.in if not supplied with domain
    let standardizedEmail = email.trim().toLowerCase();
    if (!standardizedEmail.includes('@')) {
      standardizedEmail = `${standardizedEmail}@kapateconsultancy.in`;
    } else if (standardizedEmail.endsWith('@kapateconsultancy.com')) {
      standardizedEmail = standardizedEmail.replace('@kapateconsultancy.com', '@kapateconsultancy.in');
    }

    // Check duplication
    const exists = localUsersCache.some(u => u.email.toLowerCase() === standardizedEmail);
    if (exists) {
      return NextResponse.json({ error: `User with email ${standardizedEmail} already exists.` }, { status: 409 });
    }

    const prefix = role === 'INTERN' ? 'KAP-INT' : role === 'CLIENT' ? 'KAP-CLI' : 'KAP-EMP';
    const kapateId = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
    const hashedPassword = password ? hashPassword(password) : hashPassword('Kapate@2026!Secured');

    const newUser: User = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      email: standardizedEmail,
      role: role as UserRole,
      department: department || 'Engineering',
      designation: designation || 'Associate Consultant',
      phone: phone || '+91 98765 43210',
      kapateId,
      status: 'ACTIVE',
      mfaEnabled: true,
      lastLoginAt: 'Never',
      passwordHash: hashedPassword,
      failedLogins: 0,
      lockedUntil: null,
      created: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customPermissions: ['crm.view', 'projects.view', 'tasks.view', 'mail.view'],
    };

    localUsersCache.unshift(newUser);

    try {
      const { db } = await getDatabase();
      await db.collection('users').insertOne(newUser as any);
      // Log audit
      await db.collection('audit_logs').insertOne({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: auth.user.userId,
        actorName: auth.user.name,
        actorEmail: auth.user.email,
        actorRole: auth.user.role,
        action: 'USER_CREATE',
        resource: 'User Management',
        targetId: newUser.id,
        targetLabel: `${newUser.name} (${newUser.email})`,
        severity: 'info',
        details: `Created enterprise user with role ${newUser.role} and ID ${newUser.kapateId}.`,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      });
    } catch {
      // Fallback in-memory
    }

    return NextResponse.json({
      success: true,
      message: `User ${newUser.name} created successfully.`,
      data: newUser
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { userId, action, updates, newPassword, status } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Target userId is required' }, { status: 400 });
    }

    const targetUserIdx = localUsersCache.findIndex(u => u.id === userId);
    const targetUser = targetUserIdx !== -1 ? localUsersCache[targetUserIdx] : null;

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Protect Master Super Admin
    if (targetUser.email === 'admin@kapateconsultancy.in') {
      if (action === 'suspend' || action === 'lock' || status === 'SUSPENDED' || status === 'LOCKED') {
        return NextResponse.json({
          error: 'Critical Security Violation: The Master Super Admin account cannot be suspended or locked.'
        }, { status: 403 });
      }
    }

    let auditAction = 'USER_UPDATE';
    let auditDetails = `Updated user ${targetUser.email}`;

    if (action === 'reset_password') {
      const pwdToSet = newPassword || 'Kapate@Reset2026!';
      targetUser.passwordHash = hashPassword(pwdToSet);
      targetUser.failedLogins = 0;
      targetUser.lockedUntil = null;
      targetUser.status = 'ACTIVE';
      auditAction = 'PASSWORD_RESET';
      auditDetails = `Reset administrative credentials for ${targetUser.email}`;
    } else if (action === 'lock') {
      targetUser.status = 'LOCKED';
      targetUser.lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      auditAction = 'USER_LOCK';
      auditDetails = `Manually locked enterprise account for ${targetUser.email}`;
    } else if (action === 'unlock') {
      targetUser.status = 'ACTIVE';
      targetUser.failedLogins = 0;
      targetUser.lockedUntil = null;
      auditAction = 'USER_UNLOCK';
      auditDetails = `Unlocked enterprise account for ${targetUser.email}`;
    } else if (action === 'toggle_status') {
      targetUser.status = status || (targetUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
      auditAction = targetUser.status === 'ACTIVE' ? 'USER_ACTIVATE' : 'USER_SUSPEND';
      auditDetails = `Changed account status to ${targetUser.status} for ${targetUser.email}`;
    } else if (updates) {
      Object.assign(targetUser, updates);
      targetUser.updatedAt = new Date().toISOString();
      auditAction = 'USER_EDIT';
      auditDetails = `Modified profile fields for ${targetUser.email}`;
    }

    localUsersCache[targetUserIdx] = { ...targetUser };

    try {
      const { db } = await getDatabase();
      await db.collection('users').updateOne({ id: userId }, { $set: localUsersCache[targetUserIdx] });
      await db.collection('audit_logs').insertOne({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: auth.user.userId,
        actorName: auth.user.name,
        actorEmail: auth.user.email,
        actorRole: auth.user.role,
        action: auditAction,
        resource: 'User Management',
        targetId: targetUser.id,
        targetLabel: `${targetUser.name} (${targetUser.email})`,
        severity: auditAction === 'USER_LOCK' || auditAction === 'USER_SUSPEND' ? 'warning' : 'info',
        details: auditDetails,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      });
    } catch {
      // Fallback
    }

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.name} updated successfully.`,
      data: targetUser
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const targetUser = localUsersCache.find(u => u.id === userId);
  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Master Super Admin account cannot be deleted
  if (targetUser.email === 'admin@kapateconsultancy.in' || targetUser.email === 'shon@kapateconsultancy.in') {
    return NextResponse.json({
      error: 'Security Policy: Primary Super Admin accounts are immutable and cannot be deleted.'
    }, { status: 403 });
  }

  localUsersCache = localUsersCache.filter(u => u.id !== userId);

  try {
    const { db } = await getDatabase();
    await db.collection('users').deleteOne({ id: userId });
    await db.collection('audit_logs').insertOne({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: auth.user.userId,
      actorName: auth.user.name,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: 'USER_DELETE',
      resource: 'User Management',
      targetId: targetUser.id,
      targetLabel: `${targetUser.name} (${targetUser.email})`,
      severity: 'warning',
      details: `Permanently deleted user account ${targetUser.email} (${targetUser.kapateId}).`,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });
  } catch {
    // Fallback
  }

  return NextResponse.json({
    success: true,
    message: `User ${targetUser.name} deleted successfully.`
  });
}
