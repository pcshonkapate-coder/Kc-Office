import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';
import { getDatabase } from '@/lib/mongodb';
import { Lead } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || undefined;

  const leads = dataStore.getLeads(status);
  return NextResponse.json({ success: true, data: leads, leads });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const newLead = dataStore.addLead({
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
      created: body.created || new Date().toISOString().split('T')[0],
      nextFollowUp: body.nextFollowUp || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    });

    // Best-effort replication to cloud MongoDB
    getDatabase()
      .then(({ db }) => db.collection<Lead>('leads').insertOne(newLead as any))
      .catch(() => {});

    return NextResponse.json({ success: true, data: newLead, lead: newLead }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Lead ID is required' }, { status: 400 });
    }

    const { id, _id, ...updateData } = body;
    const updated = dataStore.updateLead(id, updateData);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    // Best-effort replication
    getDatabase()
      .then(({ db }) => db.collection<Lead>('leads').updateOne({ id }, { $set: updateData }))
      .catch(() => {});

    return NextResponse.json({ success: true, data: updated, lead: updated });
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
      return NextResponse.json({ success: false, error: 'Lead ID is required' }, { status: 400 });
    }

    dataStore.deleteLead(id);

    // Best-effort replication
    getDatabase()
      .then(({ db }) => db.collection('leads').deleteOne({ id }))
      .catch(() => {});

    return NextResponse.json({ success: true, message: 'Lead deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
