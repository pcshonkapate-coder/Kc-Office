import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Company } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { db } = await getDatabase();
  const companies = await db.collection<Company>('companies').find({}).toArray();
  return NextResponse.json({ data: companies });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { db } = await getDatabase();

  const newCompany: Company = {
    id: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: body.name || 'New Enterprise Client',
    industry: body.industry || 'Technology & Financial Services',
    website: body.website || body.domain || 'https://example.com',
    location: body.location || 'Global / Remote',
    contactsCount: body.contactsCount || 0,
    dealsCount: body.dealsCount || 0,
    activeProjects: body.activeProjects || 0,
    totalRevenue: body.totalRevenue || '₹0.0L',
    contacts: body.contacts || [],
  };

  await db.collection<Company>('companies').insertOne(newCompany as any);
  return NextResponse.json({ data: newCompany }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
  }

  const { db } = await getDatabase();
  const { _id, ...updateData } = body;

  const result = await db.collection<Company>('companies').findOneAndUpdate(
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
    return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
  }

  const { db } = await getDatabase();
  await db.collection('companies').deleteOne({ id });
  return NextResponse.json({ success: true, message: 'Company deleted successfully' });
}
