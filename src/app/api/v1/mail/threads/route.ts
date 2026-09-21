import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getCloudCollection } from '@/lib/mongodb';
import { EmailThread } from '@/types';

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const url = new URL(req.url);
    const mailbox = url.searchParams.get('mailbox'); // e.g. 'shon@kapateconsultancy.in' or 'ALL'
    const folder = url.searchParams.get('folder'); // 'INBOX', 'SENT', 'DRAFTS', 'TRASH', 'SPAM', 'ARCHIVE', 'STARRED', 'IMPORTANT'
    const label = url.searchParams.get('label');
    const query = url.searchParams.get('q');

    const threadsColl = await getCloudCollection<EmailThread>('email_threads');

    const filter: Record<string, any> = {};

    // Filter by mailbox
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

    // Filter by label
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

    // Full text search
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

    const threads = await threadsColl
      .find(filter)
      .sort({ updatedAt: -1, lastMessageAt: -1 })
      .toArray();

    // Calculate unread counts by folder
    const allUserThreads = await threadsColl.find(
      mailbox && mailbox !== 'ALL'
        ? {
            $or: [
              { 'participants.email': mailbox.toLowerCase() },
              { 'messages.from.email': mailbox.toLowerCase() },
              { 'messages.to.email': mailbox.toLowerCase() }
            ]
          }
        : {}
    ).toArray();

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
      threads,
      counts
    });
  } catch (err: any) {
    console.warn('[Mail Threads] MongoDB Atlas unreachable, returning resilient fallback:', err.message);
    const fallbackCounts = {
      inbox: 0,
      starred: 0,
      important: 0,
      sent: 0,
      drafts: 0,
      trash: 0,
      spam: 0
    };
    return NextResponse.json({
      success: true,
      threads: [],
      counts: fallbackCounts,
      source: 'local_resilient_fallback',
      warning: err.message
    });
  }
}
