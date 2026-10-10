import { NextResponse } from 'next/server';
import { getCloudCollection } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { dataStore } from '@/lib/dataStore';
import { EmailMessage, EmailThread, EmailRecipient } from '@/types';

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const {
      threadId,
      to,
      cc,
      bcc,
      subject,
      content,
      isDraft = false,
      priority = 'Normal',
      attachments = [],
      senderAccountEmail
    } = body;

    if (!isDraft && (!to || !Array.isArray(to) || to.length === 0)) {
      return NextResponse.json({ success: false, error: 'Recipient "to" is required' }, { status: 400 });
    }

    const now = new Date();
    const nowIso = now.toISOString().split('T')[0];
    const nowTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const effectiveThreadId = threadId || `THR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const messageId = `MSG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const senderRecipient: EmailRecipient = {
      name: auth.user.name,
      email: senderAccountEmail || auth.user.email || 'shon@kapateconsultancy.in',
      department: auth.user.department,
      type: 'TO'
    };

    const toRecipients: EmailRecipient[] = (to || []).map((r: any) => typeof r === 'string' ? { email: r, name: r.split('@')[0], type: 'TO' } : { ...r, type: 'TO' });
    const ccRecipients: EmailRecipient[] = (cc || []).map((r: any) => typeof r === 'string' ? { email: r, name: r.split('@')[0], type: 'CC' } : { ...r, type: 'CC' });
    const bccRecipients: EmailRecipient[] = (bcc || []).map((r: any) => typeof r === 'string' ? { email: r, name: r.split('@')[0], type: 'BCC' } : { ...r, type: 'BCC' });

    const allParticipants = [senderRecipient, ...toRecipients, ...ccRecipients];

    const newMessage: EmailMessage = {
      id: messageId,
      threadId: effectiveThreadId,
      from: senderRecipient,
      to: toRecipients,
      cc: ccRecipients,
      bcc: bccRecipients,
      subject: subject || '(No Subject)',
      body: content || '',
      snippet: (content || '').substring(0, 120),
      timestamp: nowTimeStr,
      date: nowIso,
      isRead: true, // Sender has read their own sent message
      isStarred: false,
      isImportant: false,
      folder: isDraft ? 'DRAFTS' : 'SENT',
      priority: priority as any,
      labels: ['Work'],
      attachments
    };

    // 1. Persist directly to authoritative local dataStore
    try {
      dataStore.addEmailMessage(newMessage);

      const existingLocalThread = dataStore.getEmailThreadById(effectiveThreadId);
      if (existingLocalThread) {
        const updatedMsgs = [...(existingLocalThread.messages || []), newMessage];
        const updatedParticipants = [
          ...existingLocalThread.participants,
          ...allParticipants
        ].filter((v, i, a) => a.findIndex(t => t.email.toLowerCase() === v.email.toLowerCase()) === i);

        dataStore.updateEmailThread(effectiveThreadId, {
          subject: subject || existingLocalThread.subject,
          snippet: (content || '').substring(0, 120),
          lastMessageTimestamp: nowTimeStr,
          lastSenderName: auth.user.name,
          messageCount: updatedMsgs.length,
          messages: updatedMsgs,
          participants: updatedParticipants,
          hasAttachments: existingLocalThread.hasAttachments || attachments.length > 0,
          isUnread: !isDraft,
          folder: isDraft ? 'DRAFTS' : 'INBOX'
        });
      } else {
        const newThreadRecord: EmailThread = {
          id: effectiveThreadId,
          subject: subject || '(No Subject)',
          snippet: (content || '').substring(0, 120),
          lastMessageTimestamp: nowTimeStr,
          lastSenderName: auth.user.name,
          isUnread: false,
          isStarred: false,
          isImportant: priority === 'Urgent' || priority === 'Important',
          folder: isDraft ? 'DRAFTS' : 'SENT',
          labels: ['Work'],
          priority: priority as any,
          messageCount: 1,
          hasAttachments: attachments.length > 0,
          participants: allParticipants,
          messages: [newMessage]
        };
        dataStore.addEmailThread(newThreadRecord);
      }
    } catch (dsErr: any) {
      console.warn('[Mail Compose] Local dataStore notice:', dsErr.message);
    }

    // 2. Best effort replication to MongoDB Atlas
    try {
      const threadsColl = await getCloudCollection<EmailThread>('email_threads');
      const messagesColl = await getCloudCollection<EmailMessage>('email_messages');

      await messagesColl.insertOne(newMessage as any);

      const existingThread = await threadsColl.findOne({ id: effectiveThreadId });
      if (existingThread) {
        const updatedMessages = [...(existingThread.messages || []), newMessage];
        const updatedParticipants = [
          ...existingThread.participants,
          ...allParticipants
        ].filter((v, i, a) => a.findIndex(t => t.email.toLowerCase() === v.email.toLowerCase()) === i);

        await threadsColl.updateOne(
          { id: effectiveThreadId },
          {
            $set: {
              subject: subject || existingThread.subject,
              snippet: (content || '').substring(0, 120),
              lastMessageTimestamp: nowTimeStr,
              lastSenderName: auth.user.name,
              messageCount: updatedMessages.length,
              messages: updatedMessages,
              participants: updatedParticipants,
              hasAttachments: existingThread.hasAttachments || attachments.length > 0,
              isUnread: !isDraft,
              folder: isDraft ? 'DRAFTS' : 'INBOX'
            }
          }
        );
      } else {
        const newThread: EmailThread = {
          id: effectiveThreadId,
          subject: subject || '(No Subject)',
          snippet: (content || '').substring(0, 120),
          lastMessageTimestamp: nowTimeStr,
          lastSenderName: auth.user.name,
          isUnread: false,
          isStarred: false,
          isImportant: priority === 'Urgent' || priority === 'Important',
          folder: isDraft ? 'DRAFTS' : 'SENT',
          labels: ['Work'],
          priority: priority as any,
          messageCount: 1,
          hasAttachments: attachments.length > 0,
          participants: allParticipants,
          messages: [newMessage]
        };

        await threadsColl.insertOne(newThread as any);
      }
    } catch (cloudErr: any) {
      console.warn('[Mail Compose] MongoDB cloud replication skipped:', cloudErr.message);
    }

    return NextResponse.json({
      success: true,
      messageId,
      threadId: effectiveThreadId,
      data: newMessage
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
