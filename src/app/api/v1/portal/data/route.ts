import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Project, Task, Invoice, AppDocument } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { db } = await getDatabase();
  const userName = auth.user.name;
  const isClient = auth.user.role === 'CLIENT';

  // For Client role: strictly fetch projects belonging to client, client visible tasks, and client invoices
  const projectQuery = isClient ? { client: { $regex: new RegExp(userName, 'i') } } : {};
  const projects = await db.collection<Project>('projects').find(projectQuery).toArray();

  const taskQuery = isClient
    ? {
        $or: [
          { clientVisible: true },
          { assigneeRole: 'CLIENT' },
          { assignedTo: { $regex: new RegExp(userName, 'i') } },
        ]
      }
    : {};
  const tasks = await db.collection<Task>('tasks').find(taskQuery).toArray();

  const invoiceQuery = isClient ? { client: { $regex: new RegExp(userName, 'i') } } : {};
  const invoices = await db.collection<Invoice>('invoices').find(invoiceQuery).toArray();

  const documents = await db.collection<AppDocument>('documents').find({}).toArray();

  return NextResponse.json({
    data: {
      projects,
      tasks,
      invoices,
      documents,
    }
  });
}
