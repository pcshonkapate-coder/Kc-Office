import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Employee, Intern, Freelancer } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'FINANCE']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'all'; // 'employees' | 'interns' | 'freelancers' | 'all'
  const { db } = await getDatabase();

  const employees = await db.collection<Employee>('employees').find({}).toArray();
  const interns = await db.collection<Intern>('interns').find({}).toArray();
  const freelancers = await db.collection<Freelancer>('freelancers').find({}).toArray();

  if (type === 'employees') return NextResponse.json({ data: employees });
  if (type === 'interns') return NextResponse.json({ data: interns });
  if (type === 'freelancers') return NextResponse.json({ data: freelancers });

  return NextResponse.json({
    data: {
      employees,
      interns,
      freelancers,
    }
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { type = 'employee', member } = body;
  const { db } = await getDatabase();

  if (type === 'employee') {
    const newEmployee: Employee = {
      id: member.id || `emp-${Date.now()}`,
      name: member.name || 'New Employee',
      role: member.role || 'Software Engineer',
      department: member.department || 'Engineering',
      status: member.status || 'Active',
      email: member.email || '',
      phone: member.phone || '',
      manager: member.manager || 'Executive Lead',
      skills: member.skills || ['TypeScript', 'React'],
      projectsCount: member.projectsCount || 0,
      utilization: member.utilization || 100,
      joinDate: member.joinDate || new Date().toISOString().split('T')[0],
      kapateId: member.kapateId || `KC-EMP-${Math.floor(100 + Math.random() * 900)}`,
      internalEmail: member.internalEmail || `${(member.name || 'emp').toLowerCase().replace(/\s+/g, '.')}@kapateconsultancy.in`,
    };
    await db.collection<Employee>('employees').insertOne(newEmployee as any);
    return NextResponse.json({ data: newEmployee }, { status: 201 });
  }

  if (type === 'intern') {
    const newIntern: Intern = {
      id: member.id || `int-${Date.now()}`,
      name: member.name || 'New Intern',
      role: member.role || 'Engineering Intern',
      college: member.college || 'Tech Institute',
      mentor: member.mentor || 'Lead Architect',
      startDate: member.startDate || new Date().toISOString().split('T')[0],
      endDate: member.endDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      status: member.status || 'Active',
      email: member.email || '',
      tasksCompleted: 0,
      tasksPending: 0,
      loggedHours: 0,
      attendancePct: 100,
      trainingProgress: 0,
      mentorFeedback: 'Onboarding completed',
      evaluations: {
        technicalSkills: 80,
        problemSolving: 80,
        communication: 85,
        teamwork: 85,
        learning: 90,
        taskCompletion: 80,
      },
      kapateId: member.kapateId || `KC-INT-${Math.floor(100 + Math.random() * 900)}`,
      internalEmail: member.internalEmail || `${(member.name || 'intern').toLowerCase().replace(/\s+/g, '.')}@kapateconsultancy.in`,
    };
    await db.collection<Intern>('interns').insertOne(newIntern as any);
    return NextResponse.json({ data: newIntern }, { status: 201 });
  }

  if (type === 'freelancer') {
    const newFreelancer: Freelancer = {
      id: member.id || `frl-${Date.now()}`,
      name: member.name || 'Contractor',
      skill: member.skill || 'Specialist',
      projects: member.projects || [],
      hourlyRate: member.hourlyRate || '$50/hr',
      availability: member.availability || 'Available',
      status: member.status || 'Available',
      kapateId: member.kapateId || `KC-FRL-${Math.floor(100 + Math.random() * 900)}`,
      internalEmail: member.internalEmail || `${(member.name || 'contractor').toLowerCase().replace(/\s+/g, '.')}@kapateconsultancy.in`,
    };
    await db.collection<Freelancer>('freelancers').insertOne(newFreelancer as any);
    return NextResponse.json({ data: newFreelancer }, { status: 201 });
  }

  return NextResponse.json({ error: 'Invalid member type' }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const type = searchParams.get('type') || 'employee'; // 'employee' | 'intern' | 'freelancer'

  if (!id) {
    return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
  }

  const { db } = await getDatabase();
  const collectionName = type === 'intern' ? 'interns' : type === 'freelancer' ? 'freelancers' : 'employees';
  await db.collection(collectionName).deleteOne({ id });

  return NextResponse.json({ success: true, message: 'Member deleted successfully' });
}
