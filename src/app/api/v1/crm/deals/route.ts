import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Deal } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { db } = await getDatabase();
  const deals = await db.collection<Deal>('deals').find({}).toArray();
  return NextResponse.json({ data: deals });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { db } = await getDatabase();

  const newDeal: Deal = {
    id: `deal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    title: body.title || 'Enterprise Advisory & AI Pipeline',
    company: body.company || 'Enterprise Partner',
    contact: body.contact || 'Principal Sponsor',
    value: Number(body.value) || 0,
    stage: body.stage || 'NEW LEAD',
    owner: body.owner || auth.user.name || 'Executive Lead',
    expectedClose: body.expectedClose || body.expectedCloseDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    probability: Number(body.probability) || 50,
    service: body.service || 'AI Solutions / Machine Learning',
    created: new Date().toISOString().split('T')[0],
  };

  await db.collection<Deal>('deals').insertOne(newDeal as any);
  return NextResponse.json({ data: newDeal }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 });
  }

  const { db } = await getDatabase();
  const { _id, ...updateData } = body;

  const result = await db.collection<Deal>('deals').findOneAndUpdate(
    { id: body.id },
    { $set: updateData },
    { returnDocument: 'after' }
  );

  return NextResponse.json({ data: result });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 });
  }

  const { db } = await getDatabase();
  await db.collection('deals').deleteOne({ id });
  return NextResponse.json({ success: true, message: 'Deal deleted successfully' });
}
