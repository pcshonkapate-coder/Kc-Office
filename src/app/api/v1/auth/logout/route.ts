import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';

export async function POST(req: Request) {
  const user = getAuthUser(req);
  if (user) {
    dataStore.addAuditLog({
      actor: user.name,
      actorKapateId: user.kapateId,
      action: 'USER_LOGOUT',
      module: 'auth',
      targetResource: `users/${user.userId}`,
      targetUser: user.email,
      result: 'SUCCESS',
      reason: 'User initiated secure logout'
    });
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.delete('kapate_token');
  return response;
}
