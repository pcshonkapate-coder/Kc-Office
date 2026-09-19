import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { PERMISSION_DEFINITIONS, DEFAULT_ROLE_PERMISSIONS } from '@/data/superAdminData';
import { UserRole } from '@/types';

let localRolePermissions: Record<UserRole, string[]> = { ...DEFAULT_ROLE_PERMISSIONS };

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { db } = await getDatabase();
    const doc = await db.collection('system_config').findOne({ _id: 'rbac_matrix' as any });
    if (doc && doc.permissions) {
      localRolePermissions = doc.permissions;
    }
  } catch {
    // Fallback
  }

  return NextResponse.json({
    success: true,
    data: {
      definitions: PERMISSION_DEFINITIONS,
      rolePermissions: localRolePermissions,
      roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'INTERN', 'CLIENT'] as UserRole[],
    }
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Only SUPER_ADMIN can modify the RBAC permission matrix.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { role, permissions, resetDefaults } = body;

    if (resetDefaults) {
      localRolePermissions = { ...DEFAULT_ROLE_PERMISSIONS };
      try {
        const { db } = await getDatabase();
        await db.collection('system_config').updateOne(
          { _id: 'rbac_matrix' as any },
          { $set: { permissions: localRolePermissions, updatedAt: new Date().toISOString() } },
          { upsert: true }
        );
        await db.collection('audit_logs').insertOne({
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: auth.user.userId,
          actorName: auth.user.name,
          actorEmail: auth.user.email,
          actorRole: auth.user.role,
          action: 'RBAC_RESET',
          resource: 'Role Permissions',
          targetLabel: 'All Roles',
          severity: 'warning',
          details: 'Reset RBAC role-permission matrix to corporate default definitions.',
          ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        });
      } catch {
        // Fallback
      }

      return NextResponse.json({
        success: true,
        message: 'RBAC permissions restored to factory defaults.',
        data: localRolePermissions
      });
    }

    if (!role || !Array.isArray(permissions)) {
      return NextResponse.json({ error: 'Valid role and permissions array are required.' }, { status: 400 });
    }

    // Protect SUPER_ADMIN from having core permissions deleted
    if (role === 'SUPER_ADMIN' && !permissions.includes('system.admin')) {
      permissions.push('system.admin');
    }

    localRolePermissions[role as UserRole] = permissions;

    try {
      const { db } = await getDatabase();
      await db.collection('system_config').updateOne(
        { _id: 'rbac_matrix' as any },
        { $set: { permissions: localRolePermissions, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
      await db.collection('audit_logs').insertOne({
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: auth.user.userId,
        actorName: auth.user.name,
        actorEmail: auth.user.email,
        actorRole: auth.user.role,
        action: 'RBAC_UPDATE',
        resource: 'Role Permissions',
        targetLabel: role,
        severity: 'info',
        details: `Updated permission assignment for role ${role} (${permissions.length} grants active).`,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      });
    } catch {
      // Fallback
    }

    return NextResponse.json({
      success: true,
      message: `Permissions for role ${role} updated successfully.`,
      data: localRolePermissions
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
