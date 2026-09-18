import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Contact } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { db } = await getDatabase();
  const contacts = await db.collection<Contact>('contacts').find({}).toArray();
  return NextResponse.json({ data: contacts });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { db } = await getDatabase();

  const newContact: Contact = {
    id: `cont-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: body.name || 'Executive Stakeholder',
    designation: body.designation || body.role || 'VP of Engineering',
    company: body.company || 'Enterprise Partner',
    email: body.email || '',
    phone: body.phone || '',
    relationship: body.relationship || 'Key Decision Maker',
    lastContacted: body.lastContacted || new Date().toISOString().split('T')[0],
    owner: body.owner || auth.user.name || 'Executive Lead',
  };

  await db.collection<Contact>('contacts').insertOne(newContact as any);
  return NextResponse.json({ data: newContact }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
  }

  const { db } = await getDatabase();
  await db.collection('contacts').deleteOne({ id });
  return NextResponse.json({ success: true, message: 'Contact deleted successfully' });
}
