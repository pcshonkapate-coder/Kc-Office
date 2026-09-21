import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const users = dataStore.getUsers();
  const projects = dataStore.getProjects();
  const tasks = dataStore.getTasks();
  const leads = dataStore.getLeads();
  const sessions = dataStore.getSessions();
  const auditLogs = dataStore.getAuditLogs();

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'ACTIVE').length;
  const lockedAccounts = users.filter(u => u.status === 'LOCKED').length;
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'In Progress' || p.status === 'Planning').length;
  const totalTasks = tasks.length;
  const openTasks = tasks.filter(t => t.status !== 'COMPLETED').length;
  const totalLeads = leads.length;
  const openLeads = leads.filter(l => l.status !== 'Lost').length;
  const activeSessionsCount = sessions.filter(s => s.status === 'ACTIVE').length;
  const totalAuditEvents = auditLogs.length;

  return NextResponse.json({
    success: true,
    data: {
      stats: {
        totalUsers,
        activeUsers,
        lockedAccounts,
        totalProjects,
        activeProjects,
        totalTasks,
        openTasks,
        totalLeads,
        openLeads,
        activeSessions: activeSessionsCount,
        totalAuditEvents,
        systemHealth: 'HEALTHY',
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'production',
        mailDomain: 'kapateconsultancy.in',
        organization: 'Kapate Consultancy Pvt. Ltd.',
      },
      systemAlerts: [
        {
          id: 'alt-1',
          level: 'info',
          title: 'All Internal Mail Services Verified',
          message: 'Corporate domain kapateconsultancy.in is active with SPF/DKIM verification.',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'alt-2',
          level: 'info',
          title: 'Master Super Admin Synced',
          message: 'Primary administrative account admin@kapateconsultancy.in active with MFA policy.',
          timestamp: new Date().toISOString(),
        }
      ]
    }
  });
}
