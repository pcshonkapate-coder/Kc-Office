import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getCloudCollection } from '@/lib/mongodb';
import { User } from '@/types';

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const usersColl = await getCloudCollection<User>('users');
    const user = await usersColl.findOne({
      $or: [
        { id: auth.user.userId },
        { email: auth.user.email.toLowerCase() }
      ]
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        user: {
          id: auth.user.userId,
          email: auth.user.email,
          name: auth.user.name,
          role: auth.user.role,
          designation: auth.user.designation,
          department: auth.user.department,
          kapateId: auth.user.kapateId
        }
      });
    }

    return NextResponse.json({
      success: true,
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
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
