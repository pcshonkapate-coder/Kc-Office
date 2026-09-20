import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, hashPassword } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';
import { User, UserRole } from '@/types';

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

  let users = dataStore.getUsers();

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

  // Sanitize password hashes before returning
  const sanitized = users.map(u => {
    const { passwordHash, ...safe } = u;
    return safe;
  });

  return NextResponse.json({
    success: true,
    data: sanitized,
    total: sanitized.length
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

    let standardizedEmail = email.trim().toLowerCase();
    if (!standardizedEmail.includes('@')) {
      standardizedEmail = `${standardizedEmail}@kapateconsultancy.in`;
    } else if (standardizedEmail.endsWith('@kapateconsultancy.com')) {
      standardizedEmail = standardizedEmail.replace('@kapateconsultancy.com', '@kapateconsultancy.in');
    }

    // Check duplication
    const exists = dataStore.getUserByEmail(standardizedEmail);
    if (exists) {
      return NextResponse.json({ error: `User with email ${standardizedEmail} already exists.` }, { status: 409 });
    }

    const hashedPassword = password ? hashPassword(password) : hashPassword('Kapate@2026!Secured');

    const newUser = dataStore.addUser({
      name: name.trim(),
      email: standardizedEmail,
      role: role as UserRole,
      department: department || 'Engineering',
      designation: designation || 'Associate Consultant',
      phone: phone || '+91 98765 43210',
      status: 'ACTIVE',
      mfaEnabled: true,
      passwordHash: hashedPassword,
    });

    dataStore.addAuditLog({
      actor: auth.user.name,
      actorKapateId: auth.user.kapateId,
      action: 'USER_CREATE',
      module: 'security',
      targetResource: `users/${newUser.id}`,
      targetUser: newUser.email,
      newValue: JSON.stringify({ name: newUser.name, role: newUser.role }),
      result: 'SUCCESS',
      reason: `Created enterprise user with role ${newUser.role}`
    });

    const { passwordHash: _, ...safeUser } = newUser;
    return NextResponse.json({
      success: true,
      message: `User ${newUser.name} created successfully.`,
      data: safeUser,
      credentials: {
        name: newUser.name,
        kapateId: newUser.kapateId,
        email: newUser.email,
        initialPassword: password || 'Kapate@2026!Secured',
        role: newUser.role,
        department: newUser.department,
        designation: newUser.designation
      }
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

    const targetUser = dataStore.getUserById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Protect Master Super Admin
    if (targetUser.email === 'admin@kapateconsultancy.in' || targetUser.email === 'shon@kapateconsultancy.in') {
      if (action === 'suspend' || action === 'lock' || status === 'SUSPENDED' || status === 'LOCKED') {
        return NextResponse.json({
          error: 'Critical Security Violation: The Master Super Admin account cannot be suspended or locked.'
        }, { status: 403 });
      }
    }

    const patch: Partial<User & { passwordHash?: string }> = {};
    let auditAction = 'USER_UPDATE';
    let auditDetails = `Updated user ${targetUser.email}`;

    if (action === 'reset_password') {
      const pwdToSet = newPassword || 'Kapate@Reset2026!';
      patch.passwordHash = hashPassword(pwdToSet);
      patch.failedLogins = 0;
      patch.lockedUntil = null;
      patch.status = 'ACTIVE';
      auditAction = 'PASSWORD_RESET';
      auditDetails = `Reset administrative credentials for ${targetUser.email}`;
    } else if (action === 'lock') {
      patch.status = 'LOCKED';
      patch.lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      auditAction = 'USER_LOCK';
      auditDetails = `Manually locked enterprise account for ${targetUser.email}`;
    } else if (action === 'unlock') {
      patch.status = 'ACTIVE';
      patch.failedLogins = 0;
      patch.lockedUntil = null;
      auditAction = 'USER_UNLOCK';
      auditDetails = `Unlocked enterprise account for ${targetUser.email}`;
    } else if (action === 'toggle_status') {
      patch.status = status || (targetUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
      auditAction = patch.status === 'ACTIVE' ? 'USER_ACTIVATE' : 'USER_SUSPEND';
      auditDetails = `Changed account status to ${patch.status} for ${targetUser.email}`;
    } else if (updates) {
      Object.assign(patch, updates);
      auditAction = 'USER_EDIT';
      auditDetails = `Modified profile fields for ${targetUser.email}`;
    }

    const updated = dataStore.updateUser(userId, patch);

    dataStore.addAuditLog({
      actor: auth.user.name,
      actorKapateId: auth.user.kapateId,
      action: auditAction,
      module: 'security',
      targetResource: `users/${userId}`,
      targetUser: targetUser.email,
      result: 'SUCCESS',
      reason: auditDetails
    });

    const { passwordHash: _, ...safeUser } = updated || targetUser;
    return NextResponse.json({
      success: true,
      message: `User ${targetUser.name} updated successfully.`,
      data: safeUser
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
  const targetId = searchParams.get('id');

  if (!targetId) {
    return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
  }

  const targetUser = dataStore.getUserById(targetId);
  if (!targetUser) {
    return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
  }

  if (targetUser.email === 'admin@kapateconsultancy.in' || targetUser.email === 'shon@kapateconsultancy.in') {
    return NextResponse.json({
      error: 'CRITICAL: Root Master Administrator account cannot be deleted.'
    }, { status: 403 });
  }

  dataStore.updateUser(targetId, { status: 'SUSPENDED' });

  dataStore.addAuditLog({
    actor: auth.user.name,
    actorKapateId: auth.user.kapateId,
    action: 'USER_DELETED',
    module: 'security',
    targetResource: `users/${targetId}`,
    targetUser: targetUser.email,
    result: 'SUCCESS',
    reason: 'Super Admin deactivated enterprise user account'
  });

  return NextResponse.json({
    success: true,
    message: `User ${targetUser.name} deactivated successfully.`
  });
}
