const getBaseApiUrl = (): string => {
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return raw.endsWith("/api/v1") ? raw : `${raw.replace(/\/+$/, "")}/api/v1`;
};

export const API_BASE_URL = getBaseApiUrl();

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("kapate_access_token") : null;
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "Bearer demo_token",
  };
}

export function formatCurrencyINR(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) || 0 : amount;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(num);
}

// ==================== WORKFORCE TYPES & API ====================
export interface WorkforceMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  department_id?: string;
  type: "full_time" | "part_time" | "intern" | "freelancer";
  code: string;
  status: string;
  joined_date: string;
  mentor_name?: string;
  hourly_rate?: number;
  stipend_amount?: number;
  currency?: string;
  specialization?: string;
}

export interface WorkforceMetrics {
  total_headcount: number;
  full_time_count: number;
  interns_count: number;
  freelancers_count: number;
  departments_count: number;
  present_today: number;
  on_leave_today: number;
  timesheets_pending_approval: number;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  user_name?: string;
  date: string;
  check_in?: string;
  check_out?: string;
  status: "present" | "half_day" | "absent" | "holiday";
  notes?: string;
  created_at: string;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  user_name?: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  approved_by_user_id?: string;
  approved_by_name?: string;
  created_at: string;
}

export interface Timesheet {
  id: string;
  user_id: string;
  user_name?: string;
  project_id: string;
  project_name?: string;
  project_code?: string;
  task_id?: string;
  task_title?: string;
  date: string;
  hours_spent: number;
  is_billable: boolean;
  description: string;
  status: "submitted" | "approved" | "rejected";
  approved_by_user_id?: string;
  created_at: string;
}

export const workforceApi = {
  async getMetrics(): Promise<WorkforceMetrics> {
    const res = await fetch(`${API_BASE_URL}/workforce/metrics`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch workforce metrics");
    return res.json();
  },

  async getDirectory(params?: { search?: string; type?: string; dept_id?: string }): Promise<WorkforceMember[]> {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.type && params.type !== "all") q.set("type", params.type);
    if (params?.dept_id) q.set("dept_id", params.dept_id);

    const res = await fetch(`${API_BASE_URL}/workforce/directory?${q.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch workforce directory");
    return res.json();
  },

  async createEmployee(data: any): Promise<WorkforceMember> {
    const res = await fetch(`${API_BASE_URL}/workforce/employees`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create employee");
    return res.json();
  },

  async createIntern(data: any): Promise<WorkforceMember> {
    const res = await fetch(`${API_BASE_URL}/workforce/interns`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create intern");
    return res.json();
  },

  async createFreelancer(data: any): Promise<WorkforceMember> {
    const res = await fetch(`${API_BASE_URL}/workforce/freelancers`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create freelancer");
    return res.json();
  },

  async getAttendance(params?: { target_date?: string; user_id?: string }): Promise<AttendanceRecord[]> {
    const q = new URLSearchParams();
    if (params?.target_date) q.set("target_date", params.target_date);
    if (params?.user_id) q.set("user_id", params.user_id);

    const res = await fetch(`${API_BASE_URL}/workforce/attendance?${q.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch attendance");
    return res.json();
  },

  async checkIn(notes?: string): Promise<AttendanceRecord> {
    const res = await fetch(`${API_BASE_URL}/workforce/attendance/check-in`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ notes }),
    });
    if (!res.ok) throw new Error("Failed to check in");
    return res.json();
  },

  async checkOut(notes?: string): Promise<AttendanceRecord> {
    const res = await fetch(`${API_BASE_URL}/workforce/attendance/check-out`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ notes }),
    });
    if (!res.ok) throw new Error("Failed to check out");
    return res.json();
  },

  async getLeaveRequests(params?: { status?: string; user_id?: string }): Promise<LeaveRequest[]> {
    const q = new URLSearchParams();
    if (params?.status && params.status !== "ALL") q.set("status", params.status.toLowerCase());
    if (params?.user_id) q.set("user_id", params.user_id);

    const res = await fetch(`${API_BASE_URL}/workforce/leaves?${q.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch leaves");
    return res.json();
  },

  async submitLeaveRequest(data: { leave_type: string; start_date: string; end_date: string; reason: string }): Promise<LeaveRequest> {
    const res = await fetch(`${API_BASE_URL}/workforce/leaves`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to submit leave request");
    return res.json();
  },

  async updateLeaveStatus(leaveId: string, status: "approved" | "rejected"): Promise<LeaveRequest> {
    const res = await fetch(`${API_BASE_URL}/workforce/leaves/${leaveId}/status`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update leave status");
    return res.json();
  },

  async getTimesheets(params?: { project_id?: string; user_id?: string; status?: string }): Promise<Timesheet[]> {
    const q = new URLSearchParams();
    if (params?.project_id) q.set("project_id", params.project_id);
    if (params?.user_id) q.set("user_id", params.user_id);
    if (params?.status && params.status !== "ALL") q.set("status", params.status.toLowerCase());

    const res = await fetch(`${API_BASE_URL}/workforce/timesheets?${q.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch timesheets");
    return res.json();
  },

  async submitTimesheet(data: { project_id: string; task_id?: string; date: string; hours_spent: number; is_billable: boolean; description: string }): Promise<Timesheet> {
    const res = await fetch(`${API_BASE_URL}/workforce/timesheets`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to submit timesheet");
    return res.json();
  },

  async updateTimesheetStatus(tsId: string, status: "approved" | "rejected"): Promise<Timesheet> {
    const res = await fetch(`${API_BASE_URL}/workforce/timesheets/${tsId}/status`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update timesheet status");
    return res.json();
  },
};

// ==================== DELIVERY TYPES & API ====================
export interface ProjectItem {
  id: string;
  company_id: string;
  company_name?: string;
  project_code: string;
  name: string;
  description?: string;
  project_type: string;
  status: "discovery" | "active" | "on_hold" | "completed" | "archived";
  budget: number;
  currency: string;
  start_date?: string;
  end_date?: string;
  project_manager_id?: string;
  project_manager_name?: string;
  progress_percentage: number;
  spent_amount: number;
  team_count: number;
  open_tasks_count: number;
  completed_tasks_count: number;
  milestones_count: number;
  created_at: string;
}

export interface TaskItem {
  id: string;
  project_id: string;
  project_name?: string;
  project_code?: string;
  milestone_id?: string;
  milestone_title?: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "backlog" | "todo" | "in_progress" | "review" | "done";
  estimated_hours?: number;
  actual_hours: number;
  assigned_to_user_id?: string;
  assignee_name?: string;
  comments_count: number;
  subtasks_count: number;
  created_at: string;
}

export interface DeliveryMetrics {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  on_hold_projects: number;
  total_pipeline_delivery_value: number;
  open_tasks: number;
  completed_tasks: number;
  tasks_by_status: Record<string, number>;
}

export const deliveryApi = {
  async getMetrics(): Promise<DeliveryMetrics> {
    const res = await fetch(`${API_BASE_URL}/delivery/metrics`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch delivery metrics");
    return res.json();
  },

  async getProjects(params?: { search?: string; status?: string; company_id?: string }): Promise<ProjectItem[]> {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.status && params.status !== "all") q.set("status", params.status);
    if (params?.company_id) q.set("company_id", params.company_id);

    const res = await fetch(`${API_BASE_URL}/delivery/projects?${q.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch projects");
    return res.json();
  },

  async getProjectDetail(projectId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/delivery/projects/${projectId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch project detail");
    return res.json();
  },

  async createProject(data: any): Promise<ProjectItem> {
    const res = await fetch(`${API_BASE_URL}/delivery/projects`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create project");
    return res.json();
  },

  async getTasks(params?: { project_id?: string; status?: string; search?: string }): Promise<TaskItem[]> {
    const q = new URLSearchParams();
    if (params?.project_id) q.set("project_id", params.project_id);
    if (params?.status && params.status !== "all") q.set("status", params.status);
    if (params?.search) q.set("search", params.search);

    const res = await fetch(`${API_BASE_URL}/delivery/tasks?${q.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch tasks");
    return res.json();
  },

  async createTask(data: any): Promise<TaskItem> {
    const res = await fetch(`${API_BASE_URL}/delivery/tasks`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create task");
    return res.json();
  },

  async updateTaskStatus(taskId: string, status: string): Promise<TaskItem> {
    const res = await fetch(`${API_BASE_URL}/delivery/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update task status");
    return res.json();
  },

  async addTaskComment(taskId: string, commentText: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/delivery/tasks/${taskId}/comments`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ comment_text: commentText }),
    });
    if (!res.ok) throw new Error("Failed to add comment");
    return res.json();
  },
};

// ==================== FINANCE TYPES & API ====================
export interface InvoiceItem {
  id: string;
  company_id: string;
  company_name?: string;
  project_id: string;
  project_name?: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  created_at: string;
}

export interface ExpenseItem {
  id: string;
  project_id?: string;
  project_name?: string;
  user_id: string;
  user_name?: string;
  expense_category: string;
  amount: number;
  currency: string;
  receipt_url?: string;
  status: "submitted" | "approved" | "reimbursed";
  created_at: string;
}

export interface FinanceMetrics {
  total_revenue_paid: number;
  total_receivable_sent: number;
  total_overdue: number;
  total_expenses_approved: number;
  gross_margin_percentage: number;
  currency: string;
}

export const financeApi = {
  async getMetrics(): Promise<FinanceMetrics> {
    const res = await fetch(`${API_BASE_URL}/finance/metrics`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch finance metrics");
    return res.json();
  },

  async getInvoices(params?: { status?: string; company_id?: string; project_id?: string; search?: string }): Promise<InvoiceItem[]> {
    const q = new URLSearchParams();
    if (params?.status && params.status !== "all") q.set("status", params.status);
    if (params?.company_id) q.set("company_id", params.company_id);
    if (params?.project_id) q.set("project_id", params.project_id);
    if (params?.search) q.set("search", params.search);

    const res = await fetch(`${API_BASE_URL}/finance/invoices?${q.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch invoices");
    return res.json();
  },

  async createInvoice(data: any): Promise<InvoiceItem> {
    const res = await fetch(`${API_BASE_URL}/finance/invoices`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create invoice");
    return res.json();
  },

  async getExpenses(params?: { project_id?: string; status?: string; category?: string }): Promise<ExpenseItem[]> {
    const q = new URLSearchParams();
    if (params?.project_id) q.set("project_id", params.project_id);
    if (params?.status && params.status !== "all") q.set("status", params.status);
    if (params?.category) q.set("category", params.category);

    const res = await fetch(`${API_BASE_URL}/finance/expenses?${q.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to fetch expenses");
    return res.json();
  },

  async createExpense(data: any): Promise<ExpenseItem> {
    const res = await fetch(`${API_BASE_URL}/finance/expenses`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create expense");
    return res.json();
  },
};
