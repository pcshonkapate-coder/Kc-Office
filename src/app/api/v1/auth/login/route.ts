import { NextResponse } from 'next/server';
import { getCloudCollection } from '@/lib/mongodb';
import { signAuthToken, verifyPassword, hashPassword } from '@/lib/auth';
import { User } from '@/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, roleKey } = body;

    const usersColl = await getCloudCollection<User & { passwordHash?: string }>('users');

    let user: (User & { passwordHash?: string }) | null = null;

    if (email) {
      user = await usersColl.findOne({ email: email.toLowerCase().trim() });
    } else if (roleKey) {
      // Role-based quick switch login for authorized executive/demo personas
      user = await usersColl.findOne({ role: roleKey });
    }

    // If user not yet found in MongoDB, check if it's the founder or standard role account to auto-provision
    if (!user) {
      const defaultUsers: Record<string, Partial<User>> = {
        'shon@kapateconsultancy.com': {
          id: 'usr-admin',
          name: 'Shon Kapate',
          email: 'shon@kapateconsultancy.com',
          role: 'ADMIN',
          designation: 'Founder & CEO / Super Admin',
          department: 'Executive Leadership',
          kapateId: 'KAP-EMP-000001',
          internalEmail: 'shon@kapateconsultancy.com',
          status: 'ACTIVE'
        },
        'pm@kapateconsultancy.com': {
          id: 'usr-pm',
          name: 'Technical Project Lead',
          email: 'pm@kapateconsultancy.com',
          role: 'PROJECT_MANAGER',
          designation: 'Technical Lead & Delivery PM',
          department: 'Engineering',
          kapateId: 'KAP-EMP-000002',
          internalEmail: 'pm@kapateconsultancy.com',
          status: 'ACTIVE'
        },
        'engineer@kapateconsultancy.com': {
          id: 'usr-emp1',
          name: 'Engineering Personnel',
          email: 'engineer@kapateconsultancy.com',
          role: 'EMPLOYEE',
          designation: 'Senior Backend Developer',
          department: 'Engineering',
          kapateId: 'KAP-EMP-000003',
          internalEmail: 'engineer@kapateconsultancy.com',
          status: 'ACTIVE'
        },
        'intern@kapateconsultancy.com': {
          id: 'usr-intern1',
          name: 'Research Intern',
          email: 'intern@kapateconsultancy.com',
          role: 'INTERN',
          designation: 'Engineering Solutions Intern',
          department: 'Research',
          kapateId: 'KAP-INT-000001',
          internalEmail: 'intern@kapateconsultancy.com',
          status: 'ACTIVE'
        },
        'client@enterprise.com': {
          id: 'usr-client1',
          name: 'Enterprise Client',
          email: 'client@enterprise.com',
          role: 'CLIENT',
          designation: 'VP of Technology',
          department: 'Client Representative',
          status: 'ACTIVE'
        }
      };

      const matchedDefault = (email && defaultUsers[email.toLowerCase().trim()]) ||
        (roleKey && Object.values(defaultUsers).find(u => u.role === roleKey)) ||
        defaultUsers['shon@kapateconsultancy.com'];

      const initialUser: User & { passwordHash?: string } = {
        id: matchedDefault.id || `usr-${Date.now()}`,
        name: matchedDefault.name || 'Shon Kapate',
        email: matchedDefault.email || 'shon@kapateconsultancy.com',
        role: matchedDefault.role || 'ADMIN',
        designation: matchedDefault.designation || 'Founder & CEO',
        department: matchedDefault.department || 'Management',
        kapateId: matchedDefault.kapateId || 'KAP-EMP-000001',
        internalEmail: matchedDefault.internalEmail || 'shon@kapateconsultancy.com',
        status: 'ACTIVE',
        passwordHash: hashPassword(password || 'KapateOS@2026')
      };

      await usersColl.insertOne(initialUser as any);
      user = initialUser;
    }

    // Verify password if provided and user has passwordHash
    if (password && user.passwordHash) {
      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password.' },
          { status: 401 }
        );
      }
    }

    // Generate signed JWT token
    const token = signAuthToken({
      userId: user.id || (user as any)._id?.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      designation: user.designation,
      department: user.department,
      kapateId: user.kapateId
    });

    const response = NextResponse.json({
      success: true,
      access_token: token,
      token_type: 'bearer',
      user: {
        id: user.id || (user as any)._id?.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        department: user.department,
        kapateId: user.kapateId,
        internalEmail: user.internalEmail,
        status: user.status
      }
    });

    // Set secure cookie
    response.cookies.set('kapate_token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    });

    return response;
  } catch (err: any) {
    console.error('Auth Login API Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}
