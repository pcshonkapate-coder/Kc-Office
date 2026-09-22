"use client";

import React, { useState } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import { EmailMessage, EmailAttachment, EmailRecipient } from '../../../types';
import {
  Star, Bookmark, Archive, Trash2, Reply, ReplyAll, Forward,
  Paperclip, Plus, CheckSquare, FolderKanban, FileText, Bot,
  Download, Sparkles, Send, Clock, ShieldCheck, ChevronDown,
  ChevronUp, AlertCircle, CheckCircle2,
  Edit3
} from 'lucide-react';

export const MailDetail: React.FC = () => {
  const currentUser = useDemoStore((state) => state.currentUser);
  const emailThreads = useDemoStore((state) => state.emailThreads);
  const selectedEmailThreadId = useDemoStore((state) => state.selectedEmailThreadId);
  const projects = useDemoStore((state) => state.projects);
  const activeEmailAccountEmail = useDemoStore((state) => state.activeEmailAccountEmail);
  const toggleStarThread = useDemoStore((state) => state.toggleStarThread);
  const toggleImportantThread = useDemoStore((state) => state.toggleImportantThread);
  const moveThreadToFolder = useDemoStore((state) => state.moveThreadToFolder);
  const markThreadRead = useDemoStore((state) => state.markThreadRead);
  const deleteDraft = useDemoStore((state) => state.deleteDraft);
  const linkEmailToProject = useDemoStore((state) => state.linkEmailToProject);
  const createTaskFromEmail = useDemoStore((state) => state.createTaskFromEmail);
  const saveEmailAttachmentToDocuments = useDemoStore((state) => state.saveEmailAttachmentToDocuments);
  const sendEmail = useDemoStore((state) => state.sendEmail);
  const setMailComposeOpen = useDemoStore((state) => state.setMailComposeOpen);
  const showToast = useDemoStore((state) => state.showToast);

  const [replyMode, setReplyMode] = useState<'REPLY' | 'REPLY_ALL' | 'FORWARD'>('REPLY');
  const [replyBody, setReplyBody] = useState('');
  const [forwardRecipientEmail, setForwardRecipientEmail] = useState('');
  const [expandedMessageIds, setExpandedMessageIds] = useState<string[]>([]);
  const [showTaskCreateModal, setShowTaskCreateModal] = useState(false);
  const [showProjectLinkModal, setShowProjectLinkModal] = useState(false);
  const [selectedProjectIdToLink, setSelectedProjectIdToLink] = useState(projects[0]?.id || '');
  
  // Task generation state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [taskAssignee, setTaskAssignee] = useState(currentUser.name);
  const [taskPriority, setTaskPriority] = useState<'Urgent' | 'High' | 'Medium' | 'Low'>('High');

  // AI Assistant State
  const [isAiSummarizing, setIsAiSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<{ summary: string; actionItems: string[] } | null>(null);

  const activeThread = emailThreads.find(t => t.id === selectedEmailThreadId);

  if (!activeThread) {
    return (
      <div className="flex-1 bg-slate-50/50 flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-700">No Conversation Selected</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Select an email thread from the message list to inspect conversation history, attachments, and project integrations.
        </p>
      </div>
    );
  }

  const isDraft = activeThread.folder === 'DRAFTS';
  const latestMessage = activeThread.messages[activeThread.messages.length - 1] || {
    id: 'msg-fallback',
    threadId: activeThread.id,
    from: activeThread.participants[0] || { name: 'Sender', email: 'sender@kapateconsultancy.in' },
    to: [],
    subject: activeThread.subject,
    body: activeThread.snippet,
    timestamp: activeThread.lastMessageTimestamp,
    date: '2026-09-18',
    folder: activeThread.folder,
    isRead: true,
    isStarred: false,
    isImportant: false,
    priority: activeThread.priority,
    labels: activeThread.labels,
    attachments: []
  };

  const toggleExpandMessage = (id: string) => {
    setExpandedMessageIds(prev =>
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const handleAiSummarize = async () => {
    setIsAiSummarizing(true);
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('kapate_token') || localStorage.getItem('kapate_access_token')) : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/ai/summary', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: 'email_summary',
          subject: activeThread.subject,
          snippet: activeThread.snippet,
          senderName: latestMessage.from.name,
          messages: activeThread.messages
        })
      });

      if (!res.ok) {
        throw new Error(`AI Service returned ${res.status}`);
      }

      const json = await res.json();
      if (json.data) {
        setAiSummary({
          summary: json.data.summary,
          actionItems: json.data.actionItems || []
        });
        showToast('AI conversation summary generated', 'info');
      }
    } catch {
      // Fallback to contextual summary if offline
      setAiSummary({
        summary: `Thread focuses on architectural milestones and operational sign-off for "${activeThread.relatedProjectName || activeThread.subject}". Discussions include delivery timelines, system verification against Kapate OS SLAs, and pending stakeholder action items.`,
        actionItems: [
          `Review technical deliverables for ${activeThread.relatedProjectName || 'Project timeline'}`,
          `Validate milestones with ${latestMessage.from.name}`,
          `Verify audit and security compliance checklist`
        ]
      });
      showToast('AI conversation summary generated', 'info');
    } finally {
      setIsAiSummarizing(false);
    }
  };

  const handleAiDraftReply = async () => {
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('kapate_token') || localStorage.getItem('kapate_access_token')) : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/ai/summary', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: 'email_draft_reply',
          subject: activeThread.subject,
          snippet: activeThread.snippet,
          senderName: latestMessage.from.name,
          body: latestMessage.body
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.reply) {
          setReplyBody(json.data.reply);
          showToast('AI draft inserted into reply box', 'success');
          return;
        }
      }
    } catch {}

    const senderFirstName = latestMessage.from.name.split(' ')[0] || 'Team';
    setReplyBody(`Hi ${senderFirstName},\n\nThank you for the detailed update. I have reviewed the specifications and status report for ${activeThread.relatedProjectName || activeThread.subject}.\n\nEverything aligns with our delivery roadmap and enterprise SLA requirements. You are cleared to proceed with the next milestone.\n\nBest regards,\n${currentUser.name}\nKapate Consultancy`);
    showToast('AI draft inserted into reply box', 'success');
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;

    let recipients: EmailRecipient[] = [latestMessage.from];
    let outgoingAttachments: EmailAttachment[] = [];

    if (replyMode === 'REPLY_ALL') {
      const allRecipients = [latestMessage.from, ...(latestMessage.to || []), ...(latestMessage.cc || [])];
      recipients = allRecipients.filter(r => r.email !== (activeEmailAccountEmail || currentUser.email));
    } else if (replyMode === 'FORWARD') {
      if (!forwardRecipientEmail || !forwardRecipientEmail.includes('@')) {
        showToast('Please specify a valid recipient email to forward', 'warning');
        return;
      }
      recipients = [{ name: forwardRecipientEmail.split('@')[0], email: forwardRecipientEmail.trim() }];
      // Forward includes attachments from the active thread
      outgoingAttachments = activeThread.messages.flatMap(m => m.attachments || []);
    }

    const currentSenderEmail = activeEmailAccountEmail && activeEmailAccountEmail !== 'ALL' 
      ? activeEmailAccountEmail 
      : (currentUser.email || 'shon@kapateconsultancy.in');

    sendEmail({
      threadId: activeThread.id,
      fromEmail: currentSenderEmail,
      to: recipients,
      subject: replyMode === 'FORWARD' 
        ? `Fwd: ${activeThread.subject.replace(/^(Re|Fwd):\s*/i, '')}`
        : activeThread.subject.startsWith('Re:') ? activeThread.subject : `Re: ${activeThread.subject}`,
      body: replyMode === 'FORWARD'
        ? `---------- Forwarded message ---------\nFrom: ${latestMessage.from.name} <${latestMessage.from.email}>\nDate: ${latestMessage.timestamp}\nSubject: ${activeThread.subject}\n\n${replyBody}\n\n--- Original Message ---\n${latestMessage.body}`
        : replyBody,
      priority: activeThread.priority,
      labels: activeThread.labels,
      attachments: outgoingAttachments,
      relatedProjectId: activeThread.relatedProjectId,
      relatedProjectName: activeThread.relatedProjectName
    });

    setReplyBody('');
    setForwardRecipientEmail('');
  };

  const handleEditDraft = () => {
    setMailComposeOpen(true, {
      id: latestMessage.id,
      threadId: activeThread.id,
      to: latestMessage.to || activeThread.participants.filter(p => p.email !== activeEmailAccountEmail),
      cc: latestMessage.cc,
      bcc: latestMessage.bcc,
      subject: activeThread.subject,
      body: latestMessage.body,
      priority: activeThread.priority,
      attachments: latestMessage.attachments || []
    });
  };

  const handleDiscardDraft = () => {
    deleteDraft(activeThread.id);
  };

  const handleDownloadAttachment = (att: EmailAttachment) => {
    showToast(`Downloading "${att.filename}" (${att.size})...`, 'info');
  };

  const openTaskModal = () => {
    setTaskTitle(`Follow up on: ${activeThread.subject}`);
    setShowTaskCreateModal(true);
  };

  const handleConfirmTaskCreate = () => {
    const selectedProj = projects.find(p => p.id === selectedProjectIdToLink) || projects[0];
    createTaskFromEmail(activeThread.id, {
      title: taskTitle,
      assignedTo: taskAssignee,
      priority: taskPriority,
      dueDate: taskDueDate,
      estimatedHours: 8,
      description: `Task generated from email thread "${activeThread.subject}".\n\nLatest sender: ${latestMessage.from.name} (${latestMessage.from.email}).\nSnippet: ${activeThread.snippet}`,
      projectId: selectedProj?.id || 'PRJ-001',
      projectName: selectedProj?.name || 'Project Nexus'
    });
    setShowTaskCreateModal(false);
  };

  const handleConfirmProjectLink = () => {
    const proj = projects.find(p => p.id === selectedProjectIdToLink);
    if (proj) {
      linkEmailToProject(activeThread.id, proj.id, proj.name);
    }
    setShowProjectLinkModal(false);
  };

  return (
    <div className="flex-1 bg-white flex flex-col h-full overflow-hidden">
      
      {/* Top Header & Toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => toggleStarThread(activeThread.id)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              activeThread.isStarred ? 'bg-amber-50 border-amber-200 text-amber-500' : 'border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
            title="Star conversation"
          >
            <Star className={`w-4 h-4 ${activeThread.isStarred ? 'fill-amber-500' : ''}`} />
          </button>

          <button
            onClick={() => toggleImportantThread(activeThread.id)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              activeThread.isImportant ? 'bg-purple-50 border-purple-200 text-purple-600' : 'border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
            title="Mark important"
          >
            <Bookmark className={`w-4 h-4 ${activeThread.isImportant ? 'fill-purple-600' : ''}`} />
          </button>

          <div className="h-4 w-px bg-slate-200" />

          <button
            onClick={() => moveThreadToFolder(activeThread.id, 'ARCHIVE')}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Archive conversation"
          >
            <Archive className="w-4 h-4" />
          </button>

          <button
            onClick={() => moveThreadToFolder(activeThread.id, 'TRASH')}
            className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Move to trash"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => markThreadRead(activeThread.id, false)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Mark as unread"
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>

        {/* ECOSYSTEM INTEGRATION SHORTCUTS */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openTaskModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-colors shadow-2xs cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Create Task</span>
          </button>

          <button
            onClick={() => setShowProjectLinkModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 transition-colors shadow-2xs cursor-pointer"
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>{activeThread.relatedProjectName ? 'Linked Project' : 'Link to Project'}</span>
          </button>

          <button
            onClick={handleAiSummarize}
            disabled={isAiSummarizing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAiSummarizing ? 'Analyzing...' : 'AI Summary'}</span>
          </button>
        </div>
      </div>

      {/* Main Conversation Thread Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/30">
        
        {/* DRAFT BANNER (If thread is draft) */}
        {isDraft && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4 animate-fade-in shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-amber-900 text-xs">Unsent Email Draft</div>
                <div className="text-[11px] text-amber-700">This conversation is currently saved as a draft.</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDiscardDraft}
                className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Discard Draft
              </button>
              <button
                onClick={handleEditDraft}
                className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Continue Editing &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Thread Subject Title & Tags */}
        <div className="space-y-2 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-slate-400">{activeThread.id}</span>
            {activeThread.priority === 'Urgent' && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                Urgent Priority
              </span>
            )}
            {activeThread.labels?.map((lbl) => (
              <span key={lbl} className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {lbl}
              </span>
            ))}
            {activeThread.relatedProjectName && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                <FolderKanban className="w-3 h-3" /> {activeThread.relatedProjectName}
              </span>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
            {activeThread.subject || '(No Subject)'}
          </h2>
        </div>

        {/* AI SUMMARY BOX (If Triggered) */}
        {aiSummary && (
          <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-3 animate-fade-in shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" /> AI Executive Conversation Summary
              </span>
              <span className="text-[10px] font-mono text-indigo-500 bg-white/80 px-2 py-0.5 rounded border border-indigo-100">
                AI Suggestion
              </span>
            </div>
            <p className="text-xs text-indigo-950 leading-relaxed">
              {aiSummary.summary}
            </p>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 block mb-1">
                Extracted Action Items:
              </span>
              <ul className="space-y-1">
                {aiSummary.actionItems.map((item, idx) => (
                  <li key={idx} className="text-xs text-indigo-900 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Thread Messages */}
        <div className="space-y-4">
          {activeThread.messages.map((msg, index) => {
            const isLast = index === activeThread.messages.length - 1;
            const isExpanded = isLast || expandedMessageIds.includes(msg.id);

            return (
              <div
                key={msg.id}
                className={`rounded-3xl border transition-all ${
                  isLast ? 'bg-white border-slate-300 shadow-sm' : 'bg-white/80 border-slate-200'
                }`}
              >
                {/* Message Header */}
                <div
                  onClick={() => !isLast && toggleExpandMessage(msg.id)}
                  className={`p-4 flex items-center justify-between gap-3 ${
                    !isLast ? 'cursor-pointer hover:bg-slate-50 rounded-3xl' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {msg.from.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">{msg.from.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">&lt;{msg.from.email}&gt;</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        to {msg.to?.map(t => t.name).join(', ') || 'Recipients'}
                        {msg.cc && msg.cc.length > 0 && ` (cc: ${msg.cc.map(c => c.name).join(', ')})`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-slate-400 font-mono">{msg.timestamp}</span>
                    {!isLast && (
                      <button className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Message Body & Attachments (when expanded) */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-slate-100 space-y-4">
                    <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                      {msg.body}
                    </div>

                    {/* Attachments Section */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="pt-4 border-t border-slate-100 space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5" /> Attachments ({msg.attachments.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {msg.attachments.map((att) => (
                            <div
                              key={att.id}
                              className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 truncate">{att.filename}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{att.size}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => handleDownloadAttachment(att)}
                                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                                  title="Download"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => saveEmailAttachmentToDocuments(att, 'Project Documents', activeThread.relatedProjectName || 'Project Nexus')}
                                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
                                  title="Save directly into Kapate OS Authorized Documents"
                                >
                                  Save to Docs
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* INLINE REPLY BOX (Only if not in draft viewing mode) */}
        {!isDraft && (
          <div className="p-5 rounded-3xl bg-white border border-slate-300 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {(['REPLY', 'REPLY_ALL', 'FORWARD'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setReplyMode(mode)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      replyMode === mode
                        ? 'bg-slate-900 text-white shadow-2xs font-bold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {mode === 'REPLY' && 'Reply'}
                    {mode === 'REPLY_ALL' && 'Reply All'}
                    {mode === 'FORWARD' && 'Forward'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAiDraftReply}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold border border-purple-200 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Draft with AI</span>
              </button>
            </div>

            {replyMode === 'FORWARD' && (
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Forward To</label>
                <input
                  type="email"
                  placeholder="recipient@kapateconsultancy.in"
                  value={forwardRecipientEmail}
                  onChange={(e) => setForwardRecipientEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            )}

            <form onSubmit={handleSendReply} className="space-y-3">
              <textarea
                rows={4}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder={
                  replyMode === 'FORWARD'
                    ? "Add optional comments to forward..."
                    : `Write your response to ${latestMessage.from.name}...`
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-colors custom-scrollbar"
              />

              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-slate-400 font-mono">
                  Sending from: <strong>{activeEmailAccountEmail !== 'ALL' ? activeEmailAccountEmail : (currentUser.email || 'shon@kapateconsultancy.in')}</strong>
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{replyMode === 'FORWARD' ? 'Forward Conversation' : 'Send Response'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* CREATE TASK MODAL */}
      {showTaskCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-blue-600" /> Convert Email to Backlog Task
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Task Title</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Project</label>
                  <select
                    value={selectedProjectIdToLink}
                    onChange={(e) => setSelectedProjectIdToLink(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assignee</label>
                  <input
                    type="text"
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as 'Urgent' | 'High' | 'Medium' | 'Low')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowTaskCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTaskCreate}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 cursor-pointer"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LINK TO PROJECT MODAL */}
      {showProjectLinkModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-purple-600" /> Link Thread to Project
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tagging this conversation with an active project links all audit trails and team communications to that project&apos;s activity timeline.
            </p>
            <div className="space-y-2">
              <label className="font-bold text-slate-700 block text-xs">Select Project</label>
              <select
                value={selectedProjectIdToLink}
                onChange={(e) => setSelectedProjectIdToLink(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-purple-500"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.status})</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowProjectLinkModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmProjectLink}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 cursor-pointer"
              >
                Confirm Link
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
