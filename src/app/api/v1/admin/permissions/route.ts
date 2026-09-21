import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';
import { getDatabase } from '@/lib/mongodb';
import { PERMISSION_DEFINITIONS } from '@/data/superAdminData';
import { UserRole } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const rolePermissions = dataStore.getRolePermissions();

  return NextResponse.json({
    success: true,
    data: {
      definitions: PERMISSION_DEFINITIONS,
      rolePermissions,
      roles: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'INTERN', 'CLIENT'] as UserRole[],
    }
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error || 'Only SUPER_ADMIN can modify the RBAC permission matrix.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { role, permissions, resetDefaults } = body;

    if (resetDefaults) {
      const resetMatrix = dataStore.resetRolePermissions();

      dataStore.addAuditLog({
        actor: auth.user.name,
        actorKapateId: auth.user.kapateId,
        actorName: auth.user.name,
        actorEmail: auth.user.email,
        actorRole: auth.user.role,
        action: 'RBAC_RESET',
        module: 'security',
        resource: 'Role Permissions',
        targetResource: 'rbac/all',
        targetLabel: 'All Roles',
        severity: 'warning',
        details: 'Reset RBAC role-permission matrix to corporate default definitions.',
        reason: 'Super Admin reset RBAC matrix',
        result: 'SUCCESS',
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      });

      // Best effort MongoDB replication
      getDatabase()
        .then(async ({ db }) => {
          await db.collection('system_config').updateOne(
            { _id: 'rbac_matrix' as any },
            { $set: { permissions: resetMatrix, updatedAt: new Date().toISOString() } },
            { upsert: true }
          );
        })
        .catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'RBAC permissions restored to factory defaults.',
        data: resetMatrix
      });
    }

    if (!role || !Array.isArray(permissions)) {
      return NextResponse.json({ success: false, error: 'Valid role and permissions array are required.' }, { status: 400 });
    }

    // Protect SUPER_ADMIN from having core permissions deleted
    const sanitizedPermissions = [...permissions];
    if (role === 'SUPER_ADMIN' && !sanitizedPermissions.includes('system.admin')) {
      sanitizedPermissions.push('system.admin');
    }

    const updatedMatrix = dataStore.updateRolePermissions(role as UserRole, sanitizedPermissions);

    dataStore.addAuditLog({
      actor: auth.user.name,
      actorKapateId: auth.user.kapateId,
      actorName: auth.user.name,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: 'RBAC_UPDATE',
      module: 'security',
      resource: 'Role Permissions',
      targetResource: `rbac/${role}`,
      targetLabel: role,
      severity: 'info',
      details: `Updated permission assignment for role ${role} (${sanitizedPermissions.length} grants active).`,
      reason: `Updated permissions for role ${role}`,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    // Best effort MongoDB replication
    getDatabase()
      .then(async ({ db }) => {
        await db.collection('system_config').updateOne(
          { _id: 'rbac_matrix' as any },
          { $set: { permissions: updatedMatrix, updatedAt: new Date().toISOString() } },
          { upsert: true }
        );
      })
      .catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Permissions for role ${role} updated successfully.`,
      data: updatedMatrix
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
