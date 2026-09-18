import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Payment } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // Client role can only view payments related to their own invoices/client name
  const { db } = await getDatabase();
  const query: Record<string, any> = {};

  if (auth.user.role === 'CLIENT') {
    query.client = auth.user.name;
  }

  const payments = await db.collection<Payment>('payments').find(query).sort({ date: -1 }).toArray();
  return NextResponse.json({ data: payments });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'FINANCE']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { db } = await getDatabase();

  const newPayment: Payment = {
    id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    invoiceId: body.invoiceId || '',
    client: body.client || 'Client',
    amount: Number(body.amount) || 0,
    date: body.date || new Date().toISOString().split('T')[0],
    method: body.method || 'Bank Transfer',
    reference: body.reference || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
  };

  await db.collection<Payment>('payments').insertOne(newPayment as any);

  // If linked to an invoice, optionally mark invoice as paid or partially paid
  if (newPayment.invoiceId) {
    await db.collection('invoices').updateOne(
      { id: newPayment.invoiceId },
      { $set: { status: 'PAID', paidAt: newPayment.date } }
    );
  }

  return NextResponse.json({ data: newPayment }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'FINANCE']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
  }

  const { db } = await getDatabase();
  await db.collection('payments').deleteOne({ id });
  return NextResponse.json({ success: true, message: 'Payment deleted successfully' });
}
