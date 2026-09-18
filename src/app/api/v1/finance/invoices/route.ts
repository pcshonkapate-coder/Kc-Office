import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Invoice } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { db } = await getDatabase();
  const query: Record<string, any> = {};

  // Client isolation
  if (auth.user.role === 'CLIENT') {
    query.client = auth.user.name;
  }

  const invoices = await db.collection<Invoice>('invoices').find(query).sort({ dueDate: -1 }).toArray();
  return NextResponse.json({ data: invoices });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'FINANCE']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { db } = await getDatabase();

  const amount = Number(body.amount) || Number(body.total) || 0;
  const tax = Number(body.tax) || Math.round(amount * 0.18);
  const total = Number(body.total) || (amount + tax);

  const newInvoice: Invoice = {
    id: body.id || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    client: body.client || body.clientName || 'Unnamed Client',
    projectName: body.projectName || 'Enterprise AI Consulting',
    amount: amount,
    tax: tax,
    total: total,
    dueDate: body.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    status: body.status || 'Draft',
    billingAddress: body.billingAddress || '742 Evergreen Terrace, Tech Park, BLR',
    gstin: body.gstin || '29AAAAA0000A1Z5',
    items: body.items && body.items.length > 0 ? body.items : [
      { description: 'Sprint Deliverables & Architecture Consulting', qty: 1, rate: amount, amount: amount }
    ],
    paymentReference: body.paymentReference,
    paidDate: body.paidDate,
  };

  await db.collection<Invoice>('invoices').insertOne(newInvoice as any);
  return NextResponse.json({ data: newInvoice }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'FINANCE']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
  }

  const { db } = await getDatabase();
  const { _id, ...updateData } = body;

  const result = await db.collection<Invoice>('invoices').findOneAndUpdate(
    { id: body.id },
    { $set: updateData },
    { returnDocument: 'after' }
  );

  return NextResponse.json({ data: result });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'FINANCE']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
  }

  const { db } = await getDatabase();
  await db.collection('invoices').deleteOne({ id });
  return NextResponse.json({ success: true, message: 'Invoice deleted successfully' });
}
