import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, hashPassword } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';
import { Employee, Intern, Freelancer } from '@/types';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'FINANCE']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'all'; // 'employees' | 'interns' | 'freelancers' | 'all'
  const search = (searchParams.get('search') || '').toLowerCase().trim();

  let employees = dataStore.getEmployees();

  if (search) {
    employees = employees.filter(e =>
      e.name.toLowerCase().includes(search) ||
      e.email.toLowerCase().includes(search) ||
      (e.kapateId && e.kapateId.toLowerCase().includes(search)) ||
      (e.role && e.role.toLowerCase().includes(search)) ||
      (e.department && e.department.toLowerCase().includes(search))
    );
  }

  const interns: Intern[] = (dataStore as any).loadStore ? (dataStore as any).loadStore().interns || [] : [];
  const freelancers: Freelancer[] = (dataStore as any).loadStore ? (dataStore as any).loadStore().freelancers || [] : [];

  if (type === 'employees') return NextResponse.json({ success: true, data: employees, count: employees.length });
  if (type === 'interns') return NextResponse.json({ success: true, data: interns, count: interns.length });
  if (type === 'freelancers') return NextResponse.json({ success: true, data: freelancers, count: freelancers.length });

  return NextResponse.json({
    success: true,
    data: {
      employees,
      interns,
      freelancers,
    },
    totalEmployees: employees.length
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { type = 'employee', member = body } = body;

    if (!member.name || member.name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Employee name is required.' },
        { status: 400 }
      );
    }

    if (type === 'employee') {
      // 1. Transactionally insert into persistent dataStore
      const createdEmployee = dataStore.addEmployee({
        id: member.id,
        name: member.name.trim(),
        email: member.email,
        role: member.role || 'Software Engineer',
        department: member.department || 'Engineering',
        phone: member.phone || '+91 98230 00000',
        manager: member.manager || auth.user.name || 'Shon Kapate',
        skills: Array.isArray(member.skills) && member.skills.length > 0 ? member.skills : ['Engineering'],
        joinDate: member.joinDate || new Date().toISOString().split('T')[0],
        status: member.status || 'Active',
        projectsCount: member.projectsCount ?? 0,
        utilization: member.utilization ?? 100,
        kapateId: member.kapateId
      });

      // 2. Immediate Post-Insert Verification (Acceptance Criterion 7)
      const verifiedRecord = dataStore.getEmployeeById(createdEmployee.id);
      if (!verifiedRecord) {
        return NextResponse.json(
          { success: false, error: 'Database verification failed: record was not persisted.' },
          { status: 500 }
        );
      }

      // 3. Auto-provision linked user authentication account (Acceptance Criterion 16)
      try {
        const userEmail = verifiedRecord.internalEmail || verifiedRecord.email;
        const existingUser = dataStore.getUserByEmail(userEmail);
        if (!existingUser) {
          dataStore.addUser({
            name: verifiedRecord.name,
            email: userEmail,
            role: 'EMPLOYEE',
            designation: verifiedRecord.role,
            department: verifiedRecord.department,
            kapateId: verifiedRecord.kapateId,
            internalEmail: verifiedRecord.internalEmail,
            status: 'ACTIVE',
            phone: verifiedRecord.phone,
            manager: verifiedRecord.manager,
            passwordHash: hashPassword('KapateOS@2026')
          });
        }
      } catch (userErr) {
        console.warn('[Workforce Team] User account provisioning notice:', userErr);
      }

      // 4. Return database verified record
      return NextResponse.json({
        success: true,
        data: verifiedRecord,
        message: `Employee ${verifiedRecord.name} (${verifiedRecord.kapateId}) persisted successfully.`
      }, { status: 201 });
    }

    if (type === 'intern') {
      const kapateId = member.kapateId || dataStore.generateNextKapateId('INT');
      const cleanName = member.name.trim();
      const baseName = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.');
      const internalEmail = member.internalEmail || `${baseName}@kapateconsultancy.in`;

      const newIntern: Intern = {
        id: member.id || `int-${Date.now()}`,
        name: cleanName,
        role: member.role || 'Research & Engineering Intern',
        college: member.college || 'Engineering Institute Partner',
        mentor: member.mentor || auth.user.name || 'Shon Kapate',
        startDate: member.startDate || new Date().toISOString().split('T')[0],
        endDate: member.endDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
        status: member.status || 'Active',
        email: member.email || internalEmail,
        tasksCompleted: 0,
        tasksPending: 0,
        loggedHours: 0,
        attendancePct: 100,
        trainingProgress: 0,
        mentorFeedback: 'Intern successfully onboarded into Kapate OS mentorship track.',
        evaluations: {
          technicalSkills: 80,
          problemSolving: 80,
          communication: 85,
          teamwork: 85,
          learning: 90,
          taskCompletion: 80,
        },
        kapateId,
        internalEmail,
      };

      const store = (dataStore as any).loadStore();
      store.interns = store.interns || [];
      store.interns.unshift(newIntern);
      (dataStore as any).saveStore();

      return NextResponse.json({ success: true, data: newIntern }, { status: 201 });
    }

    return NextResponse.json({ success: false, error: 'Invalid member type' }, { status: 400 });
  } catch (err: any) {
    console.error('[Workforce POST Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create team member record' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: 'Member ID is required' }, { status: 400 });
  }

  try {
    const success = dataStore.deleteEmployee(id, true);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Employee not found.' }, { status: 404 });
    }

    dataStore.addAuditLog({
      actor: auth.user.name,
      actorKapateId: auth.user.kapateId,
      action: 'EMPLOYEE_DELETED',
      module: 'workforce',
      targetResource: `employees/${id}`,
      result: 'SUCCESS',
      reason: 'Admin soft-deleted employee record'
    });

    return NextResponse.json({ success: true, message: 'Employee record successfully archived.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
