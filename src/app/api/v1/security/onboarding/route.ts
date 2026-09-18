import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { RegistrationRequest, OnboardingInvitation, SecurityEvent } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { db } = await getDatabase();
  const requests = await db.collection<RegistrationRequest>('registration_requests').find({}).sort({ created: -1 }).toArray();
  const invitations = await db.collection<OnboardingInvitation>('onboarding_invitations').find({}).sort({ created: -1 }).toArray();
  const securityLogs = await db.collection<SecurityEvent>('security_logs').find({}).sort({ timestamp: -1 }).limit(100).toArray();

  return NextResponse.json({
    data: {
      requests,
      invitations,
      securityLogs,
    }
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;
  const { db } = await getDatabase();

  // Public submission of registration request
  if (action === 'submit_request') {
    const { fullName, email, phone, notes, requestedType = 'EMPLOYEE' } = body;
    const newReq: RegistrationRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      fullName,
      email,
      phone,
      applicationId: `APP-${Date.now().toString().slice(-6)}`,
      requestedType: requestedType as 'EMPLOYEE' | 'INTERN' | 'FREELANCER',
      status: 'PENDING',
      notes,
      created: new Date().toISOString().split('T')[0],
    };

    await db.collection<RegistrationRequest>('registration_requests').insertOne(newReq as any);
    
    // Log security event
    await db.collection<SecurityEvent>('security_logs').insertOne({
      id: `sec-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: 'REGISTRATION_REQUESTED',
      severity: 'info',
      actor: email,
      target: fullName,
      details: `New registration request queued for ${fullName} (${email}).`,
    } as any);

    return NextResponse.json({ data: newReq }, { status: 201 });
  }

  // Admin approval & invitation creation
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (action === 'create_invitation') {
    const { email, fullName, role, department, manager, designation, employmentType = 'EMPLOYEE' } = body;
    const token = `kc-tok-${Math.random().toString(36).substr(2, 9)}-${Date.now().toString(36)}`;
    const prefix = employmentType === 'INTERN' ? 'KC-INT' : employmentType === 'FREELANCER' ? 'KC-FRL' : 'KC-EMP';
    const kapateId = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
    const internalEmail = `${fullName.toLowerCase().replace(/\s+/g, '.')}@kapate.internal`;

    const newInv: OnboardingInvitation = {
      id: `inv-${Date.now()}`,
      token,
      email,
      fullName,
      assignedRole: role || 'EMPLOYEE',
      department: department || 'Engineering',
      manager: manager || 'Executive Lead',
      designation: designation || 'Software Consultant',
      employmentType: employmentType as 'EMPLOYEE' | 'INTERN' | 'FREELANCER',
      kapateId,
      internalEmail,
      created: new Date().toISOString().split('T')[0],
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      isUsed: false,
      isRevoked: false,
    };

    await db.collection<OnboardingInvitation>('onboarding_invitations').insertOne(newInv as any);

    if (body.requestId) {
      await db.collection('registration_requests').updateOne(
        { id: body.requestId },
        { $set: { status: 'APPROVED', reviewedAt: new Date().toISOString().split('T')[0], reviewedBy: auth.user.name } }
      );
    }

    return NextResponse.json({ data: newInv }, { status: 201 });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
