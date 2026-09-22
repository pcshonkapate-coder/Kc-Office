import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';
import { getDatabase } from '@/lib/mongodb';
import { Deal } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const deals = dataStore.getDeals();
  return NextResponse.json({ success: true, data: deals, deals });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const val = Number(body.value) || body.valueNum || 0;
    const newDeal = dataStore.addDeal({
      title: body.title || 'Enterprise Advisory & AI Pipeline',
      company: body.company || 'Enterprise Partner',
      value: val,
      stage: body.stage || 'NEW LEAD',
      owner: body.owner || auth.user.name || 'Executive Lead',
      expectedClose: body.expectedClose || body.expectedCloseDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      probability: Number(body.probability) || 50,
      service: body.service || 'AI Solutions / Machine Learning',
      created: new Date().toISOString().split('T')[0],
    });

    // Best-effort replication
    getDatabase()
      .then(({ db }) => db.collection<Deal>('deals').insertOne(newDeal as any))
      .catch(() => {});

    return NextResponse.json({ success: true, data: newDeal, deal: newDeal }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Deal ID is required' }, { status: 400 });
    }

    const { id, _id, ...updateData } = body;
    const updated = dataStore.updateDeal(id, updateData);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Deal not found' }, { status: 404 });
    }

    // Best-effort replication
    getDatabase()
      .then(({ db }) => db.collection<Deal>('deals').updateOne({ id }, { $set: updateData }))
      .catch(() => {});

    return NextResponse.json({ success: true, data: updated, deal: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Deal ID is required' }, { status: 400 });
    }

    dataStore.deleteDeal(id);

    // Best-effort replication
    getDatabase()
      .then(({ db }) => db.collection('deals').deleteOne({ id }))
      .catch(() => {});

    return NextResponse.json({ success: true, message: 'Deal deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
