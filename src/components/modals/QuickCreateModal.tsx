"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../store/demoStore';
import { X, Plus, UserPlus, Building, FolderPlus, CheckSquare, Users } from 'lucide-react';

export const QuickCreateModal: React.FC = () => {
  const isOpen = useDemoStore((state) => state.isQuickCreateOpen);
  const setOpen = useDemoStore((state) => state.setQuickCreateOpen);
  const addLead = useDemoStore((state) => state.addLead);
  const addCompany = useDemoStore((state) => state.addCompany);
  const addProject = useDemoStore((state) => state.addProject);
  const addTask = useDemoStore((state) => state.addTask);
  const addEmployee = useDemoStore((state) => state.addEmployee);
  const employees = useDemoStore((state) => state.employees);
  const projects = useDemoStore((state) => state.projects);

  const [activeType, setActiveType] = useState<'lead' | 'company' | 'project' | 'task' | 'employee'>('employee');

  // Lead fields
  const [leadName, setLeadName] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadService, setLeadService] = useState('AI Solutions');
  const [leadBudget, setLeadBudget] = useState('₹10,00,000');

  // Task fields
  const [taskTitle, setTaskTitle] = useState('');
  const [taskProject, setTaskProject] = useState(projects[0]?.name || 'General Operations');
  const [taskAssigned, setTaskAssigned] = useState(employees[0]?.name || 'Shon Kapate');
  const [taskPriority, setTaskPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('High');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskHours, setTaskHours] = useState(8);
  const [taskClientVisible, setTaskClientVisible] = useState(false);

  // Project fields
  const [projectName, setProjectName] = useState('');
  const [projectClient, setProjectClient] = useState('');
  const [projectBudget, setProjectBudget] = useState(0);

  // Employee fields
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empRole, setEmpRole] = useState('Senior AI/ML Engineer');
  const [empDepartment, setEmpDepartment] = useState('AI & Engineering Solutions');
  const [empSkills, setEmpSkills] = useState('Python, PyTorch, LangChain, Next.js');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, setOpen]);

  React.useEffect(() => {
    if (projects.length > 0 && (!taskProject || taskProject === 'General Operations')) {
      setTaskProject(projects[0].name);
    }
  }, [projects, taskProject]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeType === 'employee') {
      const skillsArray = empSkills.split(',').map((s) => s.trim()).filter(Boolean);
      try {
        await addEmployee({
          name: empName || 'New Team Member',
          email: empEmail || `${(empName || 'employee').toLowerCase().replace(/\s+/g, '.')}@kapateconsultancy.in`,
          role: empRole,
          department: empDepartment,
          phone: '+91 98765 43210',
          manager: 'Priya Sharma',
          skills: skillsArray.length > 0 ? skillsArray : ['AI', 'Python', 'Full Stack'],
        });
        setOpen(false);
        setEmpName('');
        setEmpEmail('');
      } catch {
        // Error handled with toast
      }
    } else if (activeType === 'task') {
      const selectedProj = projects.find((p) => p.name === taskProject) || projects[0];
      const isClient = taskAssigned.includes('Client');
      const isManager = taskAssigned.includes('Manager') || taskAssigned.includes('Shon');
      await addTask({
        title: taskTitle || 'New Development Task',
        projectId: selectedProj?.id || 'PRJ-001',
        projectName: selectedProj?.name || taskProject,
        assignedTo: taskAssigned,
        priority: taskPriority,
        status: 'TODO',
        dueDate: taskDueDate || '2026-09-30',
        estimatedHours: Number(taskHours) || 16,
        description: `Task assigned to ${taskAssigned} under ${selectedProj?.name || taskProject}`,
        clientVisible: isClient || taskClientVisible,
        assigneeRole: isManager ? 'MANAGER' : isClient ? 'CLIENT' : 'EMPLOYEE'
      });
      setTaskTitle('');
    } else if (activeType === 'lead') {
      await addLead({
        name: leadName || 'New Lead Contact',
        company: leadCompany || 'Enterprise Lead Corp',
        service: leadService,
        budget: leadBudget,
        source: 'Website Contact',
        owner: 'Shon Kapate',
        status: 'New Lead',
        score: 85,
        description: 'Lead submitted via quick create modal',
        email: 'contact@enterpriselead.com',
        phone: '+91 98000 11223',
        nextFollowUp: new Date().toISOString().split('T')[0],
      });
      setLeadName('');
      setLeadCompany('');
    } else if (activeType === 'project') {
      await addProject({
        name: projectName || 'New AI Solution Project',
        client: projectClient || 'Enterprise Client',
        manager: 'Rahul Deshmukh',
        budget: Number(projectBudget) || 1000000,
        deadline: '2026-12-31',
        description: 'Project initialized via quick create',
        team: ['Amit Patil', 'Rahul Deshmukh', 'Sneha Joshi'],
      });
      setProjectName('');
      setProjectClient('');
      setProjectBudget(0);
    } else if (activeType === 'company') {
      await addCompany({
        name: leadCompany || 'New Client Company Ltd',
        industry: 'Technology & AI',
        website: 'https://example.com',
        location: 'Mumbai',
      });
      setLeadCompany('');
    }

    setOpen(false);
  };

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in text-slate-900"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Quick Create & Assign</h3>
              <p className="text-[11px] text-slate-500">Onboard employees, assign tasks, or create projects</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Entity Type Selector Tabs */}
        <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto custom-scrollbar">
          {[
            { id: 'employee', label: 'Employee ID', icon: Users },
            { id: 'task', label: 'Assign Task', icon: CheckSquare },
            { id: 'project', label: 'Project', icon: FolderPlus },
            { id: 'lead', label: 'Lead', icon: UserPlus },
            { id: 'company', label: 'Company', icon: Building },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveType(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeType === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* EMPLOYEE ONBOARDING FORM */}
          {activeType === 'employee' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Employee Full Name</label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="e.g., Vikram Sharma"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company Email</label>
                  <input
                    type="email"
                    required
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    placeholder="vikram@kapateconsultancy.in"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Designation</label>
                  <input
                    type="text"
                    required
                    value={empRole}
                    onChange={(e) => setEmpRole(e.target.value)}
                    placeholder="e.g., Senior AI Engineer"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={empDepartment}
                  onChange={(e) => setEmpDepartment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="AI & Engineering Solutions">AI & Engineering Solutions</option>
                  <option value="Data Science & ML Practice">Data Science & ML Practice</option>
                  <option value="Cloud Infrastructure & DevOps">Cloud Infrastructure & DevOps</option>
                  <option value="Consulting & Delivery Practice">Consulting & Delivery Practice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Technical Skills (Comma separated)</label>
                <input
                  type="text"
                  value={empSkills}
                  onChange={(e) => setEmpSkills(e.target.value)}
                  placeholder="Python, PyTorch, Docker, React, Next.js"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800">
                💡 <strong>Auto ID Generation:</strong> A unique Employee ID (e.g. <span className="font-mono font-bold">EMP-{employees.length + 101}</span>) will be assigned and the employee can immediately sign in with their authorized company credentials!
              </div>
            </>
          )}

          {/* TASK ASSIGNMENT FORM */}
          {activeType === 'task' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g., Implement Hybrid Search Vector Store on AWS"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Project</label>
                <select
                  value={taskProject}
                  onChange={(e) => setTaskProject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({p.client})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assign to</label>
                  <select
                    value={taskAssigned}
                    onChange={(e) => {
                      setTaskAssigned(e.target.value);
                      if (e.target.value.includes('Client')) {
                        setTaskClientVisible(true);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                  >
                    <optgroup label="Managers & PMs">
                      <option value="Shon Kapate (Manager)">Shon Kapate (Manager / Founder)</option>
                      <option value="Delivery Manager">Delivery Manager (Lead PM)</option>
                    </optgroup>
                    <optgroup label="Client Contacts">
                      <option value="Enterprise Client">Enterprise Client (Client Sign-Off)</option>
                    </optgroup>
                    <optgroup label="Engineering Team">
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.name}>
                          {emp.name} — {emp.role}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="taskClientVisible"
                  checked={taskClientVisible}
                  onChange={(e) => setTaskClientVisible(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="taskClientVisible" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Visible in Client Portal (Requires Client Review or Action)
                </label>
              </div>


              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    value={taskHours}
                    onChange={(e) => setTaskHours(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </>
          )}

          {/* PROJECT FORM */}
          {activeType === 'project' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Automated Document Extraction System"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client Company</label>
                  <input
                    type="text"
                    value={projectClient}
                    onChange={(e) => setProjectClient(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Budget (INR)</label>
                  <input
                    type="number"
                    value={projectBudget}
                    onChange={(e) => setProjectBudget(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </>
          )}

          {/* LEAD FORM */}
          {activeType === 'lead' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Name</label>
                <input
                  type="text"
                  required
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="e.g., Rajesh Mehta"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={leadCompany}
                  onChange={(e) => setLeadCompany(e.target.value)}
                  placeholder="e.g., FinTech Innovations Ltd"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Service Required</label>
                  <select
                    value={leadService}
                    onChange={(e) => setLeadService(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="AI Solutions">AI Solutions</option>
                    <option value="Machine Learning">Machine Learning</option>
                    <option value="Custom Software">Custom Software</option>
                    <option value="Data Engineering">Data Engineering</option>
                    <option value="Automation">Automation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Budget</label>
                  <input
                    type="text"
                    value={leadBudget}
                    onChange={(e) => setLeadBudget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </>
          )}

          {/* COMPANY FORM */}
          {activeType === 'company' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                required
                value={leadCompany}
                onChange={(e) => setLeadCompany(e.target.value)}
                placeholder="e.g., Global Data Systems"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-all"
            >
              {activeType === 'employee' ? 'Create Employee & Issue ID' : activeType === 'task' ? 'Assign Task' : 'Save Record'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
