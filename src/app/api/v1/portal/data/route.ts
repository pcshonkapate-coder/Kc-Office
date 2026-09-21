import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';
import { AppDocument } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const userName = auth.user.name || '';
  const isClient = auth.user.role === 'CLIENT';
  const lowerName = userName.toLowerCase();

  // Authoritative retrieval from dataStore
  let projects = dataStore.getProjects();
  let tasks = dataStore.getTasks();
  let invoices = dataStore.getInvoices();
  let documents = dataStore.getDocuments();

  // For Client role: strictly filter for client isolation
  if (isClient) {
    projects = projects.filter(p => (p.client || '').toLowerCase().includes(lowerName));
    tasks = tasks.filter(t =>
      t.clientVisible ||
      t.assigneeRole === 'CLIENT' ||
      (t.assignedTo && t.assignedTo.toLowerCase().includes(lowerName))
    );
    invoices = invoices.filter(i => (i.client || '').toLowerCase().includes(lowerName));
    documents = documents.filter((d: AppDocument) =>
      !d.category ||
      d.category === 'Contracts' ||
      d.category === 'Proposals' ||
      d.category === 'Invoices' ||
      d.category === 'Project Documents' ||
      (d.relatedEntity && d.relatedEntity.toLowerCase().includes(lowerName))
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      projects,
      tasks,
      invoices,
      documents,
    }
  });
}
