import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getCloudCollection } from '@/lib/mongodb';
import { EmailThread, Task } from '@/types';

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if ('errorResponse' in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const { action, threadIds = [], threadId, targetFolder, label, taskData, projectId, projectName } = body;

    const ids: string[] = threadId ? [threadId] : Array.isArray(threadIds) ? threadIds : [];
    if (ids.length === 0 && action !== 'CONVERT_TO_TASK') {
      return NextResponse.json({ success: false, error: 'No thread ID provided.' }, { status: 400 });
    }

    const threadsColl = await getCloudCollection<EmailThread>('email_threads');

    switch (action) {
      case 'MARK_READ':
        await threadsColl.updateMany(
          { id: { $in: ids } },
          { $set: { isUnread: false } }
        );
        break;

      case 'MARK_UNREAD':
        await threadsColl.updateMany(
          { id: { $in: ids } },
          { $set: { isUnread: true } }
        );
        break;

      case 'TOGGLE_STAR':
        for (const id of ids) {
          const thread = await threadsColl.findOne({ id });
          if (thread) {
            await threadsColl.updateOne({ id }, { $set: { isStarred: !thread.isStarred } });
          }
        }
        break;

      case 'TOGGLE_IMPORTANT':
        for (const id of ids) {
          const thread = await threadsColl.findOne({ id });
          if (thread) {
            await threadsColl.updateOne({ id }, { $set: { isImportant: !thread.isImportant } });
          }
        }
        break;

      case 'MOVE_TO_FOLDER':
        if (!targetFolder) {
          return NextResponse.json({ success: false, error: 'Target folder is required.' }, { status: 400 });
        }
        await threadsColl.updateMany(
          { id: { $in: ids } },
          { $set: { folder: targetFolder } }
        );
        break;

      case 'ADD_LABEL':
        if (!label) {
          return NextResponse.json({ success: false, error: 'Label name is required.' }, { status: 400 });
        }
        await threadsColl.updateMany(
          { id: { $in: ids } },
          { $addToSet: { labels: label } }
        );
        break;

      case 'REMOVE_LABEL':
        if (!label) {
          return NextResponse.json({ success: false, error: 'Label name is required.' }, { status: 400 });
        }
        await threadsColl.updateMany(
          { id: { $in: ids } },
          { $pull: { labels: label } as any }
        );
        break;

      case 'PERMANENT_DELETE':
        await threadsColl.deleteMany({ id: { $in: ids } });
        break;

      case 'LINK_TO_PROJECT':
        if (!projectId) {
          return NextResponse.json({ success: false, error: 'Project ID is required.' }, { status: 400 });
        }
        await threadsColl.updateMany(
          { id: { $in: ids } },
          { $set: { relatedProjectId: projectId, relatedProjectName: projectName || 'Active Project' } }
        );
        break;

      case 'CONVERT_TO_TASK': {
        const tasksColl = await getCloudCollection<Task>('tasks');
        const taskId = `TSK-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
        
        const newTask: Task = {
          id: taskId,
          title: taskData.title || 'Follow up on email request',
          description: taskData.description || 'Generated from internal corporate mail thread.',
          projectId: taskData.projectId || projectId || 'PRJ-INTERNAL',
          projectName: taskData.projectName || projectName || 'Internal Operations',
          assignedTo: taskData.assignedTo || auth.user.name,
          priority: taskData.priority || 'High',
          status: 'TODO',
          dueDate: taskData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimatedHours: taskData.estimatedHours || 4,
          loggedHours: 0,
        };

        await tasksColl.insertOne(newTask as any);

        // Tag the thread with created task ID
        if (threadId || ids[0]) {
          await threadsColl.updateOne(
            { id: threadId || ids[0] },
            { $set: { linkedTaskId: taskId } }
          );
        }

        return NextResponse.json({
          success: true,
          message: `Created task ${taskId} from email thread.`,
          task: newTask
        });
      }

      default:
        return NextResponse.json({ success: false, error: `Unsupported action "${action}".` }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Action ${action} executed successfully.` });
  } catch (err: any) {
    console.error('Mail Action API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
