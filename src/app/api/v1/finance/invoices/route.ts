import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';
import { getDatabase } from '@/lib/mongodb';
import { Invoice } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'PROJECT_MANAGER', 'CLIENT']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  let invoices = dataStore.getInvoices();

  // Client isolation
  if (auth.user.role === 'CLIENT') {
    const clientName = auth.user.name.toLowerCase();
    invoices = invoices.filter(i => i.client.toLowerCase().includes(clientName));
  }

  return NextResponse.json({ success: true, data: invoices, invoices });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'FINANCE']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const amount = Number(body.amount) > 0 ? Number(body.amount) : 500000;
    // Server-Authoritative GST (18%) & Total Calculation
    const tax = Math.round(amount * 0.18);
    const total = amount + tax;

    const newInvoice = dataStore.addInvoice({
      id: body.id,
      client: body.client || body.clientName || 'Unnamed Client',
      projectName: body.projectName || body.project || 'Enterprise AI Consulting',
      amount,
      tax,
      total,
      dueDate: body.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: body.status || 'Draft',
      billingAddress: body.billingAddress || '742 Evergreen Terrace, Tech Park, BLR',
      gstin: body.gstin || body.gstNumber || '29AAAAA0000A1Z5',
      items: body.items && body.items.length > 0 ? body.items : [
        { description: 'Sprint Deliverables & Architecture Consulting', qty: 1, rate: amount, amount: amount }
      ],
      paymentReference: body.paymentReference,
      paidDate: body.paidDate,
    });

    // Best-effort replication
    getDatabase()
      .then(({ db }) => db.collection<Invoice>('invoices').insertOne(newInvoice as any))
      .catch(() => {});

    return NextResponse.json({ success: true, data: newInvoice, invoice: newInvoice }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'FINANCE']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Invoice ID is required' }, { status: 400 });
    }

    const { id, _id, ...updateData } = body;
    const updated = dataStore.updateInvoice(id, updateData);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    // Best-effort replication
    getDatabase()
      .then(({ db }) => db.collection<Invoice>('invoices').updateOne({ id }, { $set: updateData }))
      .catch(() => {});

    return NextResponse.json({ success: true, data: updated, invoice: updated });
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
      return NextResponse.json({ success: false, error: 'Invoice ID is required' }, { status: 400 });
    }

    dataStore.deleteInvoice(id);

    // Best-effort replication
    getDatabase()
      .then(({ db }) => db.collection('invoices').deleteOne({ id }))
      .catch(() => {});

    return NextResponse.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
