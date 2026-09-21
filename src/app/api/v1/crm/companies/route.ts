import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';
import { getDatabase } from '@/lib/mongodb';
import { Company } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const companies = dataStore.getCompanies();
  return NextResponse.json({ success: true, data: companies, companies });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const newCompany = dataStore.addCompany({
      name: body.name || 'New Enterprise Client',
      industry: body.industry || 'Technology & Financial Services',
      website: body.website || body.domain || 'https://example.com',
      location: body.location || 'Global / Remote',
      contactsCount: body.contactsCount || 0,
      dealsCount: body.dealsCount || 0,
      activeProjects: body.activeProjects || 0,
      totalRevenue: body.totalRevenue || '₹0.0L',
      contacts: body.contacts || [],
    });

    // Best-effort replication
    getDatabase()
      .then(({ db }) => db.collection<Company>('companies').insertOne(newCompany as any))
      .catch(() => {});

    return NextResponse.json({ success: true, data: newCompany, company: newCompany }, { status: 201 });
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
      return NextResponse.json({ success: false, error: 'Company ID is required' }, { status: 400 });
    }

    const { id, _id, ...updateData } = body;
    const updated = dataStore.updateCompany(id, updateData);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    // Best-effort replication
    getDatabase()
      .then(({ db }) => db.collection<Company>('companies').updateOne({ id }, { $set: updateData }))
      .catch(() => {});

    return NextResponse.json({ success: true, data: updated, company: updated });
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
      return NextResponse.json({ success: false, error: 'Company ID is required' }, { status: 400 });
    }

    dataStore.deleteCompany(id);

    // Best-effort replication
    getDatabase()
      .then(({ db }) => db.collection('companies').deleteOne({ id }))
      .catch(() => {});

    return NextResponse.json({ success: true, message: 'Company deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
