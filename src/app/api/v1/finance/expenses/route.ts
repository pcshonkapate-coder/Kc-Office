import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';
import { getDatabase } from '@/lib/mongodb';
import { Expense } from '@/types';

export async function GET(req: NextRequest) {
  // Disallow CLIENT and INTERN roles from accessing internal expenses
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'PROJECT_MANAGER']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || undefined;
  const status = searchParams.get('status') || undefined;

  const expenses = dataStore.getExpenses(category, status);
  return NextResponse.json({ success: true, data: expenses, expenses });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'PROJECT_MANAGER']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();

    const newExpense = dataStore.addExpense({
      id: body.id,
      vendor: body.vendor || 'Vendor',
      category: body.category || 'Cloud Infrastructure',
      amount: Number(body.amount) || 0,
      date: body.date || new Date().toISOString().split('T')[0],
      projectName: body.projectName || undefined,
      status: body.status || 'Paid',
    });

    // Best-effort replication to MongoDB
    getDatabase()
      .then(({ db }) => db.collection<Expense>('expenses').insertOne(newExpense as any))
      .catch(() => {});

    return NextResponse.json({ success: true, data: newExpense, expense: newExpense }, { status: 201 });
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
      return NextResponse.json({ success: false, error: 'Expense ID is required' }, { status: 400 });
    }

    const { id, _id, ...updateData } = body;
    const updated = dataStore.updateExpense(id, updateData);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
    }

    // Best-effort replication to MongoDB
    getDatabase()
      .then(({ db }) => db.collection<Expense>('expenses').updateOne({ id }, { $set: updateData }))
      .catch(() => {});

    return NextResponse.json({ success: true, data: updated, expense: updated });
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
      return NextResponse.json({ success: false, error: 'Expense ID is required' }, { status: 400 });
    }

    dataStore.deleteExpense(id);

    // Best-effort replication to MongoDB
    getDatabase()
      .then(({ db }) => db.collection('expenses').deleteOne({ id }))
      .catch(() => {});

    return NextResponse.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
