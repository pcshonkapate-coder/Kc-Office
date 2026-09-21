import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getCloudCollection } from '@/lib/mongodb';
import { EmailAccount } from '@/types';

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const accountsColl = await getCloudCollection<EmailAccount>('email_accounts');
    let accounts = await accountsColl.find({}).toArray();

    if (!accounts || accounts.length === 0) {
      // Seed default corporate accounts if empty
      const defaultAccounts: EmailAccount[] = [
        {
          id: 'acc-shon',
          userId: 'usr-admin',
          email: 'shon@kapateconsultancy.in',
          name: 'Shon Kapate',
          designation: 'Founder & Technology Consultant',
          department: 'Executive Leadership',
          avatar: 'SK',
          isShared: false,
          quotaUsedMB: 0,
          quotaTotalMB: 10240
        },
        {
          id: 'acc-dept-admin',
          userId: 'dept-admin',
          email: 'admin@kapateconsultancy.in',
          name: 'Executive Office Mailbox',
          designation: 'System & Corporate Communications',
          department: 'Operations',
          avatar: 'AD',
          isShared: true,
          allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
          quotaUsedMB: 0,
          quotaTotalMB: 20480
        },
        {
          id: 'acc-dept-hr',
          userId: 'dept-hr',
          email: 'hr@kapateconsultancy.in',
          name: 'HR Operations Desk',
          designation: 'Shared Department Mailbox',
          department: 'Human Resources',
          avatar: 'HR',
          isShared: true,
          allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'PROJECT_MANAGER'],
          quotaUsedMB: 0,
          quotaTotalMB: 20480
        },
        {
          id: 'acc-dept-finance',
          userId: 'dept-fin',
          email: 'finance@kapateconsultancy.in',
          name: 'Finance & Accounts Desk',
          designation: 'Shared Billing Mailbox',
          department: 'Finance',
          avatar: 'FD',
          isShared: true,
          allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'FINANCE'],
          quotaUsedMB: 0,
          quotaTotalMB: 20480
        },
        {
          id: 'acc-dept-sales',
          userId: 'dept-sales',
          email: 'sales@kapateconsultancy.in',
          name: 'Enterprise Sales Desk',
          designation: 'Shared CRM Pipeline Mailbox',
          department: 'Business Development',
          avatar: 'SD',
          isShared: true,
          allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'PROJECT_MANAGER'],
          quotaUsedMB: 0,
          quotaTotalMB: 20480
        }
      ];

      await accountsColl.insertMany(defaultAccounts as any);
      accounts = defaultAccounts as any;
    }

    // Filter accessible accounts for user's role
    const userRole = auth.user.role;
    const isSuper = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

    const accessible = accounts.filter(acc => {
      if (!acc.isShared) {
        return acc.email.toLowerCase() === auth.user.email.toLowerCase() || isSuper;
      }
      if (isSuper) return true;
      return acc.allowedRoles?.includes(userRole);
    });

    return NextResponse.json({ success: true, accounts: accessible });
  } catch (err: any) {
    console.warn('[Mail Accounts] MongoDB Atlas unreachable, returning default corporate accounts fallback:', err.message);
    const fallbackAccounts: EmailAccount[] = [
      {
        id: 'acc-shon',
        userId: 'usr-admin',
        email: 'shon@kapateconsultancy.in',
        name: 'Shon Kapate',
        designation: 'Founder & Technology Consultant',
        department: 'Executive Leadership',
        avatar: 'SK',
        isShared: false,
        quotaUsedMB: 0,
        quotaTotalMB: 10240
      },
      {
        id: 'acc-dept-admin',
        userId: 'dept-admin',
        email: 'admin@kapateconsultancy.in',
        name: 'Executive Office Mailbox',
        designation: 'System & Corporate Communications',
        department: 'Operations',
        avatar: 'AD',
        isShared: true,
        allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
        quotaUsedMB: 0,
        quotaTotalMB: 20480
      },
      {
        id: 'acc-dept-hr',
        userId: 'dept-hr',
        email: 'hr@kapateconsultancy.in',
        name: 'HR Operations Desk',
        designation: 'Shared Department Mailbox',
        department: 'Human Resources',
        avatar: 'HR',
        isShared: true,
        allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'PROJECT_MANAGER'],
        quotaUsedMB: 0,
        quotaTotalMB: 20480
      },
      {
        id: 'acc-dept-finance',
        userId: 'dept-fin',
        email: 'finance@kapateconsultancy.in',
        name: 'Finance & Accounts Desk',
        designation: 'Shared Billing Mailbox',
        department: 'Finance',
        avatar: 'FD',
        isShared: true,
        allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'FINANCE'],
        quotaUsedMB: 0,
        quotaTotalMB: 20480
      },
      {
        id: 'acc-dept-sales',
        userId: 'dept-sales',
        email: 'sales@kapateconsultancy.in',
        name: 'Enterprise Sales Desk',
        designation: 'Shared CRM Pipeline Mailbox',
        department: 'Business Development',
        avatar: 'SD',
        isShared: true,
        allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'PROJECT_MANAGER'],
        quotaUsedMB: 0,
        quotaTotalMB: 20480
      }
    ];

    const userRole = auth.user.role;
    const isSuper = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
    const accessible = fallbackAccounts.filter(acc => {
      if (!acc.isShared) {
        return acc.email.toLowerCase() === auth.user.email.toLowerCase() || isSuper;
      }
      if (isSuper) return true;
      return acc.allowedRoles?.includes(userRole);
    });

    return NextResponse.json({ success: true, accounts: accessible, source: 'local_resilient_fallback' });
  }
}
