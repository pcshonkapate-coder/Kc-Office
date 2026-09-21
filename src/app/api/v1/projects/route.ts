import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';
import { getCloudCollection } from '@/lib/mongodb';
import { Project } from '@/types';

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if ('errorResponse' in auth && auth.errorResponse) return auth.errorResponse;

  try {
    let projects = dataStore.getProjects();

    // If client role, only return projects where this client is assigned
    if (auth.user && auth.user.role === 'CLIENT') {
      const clientName = auth.user.name.toLowerCase();
      const clientEmail = auth.user.email.toLowerCase();
      projects = projects.filter(p =>
        (p.client && p.client.toLowerCase().includes(clientName)) ||
        ((p as any).clientEmail && (p as any).clientEmail.toLowerCase() === clientEmail)
      );
    }

    return NextResponse.json({ success: true, data: projects, projects });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']);
  if ('errorResponse' in auth && auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const { name, client, clientEmail, budget, deadline, techStack = [], team = [], manager, description } = body;

    if (!name || !client) {
      return NextResponse.json({ success: false, error: 'Project name and client are required.' }, { status: 400 });
    }

    const budgetNum = typeof budget === 'number' ? budget : parseFloat(budget) || 1000000;
    const authorName = auth.user ? auth.user.name : 'Shon Kapate';

    const newProject = dataStore.addProject({
      name,
      client,
      budget: budgetNum,
      spentBudget: 0,
      progress: 0,
      status: 'Planning',
      deadline: deadline || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      team: team.length > 0 ? team : [authorName],
      manager: manager || authorName,
      description: description || 'Enterprise engineering and consultancy delivery engagement.',
      milestones: [
        { id: `m-${Date.now()}-1`, name: 'Discovery & Requirements Lock', progress: 100, dueDate: new Date().toISOString().split('T')[0], status: 'Completed' },
        { id: `m-${Date.now()}-2`, name: 'Architecture & Staging Provisioning', progress: 20, dueDate: deadline || '2026-11-30', status: 'In Progress' }
      ],
      profitability: {
        revenue: budgetNum,
        employeeCost: Math.round(budgetNum * 0.45),
        cloudCost: Math.round(budgetNum * 0.08),
        aiApiCost: Math.round(budgetNum * 0.05),
        otherCost: 10000,
        grossProfit: Math.round(budgetNum * 0.42),
        grossMargin: 42.0
      }
    });

    // Best-effort replication to cloud MongoDB
    getCloudCollection<Project>('projects')
      .then(coll => coll.insertOne({ ...newProject, clientEmail } as any))
      .catch(() => {});

    return NextResponse.json({ success: true, data: newProject, project: newProject }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']);
  if ('errorResponse' in auth && auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Project ID is required.' }, { status: 400 });
    }

    const updated = dataStore.updateProject(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Project not found.' }, { status: 404 });
    }

    // Best-effort replication to cloud MongoDB
    getCloudCollection<Project>('projects')
      .then(coll => coll.updateOne({ id }, { $set: updates }))
      .catch(() => {});

    return NextResponse.json({ success: true, data: updated, project: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if ('errorResponse' in auth && auth.errorResponse) return auth.errorResponse;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Project ID is required.' }, { status: 400 });
    }

    dataStore.deleteProject(id);

    // Best-effort cloud deletion
    getCloudCollection<Project>('projects')
      .then(coll => coll.deleteOne({ id }))
      .catch(() => {});

    return NextResponse.json({ success: true, message: 'Project deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
