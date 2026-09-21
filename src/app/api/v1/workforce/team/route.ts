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
  let interns = dataStore.getInterns();
  let freelancers = dataStore.getFreelancers();

  if (search) {
    employees = employees.filter(e =>
      e.name.toLowerCase().includes(search) ||
      e.email.toLowerCase().includes(search) ||
      (e.kapateId && e.kapateId.toLowerCase().includes(search)) ||
      (e.role && e.role.toLowerCase().includes(search)) ||
      (e.department && e.department.toLowerCase().includes(search))
    );
    interns = interns.filter(i =>
      i.name.toLowerCase().includes(search) ||
      i.email.toLowerCase().includes(search) ||
      (i.kapateId && i.kapateId.toLowerCase().includes(search)) ||
      (i.college && i.college.toLowerCase().includes(search))
    );
    freelancers = freelancers.filter(f =>
      f.name.toLowerCase().includes(search) ||
      (f.skill && f.skill.toLowerCase().includes(search)) ||
      (f.kapateId && f.kapateId.toLowerCase().includes(search))
    );
  }

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
    totalEmployees: employees.length,
    totalInterns: interns.length,
    totalFreelancers: freelancers.length,
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
        { success: false, error: 'Member name is required.' },
        { status: 400 }
      );
    }

    if (type === 'employee') {
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

      // Immediate Post-Insert Verification
      const verifiedRecord = dataStore.getEmployeeById(createdEmployee.id);
      if (!verifiedRecord) {
        return NextResponse.json(
          { success: false, error: 'Database verification failed: record was not persisted.' },
          { status: 500 }
        );
      }

      // Auto-provision linked user authentication account
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

      return NextResponse.json({
        success: true,
        data: verifiedRecord,
        message: `Employee ${verifiedRecord.name} (${verifiedRecord.kapateId}) persisted successfully.`
      }, { status: 201 });
    }

    if (type === 'intern') {
      const createdIntern = dataStore.addIntern({
        id: member.id,
        name: member.name.trim(),
        role: member.role || 'Research & Engineering Intern',
        college: member.college || 'Engineering Partner Institute',
        mentor: member.mentor || auth.user.name || 'Shon Kapate',
        startDate: member.startDate || new Date().toISOString().split('T')[0],
        endDate: member.endDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
        status: member.status || 'Active',
        email: member.email,
        kapateId: member.kapateId,
      });

      return NextResponse.json({ success: true, data: createdIntern }, { status: 201 });
    }

    if (type === 'freelancer') {
      const createdFreelancer = dataStore.addFreelancer({
        id: member.id,
        name: member.name.trim(),
        skill: member.skill || member.role || 'Consultant Specialist',
        hourlyRate: member.hourlyRate || member.rate || '₹3,000/hr',
        availability: member.availability || 'Full-time (Contract)',
        status: member.status || 'Active',
        projects: Array.isArray(member.projects) ? member.projects : [],
        kapateId: member.kapateId,
        internalEmail: member.internalEmail
      });

      return NextResponse.json({ success: true, data: createdFreelancer }, { status: 201 });
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

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { id, type = 'employee', ...patch } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Member ID is required.' }, { status: 400 });
    }

    if (type === 'intern') {
      const updated = dataStore.updateIntern(id, patch);
      if (!updated) return NextResponse.json({ success: false, error: 'Intern not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: updated });
    }

    if (type === 'freelancer') {
      const updated = dataStore.updateFreelancer(id, patch);
      if (!updated) return NextResponse.json({ success: false, error: 'Freelancer not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: updated });
    }

    // Default: employee
    const updated = dataStore.updateEmployee(id, patch);
    if (!updated) return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN']);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const type = searchParams.get('type') || 'employee';

  if (!id) {
    return NextResponse.json({ success: false, error: 'Member ID is required' }, { status: 400 });
  }

  try {
    if (type === 'intern') {
      const success = dataStore.deleteIntern(id);
      if (!success) return NextResponse.json({ success: false, error: 'Intern not found.' }, { status: 404 });
      return NextResponse.json({ success: true, message: 'Intern deleted successfully.' });
    }

    if (type === 'freelancer') {
      const success = dataStore.deleteFreelancer(id);
      if (!success) return NextResponse.json({ success: false, error: 'Freelancer not found.' }, { status: 404 });
      return NextResponse.json({ success: true, message: 'Freelancer deleted successfully.' });
    }

    const permanent = searchParams.get('permanent') === 'true';
    const success = dataStore.deleteEmployee(id, !permanent);
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
