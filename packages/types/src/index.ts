export type UUID = string;

export type SystemRole =
  | 'super_admin'
  | 'org_admin'
  | 'project_manager'
  | 'staff_engineer'
  | 'intern'
  | 'finance_officer'
  | 'client_user';

export type PermissionCode =
  // Organization
  | 'organization.read'
  | 'organization.update'
  | 'organization.delete'
  | 'audit.read'
  | 'system.config.manage'
  // Users & Roles
  | 'user.create'
  | 'user.read'
  | 'user.update'
  | 'user.delete'
  | 'role.create'
  | 'role.read'
  | 'role.update'
  | 'role.delete'
  | 'permission.read'
  | 'permission.assign'
  // CRM
  | 'crm.account.create'
  | 'crm.account.read'
  | 'crm.account.update'
  | 'crm.account.delete'
  | 'crm.lead.create'
  | 'crm.lead.read'
  | 'crm.lead.update'
  | 'crm.lead.delete'
  | 'crm.deal.create'
  | 'crm.deal.read'
  | 'crm.deal.update'
  | 'crm.deal.delete'
  | 'crm.proposal.generate'
  | 'crm.proposal.approve'
  | 'crm.contract.sign'
  // Projects
  | 'project.create'
  | 'project.read'
  | 'project.update'
  | 'project.delete'
  | 'project.milestone.manage'
  | 'project.sprint.manage'
  | 'task.create'
  | 'task.read'
  | 'task.update'
  | 'task.delete'
  | 'task.assign'
  // Workforce
  | 'hr.employee.create'
  | 'hr.employee.read'
  | 'hr.employee.update'
  | 'hr.employee.delete'
  | 'hr.timesheet.log'
  | 'hr.timesheet.approve'
  | 'hr.attendance.manage'
  | 'hr.intern.evaluate'
  | 'hr.certificate.issue'
  // Finance
  | 'finance.invoice.create'
  | 'finance.invoice.read'
  | 'finance.invoice.update'
  | 'finance.invoice.approve'
  | 'finance.payment.record'
  | 'finance.margin.view'
  | 'finance.payroll.view'
  // Documents
  | 'document.upload'
  | 'document.read'
  | 'document.delete';

export interface UserSession {
  userId: UUID;
  email: string;
  fullName: string;
  organizationId: UUID;
  roles: SystemRole[] | string[];
  permissions: PermissionCode[] | string[];
}

export interface OrganizationInfo {
  id: UUID;
  slug: string;
  name: string;
  legalName?: string | null;
  taxId?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserSession;
}

export interface ApiProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code?: string;
  requestId?: string;
  timestamp?: string;
}
