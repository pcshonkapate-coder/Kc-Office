import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Lead } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  const { db } = await getDatabase();
  const query: Record<string, any> = {};
  if (status) query.status = status;

  const leads = await db.collection<Lead>('leads').find(query).sort({ created: -1 }).toArray();
  return NextResponse.json({ data: leads });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { db } = await getDatabase();

  const newLead: Lead = {
    id: `KAP-${Date.now().toString().slice(-4)}`,
    name: body.name || 'Unnamed Lead',
    email: body.email || '',
    phone: body.phone || '',
    company: body.company || 'Enterprise Prospect',
    service: body.service || 'AI Solutions / Machine Learning',
    budget: body.budget || '₹10L - ₹25L',
    source: body.source || 'Website',
    owner: body.owner || body.assignedTo || auth.user.name || 'Executive Lead',
    status: body.status || 'New Lead',
    score: body.score ?? 85,
    description: body.description || '',
    created: new Date().toISOString().split('T')[0],
    nextFollowUp: body.nextFollowUp || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
  };

  await db.collection<Lead>('leads').insertOne(newLead as any);
  return NextResponse.json({ data: newLead }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
  }

  const { db } = await getDatabase();
  const { _id, ...updateData } = body;

  const result = await db.collection<Lead>('leads').findOneAndUpdate(
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
    return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
  }

  const { db } = await getDatabase();
  await db.collection('leads').deleteOne({ id });
  return NextResponse.json({ success: true, message: 'Lead deleted successfully' });
}
