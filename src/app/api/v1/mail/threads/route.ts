import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getCloudCollection } from '@/lib/mongodb';
import { dataStore } from '@/lib/dataStore';
import { EmailThread } from '@/types';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const mailbox = url.searchParams.get('mailbox'); // e.g. 'shon@kapateconsultancy.in' or 'ALL'
    const folder = url.searchParams.get('folder'); // 'INBOX', 'SENT', 'DRAFTS', 'TRASH', 'SPAM', 'ARCHIVE', 'STARRED', 'IMPORTANT'
    const label = url.searchParams.get('label');
    const query = url.searchParams.get('q');

    let threads: EmailThread[] = [];

    // 1. Try cloud collection (best effort)
    try {
      const threadsColl = await getCloudCollection<EmailThread>('email_threads');

      const filter: Record<string, any> = {};

      if (mailbox && mailbox !== 'ALL') {
        const mbLower = mailbox.toLowerCase();
        filter.$or = [
          { 'participants.email': mbLower },
          { 'messages.from.email': mbLower },
          { 'messages.to.email': mbLower },
          { 'messages.cc.email': mbLower },
          { 'messages.bcc.email': mbLower }
        ];
      }

      if (label) {
        filter.labels = label;
      } else if (folder) {
        if (folder === 'STARRED') {
          filter.isStarred = true;
        } else if (folder === 'IMPORTANT') {
          filter.isImportant = true;
        } else {
          filter.folder = folder;
        }
      }

      if (query && query.trim()) {
        const q = query.trim();
        const regex = { $regex: q, $options: 'i' };
        filter.$and = [
          ...(filter.$and || []),
          {
            $or: [
              { subject: regex },
              { snippet: regex },
              { 'participants.name': regex },
              { 'participants.email': regex },
              { 'messages.body': regex },
              { relatedProjectName: regex }
            ]
          }
        ];
      }

      const cloudThreads = await threadsColl
        .find(filter)
        .sort({ updatedAt: -1, lastMessageAt: -1 })
        .toArray();

      if (Array.isArray(cloudThreads)) {
        threads = cloudThreads;
      }
    } catch {
      // Best effort; will fall back to authoritative dataStore
    }

    // 2. Load from authoritative local dataStore and merge deduplicated
    const localThreads = dataStore.getEmailThreads(
      mailbox || undefined,
      folder || undefined,
      label || undefined,
      query || undefined
    );

    const threadMap = new Map<string, EmailThread>();
    // Add local threads first (contains real-time website inquiries)
    localThreads.forEach(t => threadMap.set(t.id, t));
    // Add cloud threads
    threads.forEach(t => {
      if (!threadMap.has(t.id)) {
        threadMap.set(t.id, t);
      }
    });

    const combinedThreads = Array.from(threadMap.values());

    // Calculate unread counts by folder
    const allUserThreads = dataStore.getEmailThreads(mailbox || undefined);
    threads.forEach(t => {
      if (!allUserThreads.some(u => u.id === t.id)) {
        allUserThreads.push(t);
      }
    });

    const counts = {
      inbox: allUserThreads.filter(t => t.folder === 'INBOX' && t.isUnread).length,
      starred: allUserThreads.filter(t => t.isStarred).length,
      important: allUserThreads.filter(t => t.isImportant).length,
      sent: allUserThreads.filter(t => t.folder === 'SENT').length,
      drafts: allUserThreads.filter(t => t.folder === 'DRAFTS').length,
      trash: allUserThreads.filter(t => t.folder === 'TRASH').length,
      spam: allUserThreads.filter(t => t.folder === 'SPAM').length
    };

    return NextResponse.json({
      success: true,
      threads: combinedThreads,
      counts
    });
  } catch (err: any) {
    console.warn('[Mail Threads] Fallback handler:', err.message);
    const localThreads = dataStore.getEmailThreads();
    return NextResponse.json({
      success: true,
      threads: localThreads,
      counts: {
        inbox: localThreads.filter(t => t.folder === 'INBOX' && t.isUnread).length,
        starred: localThreads.filter(t => t.isStarred).length,
        important: localThreads.filter(t => t.isImportant).length,
        sent: localThreads.filter(t => t.folder === 'SENT').length,
        drafts: localThreads.filter(t => t.folder === 'DRAFTS').length,
        trash: localThreads.filter(t => t.folder === 'TRASH').length,
        spam: localThreads.filter(t => t.folder === 'SPAM').length
      },
      source: 'local_data_store'
    });
  }
}
