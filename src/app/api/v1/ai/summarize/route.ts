import { NextRequest, NextResponse } from 'next/server';
import { POST as summaryPost } from '../summary/route';

export async function POST(req: NextRequest) {
  return summaryPost(req);
}
