"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useDemoStore } from '../../../store/demoStore';
import { EmailRecipient, EmailAttachment, EmailPriority } from '../../../types';
import {
  X, Send, Paperclip, Sparkles, Layers, Bold, Italic, List,
  Heading, Code, Quote, Trash2, Shield, User, Check, Plus,
  UploadCloud, FileText, AlertCircle
} from 'lucide-react';

export const MailComposeModal: React.FC = () => {
  const isMailComposeOpen = useDemoStore((state) => state.isMailComposeOpen);
  const mailComposeInitialData = useDemoStore((state) => state.mailComposeInitialData);
  const emailAccounts = useDemoStore((state) => state.emailAccounts);
  const emailTemplates = useDemoStore((state) => state.emailTemplates);
  const projects = useDemoStore((state) => state.projects);
  const activeEmailAccountEmail = useDemoStore((state) => state.activeEmailAccountEmail);
  const currentUser = useDemoStore((state) => state.currentUser);
  const setMailComposeOpen = useDemoStore((state) => state.setMailComposeOpen);
  const sendEmail = useDemoStore((state) => state.sendEmail);
  const saveDraft = useDemoStore((state) => state.saveDraft);
  const showToast = useDemoStore((state) => state.showToast);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultSender = activeEmailAccountEmail && activeEmailAccountEmail !== 'ALL'
    ? activeEmailAccountEmail
    : (currentUser.email || 'shon@kapateconsultancy.in');

  const [fromEmail, setFromEmail] = useState(defaultSender);
  const [toInput, setToInput] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<EmailRecipient[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');
  const [selectedCc, setSelectedCc] = useState<EmailRecipient[]>([]);
  const [selectedBcc, setSelectedBcc] = useState<EmailRecipient[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<EmailPriority>('Normal');
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [showDirectoryDropdown, setShowDirectoryDropdown] = useState(false);
  const [activeDirectoryField, setActiveDirectoryField] = useState<'TO' | 'CC' | 'BCC'>('TO');
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Load initial data if replying/forwarding or opening draft
  useEffect(() => {
    if (mailComposeInitialData) {
      if (mailComposeInitialData.to) setSelectedRecipients(mailComposeInitialData.to);
      if (mailComposeInitialData.cc) setSelectedCc(mailComposeInitialData.cc);
      if (mailComposeInitialData.bcc) setSelectedBcc(mailComposeInitialData.bcc);
      if (mailComposeInitialData.subject) setSubject(mailComposeInitialData.subject);
      if (mailComposeInitialData.body) setBody(mailComposeInitialData.body);
      if (mailComposeInitialData.priority) setPriority(mailComposeInitialData.priority);
      if (mailComposeInitialData.attachments) setAttachments(mailComposeInitialData.attachments);
    } else {
      setFromEmail(defaultSender);
      setSelectedRecipients([]);
      setSelectedCc([]);
      setSelectedBcc([]);
      setToInput('');
      setCcInput('');
      setBccInput('');
      setSubject('');
      setBody('');
      setAttachments([]);
      setPriority('Normal');
    }
  }, [mailComposeInitialData, defaultSender, isMailComposeOpen]);

  if (!isMailComposeOpen) return null;

  // Directory search candidates
  const currentQuery = activeDirectoryField === 'TO' 
    ? toInput.toLowerCase() 
    : activeDirectoryField === 'CC' 
    ? ccInput.toLowerCase() 
    : bccInput.toLowerCase();

  const directorySuggestions = emailAccounts.filter((acc) => {
    if (!currentQuery.trim()) return false;
    return (
      acc.name.toLowerCase().includes(currentQuery) ||
      acc.email.toLowerCase().includes(currentQuery) ||
      acc.department.toLowerCase().includes(currentQuery) ||
      acc.designation.toLowerCase().includes(currentQuery)
    );
  });

  const handleSelectDirectoryRecipient = (acc: typeof emailAccounts[0]) => {
    const recipient: EmailRecipient = {
      name: acc.name,
      email: acc.email,
      role: acc.designation,
      department: acc.department
    };

    if (activeDirectoryField === 'TO') {
      if (!selectedRecipients.some(r => r.email === recipient.email)) {
        setSelectedRecipients(prev => [...prev, recipient]);
      }
      setToInput('');
    } else if (activeDirectoryField === 'CC') {
      if (!selectedCc.some(r => r.email === recipient.email)) {
        setSelectedCc(prev => [...prev, recipient]);
      }
      setCcInput('');
    } else {
      if (!selectedBcc.some(r => r.email === recipient.email)) {
        setSelectedBcc(prev => [...prev, recipient]);
      }
      setBccInput('');
    }
    setShowDirectoryDropdown(false);
  };

  const handleAddManualRecipient = (type: 'TO' | 'CC' | 'BCC') => {
    const val = type === 'TO' ? toInput.trim() : type === 'CC' ? ccInput.trim() : bccInput.trim();
    if (!val || !val.includes('@')) return;

    const r: EmailRecipient = { name: val.split('@')[0], email: val };
    if (type === 'TO') {
      setSelectedRecipients(prev => [...prev, r]);
      setToInput('');
    } else if (type === 'CC') {
      setSelectedCc(prev => [...prev, r]);
      setCcInput('');
    } else {
      setSelectedBcc(prev => [...prev, r]);
      setBccInput('');
    }
    setShowDirectoryDropdown(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: EmailAttachment[] = Array.from(files).map((file) => {
      const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
      let fileType: EmailAttachment['fileType'] = 'PDF';
      if (ext === 'DOCX' || ext === 'DOC') fileType = 'DOCX';
      else if (ext === 'ZIP' || ext === 'RAR') fileType = 'ZIP';
      else if (['PNG', 'JPG', 'JPEG', 'WEBP'].includes(ext)) fileType = 'IMAGE';
      else if (['XLS', 'XLSX', 'CSV'].includes(ext)) fileType = 'SHEET';

      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      return {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        filename: file.name,
        size: sizeStr,
        fileType,
        url: URL.createObjectURL(file)
      };
    });

    setAttachments(prev => [...prev, ...newAttachments]);
    showToast(`Attached ${newAttachments.length} file(s)`, 'success');
  };

  const handleAttachPresetSample = () => {
    const mockFiles: EmailAttachment[] = [
      { id: `att-${Date.now()}-1`, filename: 'kapate-ai-architecture-blueprint.pdf', size: '2.8 MB', fileType: 'PDF', url: '#' },
      { id: `att-${Date.now()}-2`, filename: 'q3-delivery-milestone-matrix.docx', size: '480 KB', fileType: 'DOCX', url: '#' },
      { id: `att-${Date.now()}-3`, filename: 'benchmark-latency-traces.xlsx', size: '320 KB', fileType: 'SHEET', url: '#' }
    ];
    const picked = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    setAttachments(prev => [...prev, picked]);
    showToast(`Attached sample: ${picked.filename}`, 'info');
  };

  const handleApplyTemplate = (templateId: string) => {
    const tmpl = emailTemplates.find(t => t.id === templateId);
    if (!tmpl) return;

    const defaultProjName = projects[0]?.name || 'Client Engagement';
    const parsedSubject = tmpl.subject
      .replace('{{project_name}}', defaultProjName)
      .replace('{{client_name}}', 'Valued Client')
      .replace('{{intern_name}}', currentUser.name)
      .replace('{{milestone_name}}', 'Delivery Milestone')
      .replace('{{invoice_number}}', 'INV-001')
      .replace('{{due_date}}', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .replace('{{amount}}', '₹0.00');

    const parsedBody = tmpl.body
      .replace('{{project_name}}', defaultProjName)
      .replace('{{client_name}}', 'Valued Client')
      .replace('{{intern_name}}', currentUser.name)
      .replace('{{milestone_name}}', 'Delivery Milestone')
      .replace('{{invoice_number}}', 'INV-001')
      .replace('{{due_date}}', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .replace('{{amount}}', '₹0.00')
      .replace('{{employee_name}}', currentUser.name)
      .replace('{{sender_name}}', currentUser.name);

    setSubject(parsedSubject);
    setBody(parsedBody);
    showToast(`Template "${tmpl.title}" loaded!`, 'info');
  };

  const handleAiImprove = (mode: 'FORMAL' | 'CONCISE') => {
    if (!body.trim()) return;
    if (mode === 'FORMAL') {
      setBody(`Dear Team,\n\nI am writing to formally communicate the operational status and milestone verifications regarding our current delivery cycle.\n\n${body}\n\nPlease let me know if any further documentation or architectural clarification is needed.\n\nSincerely,\n${currentUser.name}\nKapate Consultancy`);
    } else {
      setBody(`Team — Quick summary:\n\n${body.replace(/\n\n/g, ' ')}\n\nAction requested by end of sprint.`);
    }
    showToast(`AI polished message (${mode.toLowerCase()})`, 'info');
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    let finalTo = [...selectedRecipients];
    if (toInput.trim() && toInput.includes('@')) {
      finalTo.push({ name: toInput.split('@')[0], email: toInput.trim() });
    }

    if (finalTo.length === 0) {
      showToast('Please specify at least one recipient email', 'warning');
      return;
    }

    sendEmail({
      draftId: mailComposeInitialData?.id || mailComposeInitialData?.threadId,
      fromEmail,
      to: finalTo,
      cc: selectedCc,
      bcc: selectedBcc,
      subject: subject || '(No Subject)',
      body: body || '',
      priority,
      labels: ['Work'],
      attachments
    });
  };

  const handleSaveDraft = () => {
    let finalTo = [...selectedRecipients];
    if (toInput.trim() && toInput.includes('@')) {
      finalTo.push({ name: toInput.split('@')[0], email: toInput.trim() });
    }

    saveDraft({
      id: mailComposeInitialData?.id,
      threadId: mailComposeInitialData?.threadId,
      to: finalTo,
      cc: selectedCc,
      bcc: selectedBcc,
      subject: subject || '(Draft)',
      body,
      priority,
      attachments
    });
    setMailComposeOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      {/* Hidden native file picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        className="hidden"
      />

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
        onDragLeave={() => setIsDraggingFile(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingFile(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload({ target: { files: e.dataTransfer.files } } as any);
          }
        }}
        className={`bg-white rounded-3xl border ${
          isDraggingFile ? 'border-blue-500 ring-4 ring-blue-500/20' : 'border-slate-200'
        } shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden transition-all`}
      >
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h3 className="font-extrabold text-slate-900 text-sm">
              New Internal Business Message
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-3 py-1 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Save Draft
            </button>
            <button
              onClick={() => setMailComposeOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Compose Form */}
        <form onSubmit={handleSend} className="flex-1 flex flex-col overflow-hidden">
          
          {/* Header Fields (From, To, CC, BCC, Subject) */}
          <div className="p-4 space-y-2.5 border-b border-slate-100 text-xs">
            
            {/* FROM FIELD */}
            <div className="flex items-center gap-2">
              <span className="w-16 font-bold text-slate-500 shrink-0">From:</span>
              <select
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {emailAccounts.map((acc) => (
                  <option key={acc.id} value={acc.email}>
                    {acc.name} &lt;{acc.email}&gt; {acc.isShared ? '(Shared Department)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* TO FIELD WITH AUTOCOMPLETE DIRECTORY */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <span className="w-16 font-bold text-slate-500 shrink-0">To:</span>
                <div className="flex-1 flex items-center gap-1.5 flex-wrap bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 min-h-[36px]">
                  {selectedRecipients.map((r, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      <span>{r.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedRecipients(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-blue-400 hover:text-blue-700 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder={selectedRecipients.length === 0 ? "Type name or email (e.g. amit, rahul, hr)..." : "Add more..."}
                    value={toInput}
                    onFocus={() => {
                      setActiveDirectoryField('TO');
                      setShowDirectoryDropdown(true);
                    }}
                    onChange={(e) => {
                      setToInput(e.target.value);
                      setActiveDirectoryField('TO');
                      setShowDirectoryDropdown(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddManualRecipient('TO');
                      } else if (e.key === 'Backspace' && !toInput && selectedRecipients.length > 0) {
                        setSelectedRecipients(prev => prev.slice(0, -1));
                      }
                    }}
                    className="flex-1 bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none min-w-[140px]"
                  />
                </div>

                <div className="flex items-center gap-1 shrink-0 text-slate-400">
                  <button
                    type="button"
                    onClick={() => setShowCc(!showCc)}
                    className={`px-1.5 py-0.5 rounded font-mono text-[11px] font-bold cursor-pointer transition-colors ${showCc ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-500'}`}
                  >
                    Cc
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBcc(!showBcc)}
                    className={`px-1.5 py-0.5 rounded font-mono text-[11px] font-bold cursor-pointer transition-colors ${showBcc ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-500'}`}
                  >
                    Bcc
                  </button>
                </div>
              </div>

              {/* DIRECTORY AUTOCOMPLETE DROPDOWN */}
              {showDirectoryDropdown && directorySuggestions.length > 0 && (
                <div className="absolute left-18 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100 animate-fade-in">
                  {directorySuggestions.map((sug) => (
                    <div
                      key={sug.id}
                      onClick={() => handleSelectDirectoryRecipient(sug)}
                      className="p-2.5 hover:bg-blue-50/70 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center">
                          {sug.avatar || sug.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{sug.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{sug.email}</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
                        {sug.designation}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CC FIELD */}
            {showCc && (
              <div className="flex items-center gap-2">
                <span className="w-16 font-bold text-slate-500 shrink-0">Cc:</span>
                <div className="flex-1 flex items-center gap-1.5 flex-wrap bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                  {selectedCc.map((r, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700"
                    >
                      <span>{r.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedCc(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="Cc recipients..."
                    value={ccInput}
                    onFocus={() => {
                      setActiveDirectoryField('CC');
                      setShowDirectoryDropdown(true);
                    }}
                    onChange={(e) => {
                      setCcInput(e.target.value);
                      setActiveDirectoryField('CC');
                      setShowDirectoryDropdown(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddManualRecipient('CC');
                      }
                    }}
                    className="flex-1 bg-transparent text-xs text-slate-900 focus:outline-none min-w-[100px]"
                  />
                </div>
              </div>
            )}

            {/* BCC FIELD */}
            {showBcc && (
              <div className="flex items-center gap-2">
                <span className="w-16 font-bold text-slate-500 shrink-0">Bcc:</span>
                <div className="flex-1 flex items-center gap-1.5 flex-wrap bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                  {selectedBcc.map((r, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700"
                    >
                      <span>{r.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedBcc(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="Bcc confidential recipients..."
                    value={bccInput}
                    onFocus={() => {
                      setActiveDirectoryField('BCC');
                      setShowDirectoryDropdown(true);
                    }}
                    onChange={(e) => {
                      setBccInput(e.target.value);
                      setActiveDirectoryField('BCC');
                      setShowDirectoryDropdown(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddManualRecipient('BCC');
                      }
                    }}
                    className="flex-1 bg-transparent text-xs text-slate-900 focus:outline-none min-w-[100px]"
                  />
                </div>
              </div>
            )}

            {/* SUBJECT */}
            <div className="flex items-center gap-2">
              <span className="w-16 font-bold text-slate-500 shrink-0">Subject:</span>
              <input
                type="text"
                placeholder="Enter conversation subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

          </div>

          {/* Productivity & Template Bar */}
          <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/40 text-xs flex-wrap">
            <div className="flex items-center gap-2">
              {/* Template Picker */}
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span className="font-semibold text-slate-600 text-[11px]">Template:</span>
                <select
                  onChange={(e) => handleApplyTemplate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>Choose Company Template...</option>
                  {emailTemplates.map(tmpl => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.title} ({tmpl.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Selector */}
              <div className="flex items-center gap-1 ml-2">
                <span className="font-semibold text-slate-500 text-[11px]">Priority:</span>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="Normal">Normal</option>
                  <option value="Important">Important</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* AI Assistant Helpers */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAiImprove('FORMAL')}
                className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold border border-purple-200 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3" /> Make Formal
              </button>
              <button
                type="button"
                onClick={() => handleAiImprove('CONCISE')}
                className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold border border-purple-200 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3" /> Make Concise
              </button>
            </div>
          </div>

          {/* Message Body Area */}
          <div className="flex-1 p-4 flex flex-col">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Compose your enterprise communication here... (You can drag & drop attachments here)"
              className="flex-1 w-full p-3 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none resize-none leading-relaxed custom-scrollbar font-sans"
              rows={12}
            />

            {/* Attachments Preview Chips */}
            {attachments.length > 0 && (
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                {attachments.map((att, i) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700"
                  >
                    <Paperclip className="w-3 h-3 text-slate-400" />
                    <span>{att.filename}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({att.size})</span>
                    <button
                      type="button"
                      onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                title="Browse local files"
              >
                <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                <span>Upload File</span>
              </button>

              <button
                type="button"
                onClick={handleAttachPresetSample}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                title="Attach sample project document"
              >
                <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                <span>Preset Sample</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMailComposeOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Discard
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Message</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
