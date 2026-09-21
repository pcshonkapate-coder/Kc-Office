import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';
import { getDatabase } from '@/lib/mongodb';
import { Contact } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId') || undefined;

  const contacts = dataStore.getContacts(companyId);
  return NextResponse.json({ success: true, data: contacts, contacts });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const newContact = dataStore.addContact({
      name: body.name || 'Executive Stakeholder',
      designation: body.designation || body.role || 'VP of Engineering',
      company: body.company || body.companyName || 'Enterprise Partner',
      email: body.email || '',
      phone: body.phone || '',
      lastContacted: body.lastContacted || new Date().toISOString().split('T')[0],
      relationship: body.relationship || 'Key Decision Maker',
      owner: body.owner || auth.user.name || 'Shon Kapate'
    });

    // Best-effort replication
    getDatabase()
      .then(({ db }) => db.collection<Contact>('contacts').insertOne(newContact as any))
      .catch(() => {});

    return NextResponse.json({ success: true, data: newContact, contact: newContact }, { status: 201 });
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
      return NextResponse.json({ success: false, error: 'Contact ID is required' }, { status: 400 });
    }

    dataStore.deleteContact(id);

    // Best-effort replication
    getDatabase()
      .then(({ db }) => db.collection('contacts').deleteOne({ id }))
      .catch(() => {});

    return NextResponse.json({ success: true, message: 'Contact deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
