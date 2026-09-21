import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';
import { getDatabase } from '@/lib/mongodb';
import { Payment } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  let client = searchParams.get('client') || undefined;
  const invoiceId = searchParams.get('invoiceId') || undefined;

  // Client role can only view payments related to their own client name
  if (auth.user.role === 'CLIENT') {
    client = auth.user.name;
  }

  const payments = dataStore.getPayments(client, invoiceId);
  return NextResponse.json({ success: true, data: payments, payments });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'FINANCE']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();

    const newPayment = dataStore.addPayment({
      id: body.id,
      invoiceId: body.invoiceId || '',
      client: body.client || 'Client',
      amount: Number(body.amount) || 0,
      date: body.date || new Date().toISOString().split('T')[0],
      method: body.method || 'Bank Transfer',
      reference: body.reference || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
    });

    // Best-effort replication to MongoDB
    getDatabase()
      .then(async ({ db }) => {
        await db.collection<Payment>('payments').insertOne(newPayment as any);
        if (newPayment.invoiceId) {
          await db.collection('invoices').updateOne(
            { id: newPayment.invoiceId },
            { $set: { status: 'Paid', paidDate: newPayment.date, paymentReference: newPayment.reference } }
          );
        }
      })
      .catch(() => {});

    return NextResponse.json({ success: true, data: newPayment, payment: newPayment }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'FINANCE']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Payment ID is required' }, { status: 400 });
    }

    const { db } = await getDatabase();
    await db.collection('payments').deleteOne({ id });
    return NextResponse.json({ success: true, message: 'Payment deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
