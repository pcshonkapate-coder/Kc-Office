import { NextRequest } from 'next/server';
import { GET as adminAuditGet, POST as adminAuditPost } from '../../admin/audit/route';

export async function GET(req: NextRequest) {
  return adminAuditGet(req);
}

export async function POST(req: NextRequest) {
  return adminAuditPost(req);
}
