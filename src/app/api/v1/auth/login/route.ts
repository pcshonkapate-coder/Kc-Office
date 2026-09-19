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

    // If user not yet found in MongoDB, check if it's the admin, founder or standard role account to auto-provision
    if (!user) {
      const defaultUsers: Record<string, Partial<User>> = {
        'admin@kapateconsultancy.in': {
          id: 'usr-admin',
          name: 'Shon Kapate',
          email: 'admin@kapateconsultancy.in',
          role: 'ADMIN',
          designation: 'Founder & CEO / Super Admin',
          department: 'Executive Leadership',
          kapateId: 'KAP-EMP-000001',
          internalEmail: 'admin@kapateconsultancy.in',
          status: 'ACTIVE'
        },
        'shon@kapateconsultancy.in': {
          id: 'usr-admin',
          name: 'Shon Kapate',
          email: 'admin@kapateconsultancy.in',
          role: 'ADMIN',
          designation: 'Founder & CEO / Super Admin',
          department: 'Executive Leadership',
          kapateId: 'KAP-EMP-000001',
          internalEmail: 'admin@kapateconsultancy.in',
          status: 'ACTIVE'
        }
      };

      const matchedDefault = (email && defaultUsers[email.toLowerCase().trim()]) ||
        defaultUsers['admin@kapateconsultancy.in'];

      const initialPassword = (matchedDefault.email === 'admin@kapateconsultancy.in' || matchedDefault.role === 'ADMIN')
        ? 'Admin@KC8421174957'
        : 'KapateOS@2026';

      const initialUser: User & { passwordHash?: string } = {
        id: matchedDefault.id || `usr-${Date.now()}`,
        name: matchedDefault.name || 'Shon Kapate',
        email: matchedDefault.email || 'admin@kapateconsultancy.in',
        role: matchedDefault.role || 'ADMIN',
        designation: matchedDefault.designation || 'Founder & CEO',
        department: matchedDefault.department || 'Management',
        kapateId: matchedDefault.kapateId || 'KAP-EMP-000001',
        internalEmail: matchedDefault.internalEmail || 'admin@kapateconsultancy.in',
        status: 'ACTIVE',
        passwordHash: hashPassword(password || initialPassword)
      };

      await usersColl.insertOne(initialUser as any);
      user = initialUser;
    }

    // Verify password if provided and user has passwordHash
    if (password && user.passwordHash) {
      const isMasterAdmin = user.email === 'admin@kapateconsultancy.in' || 
                            user.email === 'shon@kapateconsultancy.in' || 
                            user.role === 'ADMIN' || 
                            user.role === 'SUPER_ADMIN';

      const isValid = verifyPassword(password, user.passwordHash) || 
                      (isMasterAdmin && (password === 'Admin@KC8421174957' || password === 'KapateOS@2026'));

      if (isValid && isMasterAdmin && password === 'Admin@KC8421174957') {
        // Automatically synchronize the database hash with the updated master password
        const updatedHash = hashPassword('Admin@KC8421174957');
        await usersColl.updateOne(
          { _id: (user as any)._id },
          { $set: { passwordHash: updatedHash, email: 'admin@kapateconsultancy.in', internalEmail: 'admin@kapateconsultancy.in' } }
        ).catch(() => {});
      }

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
