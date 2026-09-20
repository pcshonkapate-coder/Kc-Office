import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAuth, hashPassword } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';
import { RegistrationRequest, OnboardingInvitation, SecurityEvent, UserRole } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  // Public endpoint to verify onboarding invite tokens (used by /invite?token=...)
  if (token) {
    let invitation = dataStore.getInvitationByToken(token);
    if (!invitation) {
      try {
        const { db } = await getDatabase();
        if (db) {
          invitation = await db.collection<OnboardingInvitation>('onboarding_invitations').findOne({ token }) as any;
          if (invitation) {
            dataStore.addInvitation(invitation);
          }
        }
      } catch {}
    }

    if (!invitation) {
      return NextResponse.json({ success: false, error: 'Invalid or expired invitation token.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, invitation });
  }

  // Admin query for all requests, invitations, and security logs
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const requests = dataStore.getRegistrationRequests();
    const invitations = dataStore.getOnboardingInvitations();
    const auditLogs = dataStore.getAuditLogs(100);

    const securityLogs: SecurityEvent[] = auditLogs.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      action: log.action,
      severity: log.result === 'FAILURE' ? 'alert' : 'info',
      actor: log.actor,
      target: log.targetUser || log.targetResource || 'System',
      details: log.reason || `${log.action} on ${log.targetResource}`
    }));

    return NextResponse.json({
      success: true,
      data: {
        requests,
        invitations,
        securityLogs,
      }
    });
  } catch (err: any) {
    console.warn('[Onboarding API GET Notice]:', err.message);
    return NextResponse.json({
      success: true,
      data: {
        requests: dataStore.getRegistrationRequests(),
        invitations: dataStore.getOnboardingInvitations(),
        securityLogs: [],
      }
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. PUBLIC SUBMISSION OF REGISTRATION REQUEST (from /register)
    if (action === 'submit_request') {
      const { fullName, email, phone, notes, password, requestedType = 'EMPLOYEE' } = body;
      
      if (!fullName || !email) {
        return NextResponse.json({ success: false, error: 'Full name and email are required.' }, { status: 400 });
      }

      const cleanEmail = email.toLowerCase().trim();
      const nextSeq = dataStore.getRegistrationRequests().length + 1;
      const appId = body.applicationId || `APP-2026-${String(100 + nextSeq)}`;

      const newReq: RegistrationRequest = {
        id: `REQ-${String(nextSeq).padStart(3, '0')}-${Date.now().toString(36).slice(-4)}`,
        fullName: fullName.trim(),
        email: cleanEmail,
        phone: phone || '',
        applicationId: appId,
        requestedType: requestedType as 'EMPLOYEE' | 'INTERN' | 'FREELANCER',
        status: 'PENDING',
        notes: notes || 'Applicant registration submitted via portal.',
        created: new Date().toISOString().split('T')[0],
        passwordHash: password ? hashPassword(password) : undefined
      };

      // Persist in durable dataStore
      dataStore.addRegistrationRequest(newReq);

      dataStore.addAuditLog({
        actor: fullName.trim(),
        action: 'REGISTRATION_REQUEST_CREATED',
        module: 'security',
        targetResource: `requests/${newReq.id}`,
        targetUser: cleanEmail,
        result: 'SUCCESS',
        reason: `New registration request queued for ${fullName} (${cleanEmail}). Status: PENDING.`
      });

      // Background cloud sync
      getDatabase().then(async ({ db }) => {
        if (db) {
          await db.collection('registration_requests').updateOne(
            { id: newReq.id },
            { $set: newReq },
            { upsert: true }
          );
        }
      }).catch(() => {});

      return NextResponse.json({ success: true, data: newReq }, { status: 201 });
    }

    // 2. PUBLIC INVITATION ACCEPTANCE (from /invite)
    if (action === 'accept_invitation') {
      const { token, password } = body;
      if (!token || !password) {
        return NextResponse.json({ success: false, error: 'Token and password are required.' }, { status: 400 });
      }

      const inv = dataStore.getInvitationByToken(token);
      if (!inv) {
        return NextResponse.json({ success: false, error: 'Invalid or expired invitation token.' }, { status: 404 });
      }
      if (inv.isUsed) {
        return NextResponse.json({ success: false, error: 'This invitation has already been accepted and activated.' }, { status: 400 });
      }
      if (inv.isRevoked) {
        return NextResponse.json({ success: false, error: 'This invitation has been revoked by Kapate administration.' }, { status: 403 });
      }

      // Create & activate user in persistent store
      const user = dataStore.addUser({
        name: inv.fullName,
        email: inv.email,
        internalEmail: inv.internalEmail,
        kapateId: inv.kapateId,
        role: inv.assignedRole,
        designation: inv.designation,
        department: inv.department,
        manager: inv.manager,
        status: 'ACTIVE',
        passwordHash: hashPassword(password)
      });

      // Mark invitation used
      dataStore.updateInvitation(token, { isUsed: true });

      dataStore.addAuditLog({
        actor: inv.fullName,
        actorKapateId: inv.kapateId,
        action: 'INVITATION_ACCEPTED',
        module: 'security',
        targetResource: `invitations/${inv.id}`,
        targetUser: inv.email,
        result: 'SUCCESS',
        reason: `Invitation accepted and credentials established. User account activated.`
      });

      const { passwordHash: _, ...safeUser } = user;
      return NextResponse.json({
        success: true,
        message: 'Account successfully activated! You can now log in.',
        user: safeUser
      });
    }

    // -------------------------------------------------------------
    // ADMIN ONLY ACTIONS BELOW
    // -------------------------------------------------------------
    const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
    if (!auth.authenticated || !auth.user) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // 3. ADMIN APPROVE & PROVISION (Directly provisions user account with login credentials)
    if (action === 'approve_and_provision') {
      const { requestId, role, department, manager, designation, employmentType = 'EMPLOYEE', temporaryPassword } = body;
      const reqRecord = dataStore.getRegistrationRequestById(requestId);
      if (!reqRecord) {
        return NextResponse.json({ success: false, error: 'Registration request not found.' }, { status: 404 });
      }

      const isIntern = employmentType === 'INTERN' || role === 'INTERN';
      const prefix = isIntern ? 'INT' : employmentType === 'FREELANCER' ? 'FRL' : 'EMP';
      const kapateId = dataStore.generateNextKapateId(prefix);
      
      const cleanName = reqRecord.fullName.trim();
      const baseName = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.');
      const internalEmail = `${baseName}@kapateconsultancy.in`;

      // Use applicant's pre-set passwordHash from registration, or custom password from admin, or default
      const assignedPassword = temporaryPassword || (reqRecord.passwordHash ? undefined : 'KapateOS@2026');
      const passwordHash = assignedPassword ? hashPassword(assignedPassword) : reqRecord.passwordHash;

      // Provision user account
      const newUser = dataStore.addUser({
        name: cleanName,
        email: reqRecord.email,
        internalEmail,
        kapateId,
        role: (role || 'EMPLOYEE') as UserRole,
        department: department || 'Engineering',
        designation: designation || (isIntern ? 'Research Intern' : 'Software Engineer'),
        manager: manager || auth.user.name || 'Shon Kapate',
        phone: reqRecord.phone || '+91 98230 00000',
        status: 'ACTIVE',
        passwordHash
      });

      // Update registration request status
      dataStore.updateRegistrationRequest(requestId, {
        status: 'APPROVED',
        reviewedAt: new Date().toISOString().split('T')[0],
        reviewedBy: auth.user.name
      });

      dataStore.addAuditLog({
        actor: auth.user.name,
        actorKapateId: auth.user.kapateId,
        action: 'REGISTRATION_APPROVED_AND_PROVISIONED',
        module: 'security',
        targetResource: `requests/${requestId}`,
        targetUser: reqRecord.email,
        result: 'SUCCESS',
        reason: `Admin approved registration and provisioned credentials for ${cleanName} (${kapateId}).`
      });

      const { passwordHash: _, ...safeUser } = newUser;
      return NextResponse.json({
        success: true,
        message: `Account approved and provisioned for ${cleanName}.`,
        data: safeUser,
        credentials: {
          name: cleanName,
          kapateId,
          email: internalEmail,
          personalEmail: reqRecord.email,
          initialPassword: assignedPassword || '(User-defined at registration)',
          role: newUser.role,
          department: newUser.department
        }
      }, { status: 201 });
    }

    // 4. ADMIN CREATE INVITATION TOKEN
    if (action === 'create_invitation') {
      const { email, fullName, role, department, manager, designation, employmentType = 'EMPLOYEE' } = body;
      const token = `inv_tok_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`;
      const prefix = employmentType === 'INTERN' ? 'INT' : employmentType === 'FREELANCER' ? 'FRL' : 'EMP';
      const kapateId = dataStore.generateNextKapateId(prefix);
      const internalEmail = `${fullName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@kapateconsultancy.in`;

      const newInv: OnboardingInvitation = {
        id: `INV-${Date.now().toString().slice(-4)}`,
        token,
        email: (email || '').toLowerCase().trim(),
        fullName: fullName.trim(),
        assignedRole: (role || 'EMPLOYEE') as UserRole,
        department: department || 'Engineering',
        manager: manager || 'Shon Kapate',
        designation: designation || 'Software Consultant',
        employmentType: employmentType as 'EMPLOYEE' | 'INTERN' | 'FREELANCER',
        kapateId,
        internalEmail,
        created: new Date().toISOString().split('T')[0],
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        isUsed: false,
        isRevoked: false,
      };

      dataStore.addInvitation(newInv);

      if (body.requestId) {
        dataStore.updateRegistrationRequest(body.requestId, {
          status: 'APPROVED',
          reviewedAt: new Date().toISOString().split('T')[0],
          reviewedBy: auth.user.name
        });
      }

      dataStore.addAuditLog({
        actor: auth.user.name,
        actorKapateId: auth.user.kapateId,
        action: 'ONBOARDING_INVITATION_CREATED',
        module: 'security',
        targetResource: `invitations/${newInv.id}`,
        targetUser: newInv.email,
        result: 'SUCCESS',
        reason: `Created onboarding token for ${newInv.fullName} (${newInv.kapateId})`
      });

      return NextResponse.json({ success: true, data: newInv }, { status: 201 });
    }

    // 5. ADMIN REJECT REQUEST
    if (action === 'reject_request') {
      const { requestId, reason } = body;
      if (!requestId) {
        return NextResponse.json({ success: false, error: 'Request ID is required' }, { status: 400 });
      }

      const updated = dataStore.updateRegistrationRequest(requestId, {
        status: 'REJECTED',
        rejectionReason: reason || 'Requirements not met',
        reviewedAt: new Date().toISOString().split('T')[0],
        reviewedBy: auth.user.name
      });

      if (!updated) {
        return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
      }

      dataStore.addAuditLog({
        actor: auth.user.name,
        actorKapateId: auth.user.kapateId,
        action: 'REGISTRATION_REJECTED',
        module: 'security',
        targetResource: `requests/${requestId}`,
        targetUser: updated.email,
        result: 'SUCCESS',
        reason: `Admin rejected application. Reason: ${reason || 'N/A'}`
      });

      return NextResponse.json({ success: true, message: 'Request rejected successfully.', data: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
