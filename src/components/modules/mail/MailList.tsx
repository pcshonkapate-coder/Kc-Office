"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import { EmailThread, MailFolder } from '../../../types';
import {
  Search, Star, Bookmark, Paperclip, CheckSquare, Square,
  Mail, MailOpen, Trash2, Archive, FolderInput, Tag,
  RotateCw, Filter, AlertCircle, Clock, ChevronDown, Edit3,
  Sparkles, CheckCircle2, Shield
} from 'lucide-react';

export const MailList: React.FC = () => {
  const emailThreads = useDemoStore((state) => state.emailThreads);
  const activeMailFolder = useDemoStore((state) => state.activeMailFolder);
  const selectedMailLabel = useDemoStore((state) => state.selectedMailLabel);
  const selectedEmailThreadId = useDemoStore((state) => state.selectedEmailThreadId);
  const activeEmailAccountEmail = useDemoStore((state) => state.activeEmailAccountEmail);
  const mailSearchQuery = useDemoStore((state) => state.mailSearchQuery);
  const emailLabels = useDemoStore((state) => state.emailLabels);

  const setSelectedEmailThreadId = useDemoStore((state) => state.setSelectedEmailThreadId);
  const setMailSearchQuery = useDemoStore((state) => state.setMailSearchQuery);
  const setMailComposeOpen = useDemoStore((state) => state.setMailComposeOpen);
  const toggleStarThread = useDemoStore((state) => state.toggleStarThread);
  const toggleImportantThread = useDemoStore((state) => state.toggleImportantThread);
  const markThreadRead = useDemoStore((state) => state.markThreadRead);
  const bulkMarkThreadsRead = useDemoStore((state) => state.bulkMarkThreadsRead);
  const bulkMoveThreadsToFolder = useDemoStore((state) => state.bulkMoveThreadsToFolder);
  const addLabelToThread = useDemoStore((state) => state.addLabelToThread);

  const [selectedThreadIds, setSelectedThreadIds] = useState<string[]>([]);
  const [filterOnlyUnread, setFilterOnlyUnread] = useState(false);
  const [filterOnlyAttachments, setFilterOnlyAttachments] = useState(false);
  const [filterOnlyUrgent, setFilterOnlyUrgent] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showLabelMenu, setShowLabelMenu] = useState(false);

  // Filter threads based on mailbox, folder, search, label, and quick filters
  const filteredThreads = useMemo(() => {
    return emailThreads.filter((thread) => {
      // Mailbox / Account filter (if not "ALL")
      if (activeEmailAccountEmail && activeEmailAccountEmail !== 'ALL') {
        const accEmailLower = activeEmailAccountEmail.toLowerCase();
        const isInvolved =
          thread.participants?.some(p => p.email.toLowerCase() === accEmailLower) ||
          thread.messages?.some(m =>
            m.from?.email?.toLowerCase() === accEmailLower ||
            m.to?.some(t => t.email.toLowerCase() === accEmailLower) ||
            m.cc?.some(c => c.email.toLowerCase() === accEmailLower) ||
            m.bcc?.some(b => b.email.toLowerCase() === accEmailLower)
          );
        if (!isInvolved) return false;
      }

      // Label filter
      if (selectedMailLabel && !thread.labels.includes(selectedMailLabel)) {
        return false;
      }

      // Folder views
      if (!selectedMailLabel) {
        if (activeMailFolder === 'STARRED') {
          if (!thread.isStarred) return false;
        } else if (activeMailFolder === 'IMPORTANT') {
          if (!thread.isImportant) return false;
        } else {
          if (thread.folder !== activeMailFolder) return false;
        }
      }

      // Quick filters
      if (filterOnlyUnread && !thread.isUnread) return false;
      if (filterOnlyAttachments && !thread.hasAttachments) return false;
      if (filterOnlyUrgent && thread.priority !== 'Urgent') return false;

      // Search Query
      if (mailSearchQuery.trim()) {
        const q = mailSearchQuery.toLowerCase();
        const matchesSubject = thread.subject?.toLowerCase().includes(q);
        const matchesSnippet = thread.snippet?.toLowerCase().includes(q);
        const matchesSender = thread.participants?.some(p =>
          p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
        );
        const matchesProject = thread.relatedProjectName?.toLowerCase().includes(q);
        const matchesBody = thread.messages?.some(m => m.body.toLowerCase().includes(q));

        if (!matchesSubject && !matchesSnippet && !matchesSender && !matchesProject && !matchesBody) {
          return false;
        }
      }

      return true;
    });
  }, [
    emailThreads,
    activeEmailAccountEmail,
    activeMailFolder,
    selectedMailLabel,
    filterOnlyUnread,
    filterOnlyAttachments,
    filterOnlyUrgent,
    mailSearchQuery
  ]);

  // Auto-select first thread if selection is stale
  useEffect(() => {
    if (filteredThreads.length > 0) {
      const exists = filteredThreads.some(t => t.id === selectedEmailThreadId);
      if (!exists && !selectedEmailThreadId) {
        setSelectedEmailThreadId(filteredThreads[0].id);
      }
    }
  }, [filteredThreads, selectedEmailThreadId, setSelectedEmailThreadId]);

  const allSelected = filteredThreads.length > 0 && selectedThreadIds.length === filteredThreads.length;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedThreadIds([]);
    } else {
      setSelectedThreadIds(filteredThreads.map(t => t.id));
    }
  };

  const handleToggleSelectOne = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedThreadIds(prev =>
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handleBulkMove = (folder: MailFolder) => {
    if (selectedThreadIds.length === 0) return;
    bulkMoveThreadsToFolder(selectedThreadIds, folder);
    setSelectedThreadIds([]);
    setShowMoveMenu(false);
  };

  const handleBulkMarkRead = (isRead: boolean) => {
    if (selectedThreadIds.length === 0) return;
    bulkMarkThreadsRead(selectedThreadIds, isRead);
    setSelectedThreadIds([]);
  };

  const handleBulkLabel = (labelName: string) => {
    selectedThreadIds.forEach(tid => addLabelToThread(tid, labelName));
    setShowLabelMenu(false);
  };

  const handleOpenDraftInCompose = (e: React.MouseEvent, thread: EmailThread) => {
    e.stopPropagation();
    const draftMsg = thread.messages[0] || {};
    setMailComposeOpen(true, {
      id: draftMsg.id || thread.id,
      threadId: thread.id,
      to: draftMsg.to || thread.participants.filter(p => p.email !== activeEmailAccountEmail),
      cc: draftMsg.cc,
      bcc: draftMsg.bcc,
      subject: thread.subject,
      body: draftMsg.body,
      priority: thread.priority,
      attachments: draftMsg.attachments || []
    });
  };

  const getLabelBadge = (labelName: string) => {
    const meta = emailLabels.find(l => l.name === labelName);
    if (!meta) {
      return (
        <span key={labelName} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
          {labelName}
        </span>
      );
    }
    return (
      <span
        key={labelName}
        className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${meta.bgColor} ${meta.color} ${meta.borderColor}`}
      >
        {labelName}
      </span>
    );
  };

  return (
    <div className="w-full lg:w-[420px] bg-white border-r border-slate-200 flex flex-col h-full shrink-0">
      
      {/* Search Bar & Quick Filters */}
      <div className="p-3 border-b border-slate-100 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search mail (e.g. from:amit, Project Nexus)..."
            value={mailSearchQuery}
            onChange={(e) => setMailSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {mailSearchQuery && (
            <button
              onClick={() => setMailSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-0.5">
          <button
            onClick={() => setFilterOnlyUnread(!filterOnlyUnread)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 border cursor-pointer ${
              filterOnlyUnread
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilterOnlyAttachments(!filterOnlyAttachments)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 border flex items-center gap-1 cursor-pointer ${
              filterOnlyAttachments
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            <Paperclip className="w-2.5 h-2.5" /> Attachments
          </button>
          <button
            onClick={() => setFilterOnlyUrgent(!filterOnlyUrgent)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 border flex items-center gap-1 cursor-pointer ${
              filterOnlyUrgent
                ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            Urgent Only
          </button>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 text-slate-600 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleSelectAll}
            className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title={allSelected ? 'Deselect all' : 'Select all'}
          >
            {allSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-slate-400" />}
          </button>

          <span className="text-[11px] font-mono text-slate-500">
            {selectedThreadIds.length > 0 ? `${selectedThreadIds.length} selected` : `${filteredThreads.length} conversation${filteredThreads.length === 1 ? '' : 's'}`}
          </span>
        </div>

        {/* Action icons when selected */}
        {selectedThreadIds.length > 0 ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleBulkMarkRead(true)}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Mark as read"
            >
              <MailOpen className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleBulkMarkRead(false)}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Mark as unread"
            >
              <Mail className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleBulkMove('ARCHIVE')}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Archive"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleBulkMove('TRASH')}
              className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Move Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMoveMenu(!showMoveMenu)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                title="Move to folder"
              >
                <FolderInput className="w-3.5 h-3.5" />
              </button>
              {showMoveMenu && (
                <div className="absolute right-0 mt-1 w-36 rounded-xl bg-white border border-slate-200 shadow-xl p-1.5 z-40 space-y-0.5 text-[11px] font-semibold">
                  <button onClick={() => handleBulkMove('INBOX')} className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">Move to Inbox</button>
                  <button onClick={() => handleBulkMove('ARCHIVE')} className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">Archive</button>
                  <button onClick={() => handleBulkMove('SPAM')} className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">Mark as Spam</button>
                  <button onClick={() => handleBulkMove('TRASH')} className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 cursor-pointer">Move to Trash</button>
                </div>
              )}
            </div>

            {/* Label Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowLabelMenu(!showLabelMenu)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                title="Apply label"
              >
                <Tag className="w-3.5 h-3.5" />
              </button>
              {showLabelMenu && (
                <div className="absolute right-0 mt-1 w-40 rounded-xl bg-white border border-slate-200 shadow-xl p-1.5 z-40 space-y-0.5 text-[11px] font-semibold">
                  {emailLabels.map(lbl => (
                    <button
                      key={lbl.id}
                      onClick={() => handleBulkLabel(lbl.name)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <span className={`w-2 h-2 rounded-full ${lbl.bgColor} border ${lbl.borderColor}`} />
                      <span>{lbl.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <span>{selectedMailLabel ? `Label: ${selectedMailLabel}` : activeMailFolder}</span>
            {activeEmailAccountEmail !== 'ALL' && (
              <span className="text-slate-400 font-normal truncate max-w-[150px]">
                ({activeEmailAccountEmail.split('@')[0]})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
        {filteredThreads.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Mail className="w-10 h-10 mx-auto text-slate-300" />
            <div className="text-xs font-bold text-slate-700">No Conversations Found</div>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Your {activeMailFolder.toLowerCase()} folder is empty or no messages match your active filters.
            </p>
          </div>
        ) : (
          filteredThreads.map((thread) => {
            const isSelected = selectedEmailThreadId === thread.id;
            const isChecked = selectedThreadIds.includes(thread.id);
            const isDraft = thread.folder === 'DRAFTS';

            return (
              <div
                key={thread.id}
                onClick={() => {
                  if (isDraft) {
                    handleOpenDraftInCompose({ stopPropagation: () => {} } as any, thread);
                  } else {
                    setSelectedEmailThreadId(thread.id);
                  }
                }}
                className={`p-3.5 transition-all cursor-pointer relative flex items-start gap-2.5 ${
                  isSelected
                    ? 'bg-blue-50/70 border-l-4 border-l-blue-600'
                    : thread.isUnread
                    ? 'bg-white font-semibold hover:bg-slate-50'
                    : 'bg-white/60 hover:bg-slate-50 text-slate-600'
                }`}
              >
                {/* Left controls: Select & Star */}
                <div className="flex flex-col items-center gap-2 pt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleToggleSelectOne(e, thread.id)}
                    className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    {isChecked ? <CheckSquare className="w-3.5 h-3.5 text-blue-600" /> : <Square className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => toggleStarThread(thread.id)}
                    className={`transition-colors cursor-pointer ${thread.isStarred ? 'text-amber-500' : 'text-slate-300 hover:text-slate-500'}`}
                    title={thread.isStarred ? 'Unstar' : 'Star'}
                  >
                    <Star className={`w-3.5 h-3.5 ${thread.isStarred ? 'fill-amber-500' : ''}`} />
                  </button>
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={`text-xs truncate ${thread.isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {isDraft ? (
                          <span className="text-rose-600 font-bold flex items-center gap-1">
                            <Edit3 className="w-3 h-3" /> [Draft]
                          </span>
                        ) : (
                          thread.lastSenderName
                        )}
                      </span>
                      {thread.messageCount > 1 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold font-mono bg-slate-100 text-slate-600">
                          {thread.messageCount}
                        </span>
                      )}
                      {thread.priority === 'Urgent' && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Urgent
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {thread.lastMessageTimestamp}
                    </span>
                  </div>

                  <div className={`text-xs truncate leading-snug ${thread.isUnread ? 'font-bold text-slate-900' : 'text-slate-800 font-normal'}`}>
                    {thread.subject || '(No Subject)'}
                  </div>

                  <p className="text-[11px] text-slate-500 truncate leading-relaxed">
                    {thread.snippet || '(No content)'}
                  </p>

                  {/* Badges & Indicators */}
                  <div className="flex items-center justify-between pt-1 gap-2">
                    <div className="flex items-center gap-1 flex-wrap">
                      {thread.labels?.slice(0, 3).map(getLabelBadge)}
                      {thread.relatedProjectName && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold truncate max-w-[120px]">
                          {thread.relatedProjectName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-slate-400 shrink-0">
                      {isDraft && (
                        <button
                          onClick={(e) => handleOpenDraftInCompose(e, thread)}
                          className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold hover:bg-blue-100 flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-2.5 h-2.5" /> Edit
                        </button>
                      )}
                      {thread.hasAttachments && (
                        <Paperclip className="w-3 h-3 text-slate-400" />
                      )}
                      {thread.isUnread && (
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
