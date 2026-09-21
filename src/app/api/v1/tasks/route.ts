import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';
import { getCloudCollection } from '@/lib/mongodb';
import { Task } from '@/types';

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if ('errorResponse' in auth && auth.errorResponse) return auth.errorResponse;

  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    const assignedTo = url.searchParams.get('assignedTo');

    let tasks = dataStore.getTasks({
      projectId: projectId || undefined,
      assignedTo: assignedTo || undefined
    });

    // If client role, only return client-visible tasks
    if (auth.user && auth.user.role === 'CLIENT') {
      tasks = tasks.filter(t =>
        t.clientVisible ||
        t.assigneeRole === 'CLIENT' ||
        (t.assignedTo && t.assignedTo.toLowerCase().includes('client'))
      );
    }

    return NextResponse.json({ success: true, data: tasks, tasks });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if ('errorResponse' in auth && auth.errorResponse) return auth.errorResponse;

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
      clientVisible = false,
      assigneeRole
    } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Task title is required.' }, { status: 400 });
    }

    const authorName = auth.user ? auth.user.name : 'Shon Kapate';
    const newTask = dataStore.addTask({
      title,
      description: description || '',
      projectId,
      projectName,
      assignedTo: assignedTo || authorName,
      assigneeRole: assigneeRole || (authorName.includes('Manager') ? 'MANAGER' : 'ENGINEER'),
      priority,
      status,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimatedHours: typeof estimatedHours === 'number' ? estimatedHours : 8,
      loggedHours: 0,
      clientVisible
    });

    // Best-effort cloud replication
    getCloudCollection<Task>('tasks')
      .then(coll => coll.insertOne(newTask as any))
      .catch(() => {});

    return NextResponse.json({ success: true, data: newTask, task: newTask }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = requireAuth(req);
  if ('errorResponse' in auth && auth.errorResponse) return auth.errorResponse;

  try {
    const body = await req.json();
    const { id, status, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Task ID is required.' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = { ...updates };
    if (status) updatePayload.status = status;

    const updated = dataStore.updateTask(id, updatePayload);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Task not found.' }, { status: 404 });
    }

    // Best-effort cloud replication
    getCloudCollection<Task>('tasks')
      .then(coll => coll.updateOne({ id }, { $set: updatePayload }))
      .catch(() => {});

    return NextResponse.json({ success: true, data: updated, task: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']);
  if ('errorResponse' in auth && auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Task ID is required.' }, { status: 400 });
    }

    dataStore.deleteTask(id);

    // Best-effort cloud deletion
    getCloudCollection<Task>('tasks')
      .then(coll => coll.deleteOne({ id }))
      .catch(() => {});

    return NextResponse.json({ success: true, message: `Task ${id} deleted.` });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
