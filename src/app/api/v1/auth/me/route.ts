import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const user = dataStore.getUserById(auth.user.userId) || dataStore.getUserByEmail(auth.user.email);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User account not found or deactivated.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
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
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
