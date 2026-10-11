'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import { usePermissions } from '../../../hooks/usePermissions';
import { ColumnDef, DataTable } from '../../../components/ui/DataTable';
import {
  Calendar,
  Check,
  Clock,
  GraduationCap,
  Plus,
  ShieldAlert,
  Timer,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

export default function PeopleWorkspacePage() {
  const queryClient = useQueryClient();
  const { can, user } = usePermissions();
  const [activeTab, setActiveTab] = useState<'employees' | 'interns' | 'attendance' | 'leaves'>('employees');

  // 1. Fetch Employees
  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['workforce', 'employees'],
    queryFn: async () => {
      const { data } = await apiClient.get('/workforce/employees');
      return data;
    },
    enabled: can('hr.employee.read'),
  });

  // 2. Fetch Interns
  const { data: interns = [], isLoading: loadingInterns } = useQuery({
    queryKey: ['workforce', 'interns'],
    queryFn: async () => {
      const { data } = await apiClient.get('/workforce/interns');
      return data;
    },
    enabled: can('hr.employee.read'),
  });

  // 3. Fetch Attendance Logs
  const { data: attendanceLogs = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ['workforce', 'attendance'],
    queryFn: async () => {
      const { data } = await apiClient.get('/workforce/attendance');
      return data;
    },
    enabled: can('hr.attendance.manage'),
  });

  // 4. Fetch Leaves
  const { data: leaveRequests = [], isLoading: loadingLeaves } = useQuery({
    queryKey: ['workforce', 'leaves'],
    queryFn: async () => {
      const { data } = await apiClient.get('/workforce/leaves');
      return data;
    },
  });

  // Mutations: Clock In / Clock Out
  const clockInMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/workforce/attendance/clock-in');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workforce', 'attendance'] });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/workforce/attendance/clock-out');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workforce', 'attendance'] });
    },
  });

  // Mutation: Approve/Reject Leave
  const updateLeaveStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) => {
      const { data } = await apiClient.patch(`/workforce/leaves/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workforce', 'leaves'] });
    },
  });

  // Table Columns Definition
  const employeeColumns: ColumnDef<any>[] = [
    { key: 'employee_code', header: 'Code', sortable: true },
    { key: 'full_name', header: 'Full Name', sortable: true },
    { key: 'job_title', header: 'Job Title', sortable: true },
    { key: 'department_name', header: 'Department' },
    {
      key: 'employment_type',
      header: 'Type',
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">
          {row.employment_type}
        </span>
      ),
    },
    { key: 'joined_date', header: 'Joined Date', sortable: true },
  ];

  const internColumns: ColumnDef<any>[] = [
    { key: 'intern_name', header: 'Intern Name', sortable: true },
    { key: 'university', header: 'University' },
    { key: 'mentor_name', header: 'Assigned Mentor' },
    { key: 'internship_end_date', header: 'Graduation / End Date', sortable: true },
    {
      key: 'certificate_issued',
      header: 'Certificate',
      render: (row) =>
        row.certificate_issued ? (
          <span className="text-emerald-700 font-semibold">Issued</span>
        ) : (
          <span className="text-slate-500">In Training</span>
        ),
    },
  ];

  const attendanceColumns: ColumnDef<any>[] = [
    { key: 'employee_name', header: 'Staff Member', sortable: true },
    { key: 'work_date', header: 'Date', sortable: true },
    {
      key: 'clock_in',
      header: 'Clock In',
      render: (row) => (row.clock_in ? new Date(row.clock_in).toLocaleTimeString() : '—'),
    },
    {
      key: 'clock_out',
      header: 'Clock Out',
      render: (row) => (row.clock_out ? new Date(row.clock_out).toLocaleTimeString() : 'Active'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          {row.status}
        </span>
      ),
    },
  ];

  const leaveColumns: ColumnDef<any>[] = [
    { key: 'employee_name', header: 'Applicant', sortable: true },
    { key: 'leave_type', header: 'Type' },
    { key: 'start_date', header: 'Start Date' },
    { key: 'end_date', header: 'End Date' },
    { key: 'total_days', header: 'Days' },
    { key: 'reason', header: 'Reason' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const color =
          row.status === 'APPROVED'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : row.status === 'REJECTED'
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : 'bg-amber-50 text-amber-700 border-amber-200';
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border ${color}`}>
            {row.status}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => {
        if (!can('hr.attendance.manage') || row.status !== 'PENDING') return null;
        return (
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => updateLeaveStatusMutation.mutate({ id: row.id, status: 'APPROVED' })}
              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer transition-colors"
              title="Approve"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => updateLeaveStatusMutation.mutate({ id: row.id, status: 'REJECTED' })}
              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer transition-colors"
              title="Reject"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            People & Workforce Workspace
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Enterprise human resources, mentorship tracking, and attendance registry
          </p>
        </div>

        {/* Quick Clock-in Widget */}
        <div className="flex items-center space-x-2 bg-white border border-slate-200 p-2 rounded-2xl shadow-xs">
          <Timer className="w-4 h-4 text-emerald-600 ml-1" />
          <span className="text-xs text-slate-700 font-medium">Daily Clock:</span>
          <button
            onClick={() => clockInMutation.mutate()}
            disabled={clockInMutation.isPending}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Clock In
          </button>
          <button
            onClick={() => clockOutMutation.mutate()}
            disabled={clockOutMutation.isPending}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Clock Out
          </button>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'employees'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Employees ({employees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('interns')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'interns'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Intern Learning Hub ({interns.length})</span>
        </button>

        {can('hr.attendance.manage') && (
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Attendance Logs</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('leaves')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'leaves'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Leave Requests ({leaveRequests.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'employees' && (
        <DataTable
          data={employees}
          columns={employeeColumns}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Search employees by name, title, code..."
          searchableKeys={['full_name', 'job_title', 'employee_code', 'department_name']}
          isLoading={loadingEmployees}
        />
      )}

      {activeTab === 'interns' && (
        <DataTable
          data={interns}
          columns={internColumns}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Search intern directory..."
          searchableKeys={['intern_name', 'university', 'mentor_name']}
          isLoading={loadingInterns}
        />
      )}

      {activeTab === 'attendance' && (
        <DataTable
          data={attendanceLogs}
          columns={attendanceColumns}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Search attendance records..."
          searchableKeys={['employee_name', 'work_date', 'status']}
          isLoading={loadingAttendance}
        />
      )}

      {activeTab === 'leaves' && (
        <DataTable
          data={leaveRequests}
          columns={leaveColumns}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Search leave requests..."
          searchableKeys={['employee_name', 'leave_type', 'status', 'reason']}
          isLoading={loadingLeaves}
        />
      )}
    </div>
  );
}
