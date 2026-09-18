import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Expense } from '@/types';

export async function GET(req: NextRequest) {
  // Disallow CLIENT role from accessing internal expenses
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'PROJECT_MANAGER', 'EMPLOYEE']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { db } = await getDatabase();
  const expenses = await db.collection<Expense>('expenses').find({}).sort({ date: -1 }).toArray();
  return NextResponse.json({ data: expenses });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'PROJECT_MANAGER']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { db } = await getDatabase();

  const newExpense: Expense = {
    id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    vendor: body.vendor || 'Vendor',
    category: body.category || 'Cloud Infrastructure',
    amount: Number(body.amount) || 0,
    date: body.date || new Date().toISOString().split('T')[0],
    projectName: body.projectName || undefined,
    status: body.status || 'Paid',
  };

  await db.collection<Expense>('expenses').insertOne(newExpense as any);
  return NextResponse.json({ data: newExpense }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'FINANCE']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  if (!body.id) {
    return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
  }

  const { db } = await getDatabase();
  const { _id, ...updateData } = body;

  const result = await db.collection<Expense>('expenses').findOneAndUpdate(
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
    return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
  }

  const { db } = await getDatabase();
  await db.collection('expenses').deleteOne({ id });
  return NextResponse.json({ success: true, message: 'Expense deleted successfully' });
}
