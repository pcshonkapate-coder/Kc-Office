# Kapate OS - Role-Based Access Control (RBAC) Matrix

## 1. Overview
Access control in Kapate OS enforces the principle of least privilege. Users are assigned one or more **Roles**, and each Role aggregates granular **Permissions**.

---

## 2. Standard System Roles

| Role Identifier | Description | Target Users |
| :--- | :--- | :--- |
| `superadmin` | Unrestricted platform control across all company data, configs, and audit logs. | Founders & Principal Partners |
| `partner` | Senior executive access: all CRM, high-level financials, contracts, and proposals. | Managing Partners, Practice Leads |
| `consultant` | Senior technical advisory: deal proposals, assigned client projects, timesheets. | Senior Consultants, Architects |
| `engineer` | Execution role: assigned project tasks, code repos, timesheet logging. | Full-Stack, AI, & Cloud Engineers |
| `intern` | Learning role: assigned training tasks, timesheet submission, attendance. | Engineering & Data Science Interns |
| `freelancer` | External specialist: scoped project tasks and contractor invoice submissions. | Contract Specialists |
| `client` | Client Portal: read-only access to their specific project milestones and invoices. | External Client Sponsors |

---

## 3. Permission Mapping Matrix

| Permission Code | Module | `superadmin` | `partner` | `consultant` | `engineer` | `intern` | `freelancer` | `client` |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `crm:leads:read` | CRM | ✓ | ✓ | ✓ | - | - | - | - |
| `crm:leads:write` | CRM | ✓ | ✓ | - | - | - | - | - |
| `crm:deals:read` | CRM | ✓ | ✓ | ✓ | - | - | - | - |
| `crm:deals:write` | CRM | ✓ | ✓ | - | - | - | - | - |
| `crm:contracts:sign` | CRM | ✓ | ✓ | - | - | - | - | - |
| `workforce:directory:read`| Workforce | ✓ | ✓ | ✓ | ✓ | ✓ | - | - |
| `workforce:timesheets:submit` | Workforce | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| `workforce:timesheets:approve`| Workforce | ✓ | ✓ | ✓ | - | - | - | - |
| `projects:read` | Delivery | ✓ | ✓ | ✓ (Assigned) | ✓ (Assigned) | ✓ (Assigned) | ✓ (Assigned) | ✓ (Own) |
| `projects:manage` | Delivery | ✓ | ✓ | ✓ | - | - | - | - |
| `tasks:update` | Delivery | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| `finance:invoices:read` | Finance | ✓ | ✓ | - | - | - | - | ✓ (Own) |
| `finance:invoices:create` | Finance | ✓ | ✓ | - | - | - | - | - |
| `finance:expenses:submit` | Finance | ✓ | ✓ | ✓ | ✓ | - | ✓ | - |
| `system:audit:read` | System | ✓ | - | - | - | - | - | - |
| `system:users:manage` | System | ✓ | - | - | - | - | - | - |
