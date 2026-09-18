import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getCloudCollection } from '@/lib/mongodb';
import { Task } from '@/types';

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    const assignedTo = url.searchParams.get('assignedTo');

    const tasksColl = await getCloudCollection<Task>('tasks');
    const filter: Record<string, any> = {};

    if (projectId) filter.projectId = projectId;
    if (assignedTo) filter.assignedTo = { $regex: assignedTo, $options: 'i' };

    // If client role, only return client-visible tasks
    if (auth.user.role === 'CLIENT') {
      filter.$or = [
        { clientVisible: true },
        { assigneeRole: 'CLIENT' },
        { assignedTo: { $regex: 'client', $options: 'i' } }
      ];
    }

    const tasks = await tasksColl.find(filter).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ success: true, tasks });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const {
      title,
      description,
      projectId = 'PRJ-MAIN',
      projectName = 'Enterprise System',
      assignedTo,
      priority = 'High',
      status = 'TODO',
      dueDate,
      estimatedHours = 8,
      sourceEmailId,
      clientVisible = false
    } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Task title is required.' }, { status: 400 });
    }

    const tasksColl = await getCloudCollection<Task>('tasks');
    const taskCount = await tasksColl.countDocuments();
    const taskId = `TSK-${String(taskCount + 101).padStart(3, '0')}`;

    const newTask: Task = {
      id: taskId,
      title,
      description: description || '',
      projectId,
      projectName,
      assignedTo: assignedTo || auth.user.name,
      priority,
      status,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimatedHours: typeof estimatedHours === 'number' ? estimatedHours : 8,
      loggedHours: 0,
      clientVisible
    };

    await tasksColl.insertOne(newTask as any);
    return NextResponse.json({ success: true, task: newTask });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const { id, status, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Task ID is required.' }, { status: 400 });
    }

    const tasksColl = await getCloudCollection<Task>('tasks');
    const updatePayload: Record<string, any> = { ...updates };
    if (status) updatePayload.status = status;

    await tasksColl.updateOne({ id }, { $set: updatePayload });
    const updated = await tasksColl.findOne({ id });

    return NextResponse.json({ success: true, task: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Task ID is required.' }, { status: 400 });
    }

    const tasksColl = await getCloudCollection<Task>('tasks');
    await tasksColl.deleteOne({ id });

    return NextResponse.json({ success: true, message: `Task ${id} deleted.` });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
