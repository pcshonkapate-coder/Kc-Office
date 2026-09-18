import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getCloudCollection } from '@/lib/mongodb';
import { Project } from '@/types';

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const projectsColl = await getCloudCollection<Project>('projects');
    const filter: Record<string, any> = {};

    // If client role, only return projects where this client is assigned
    if (auth.user.role === 'CLIENT') {
      filter.$or = [
        { client: { $regex: auth.user.name, $options: 'i' } },
        { clientEmail: auth.user.email.toLowerCase() }
      ];
    }

    const projects = await projectsColl.find(filter).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ success: true, projects });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const { name, client, clientEmail, budget, deadline, techStack = [], team = [], manager, description } = body;

    if (!name || !client) {
      return NextResponse.json({ success: false, error: 'Project name and client are required.' }, { status: 400 });
    }

    const projectsColl = await getCloudCollection<Project>('projects');
    const prjCount = await projectsColl.countDocuments();
    const projectId = `PRJ-${String(prjCount + 101).padStart(3, '0')}`;
    const budgetNum = typeof budget === 'number' ? budget : parseFloat(budget) || 1000000;

    const newProject: Project = {
      id: projectId,
      name,
      client,
      budget: budgetNum,
      spentBudget: 0,
      progress: 0,
      status: 'Planning',
      deadline: deadline || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      team: team.length > 0 ? team : [auth.user.name],
      manager: manager || auth.user.name,
      description: description || 'Enterprise engineering and consultancy delivery engagement.',
      milestones: [
        { id: `m-${Date.now()}-1`, name: 'Discovery & Requirements Lock', progress: 100, dueDate: new Date().toISOString().split('T')[0], status: 'Completed' },
        { id: `m-${Date.now()}-2`, name: 'Architecture & Staging Provisioning', progress: 20, dueDate: deadline || '2026-11-30', status: 'In Progress' }
      ],
      profitability: {
        revenue: budgetNum,
        employeeCost: 0,
        cloudCost: 0,
        aiApiCost: 0,
        otherCost: 0,
        grossProfit: budgetNum,
        grossMargin: 100.0
      }
    };

    await projectsColl.insertOne(newProject as any);
    return NextResponse.json({ success: true, project: newProject });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Project ID is required.' }, { status: 400 });
    }

    const projectsColl = await getCloudCollection<Project>('projects');
    await projectsColl.updateOne({ id }, { $set: updates });
    const updated = await projectsColl.findOne({ id });

    return NextResponse.json({ success: true, project: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
