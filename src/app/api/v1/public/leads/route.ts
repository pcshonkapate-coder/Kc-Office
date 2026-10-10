import { NextResponse } from "next/server";
import { getCloudCollection } from "@/lib/mongodb";
import { dataStore } from "@/lib/dataStore";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, company, service, budget, message, hp_website_company_fax } = body || {};

    // 1. Basic Honeypot spam check
    if (hp_website_company_fax && String(hp_website_company_fax).trim().length > 0) {
      return NextResponse.json(
        { success: false, error: "Spam submission rejected." },
        { status: 400 }
      );
    }

    // 2. Validate mandatory fields
    if (!name || String(name).trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Please enter your full name (minimum 2 characters)." },
        { status: 422 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(String(email).trim())) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid work email address." },
        { status: 422 }
      );
    }

    if (!message || String(message).trim().length < 5) {
      return NextResponse.json(
        { success: false, error: "Please provide a project brief (minimum 5 characters)." },
        { status: 422 }
      );
    }

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const leadCode = `KC-LEAD-${randomSuffix}`;
    const createdAt = new Date().toISOString();

    const leadDocument = {
      lead_code: leadCode,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: phone ? String(phone).trim() : null,
      company: company ? String(company).trim() : null,
      service: service ? String(service).trim() : "General Consultation",
      budget: budget ? String(budget).trim() : "To be discussed",
      message: String(message).trim(),
      status: "NEW",
      source: "Kapate OS Website & Public Portal",
      created_at: createdAt,
      ip_address: request.headers.get("x-forwarded-for") || "direct",
      user_agent: request.headers.get("user-agent") || "unknown"
    };

    // Synchronously commit to authoritative internal dataStore so it appears immediately in the CRM
    dataStore.addLead({
      id: leadCode,
      name: leadDocument.name,
      email: leadDocument.email,
      phone: leadDocument.phone || '',
      company: leadDocument.company || 'Website Inquiry',
      service: leadDocument.service,
      budget: leadDocument.budget,
      source: 'Website Form',
      owner: 'Shon Kapate',
      status: 'New Lead',
      score: 90,
      description: leadDocument.message,
      created: createdAt.split('T')[0],
      nextFollowUp: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
    });

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const emailBody = `### Inbound Client Consultation & Project Enquiry\n\n**Client Contact:**\n- **Client Name:** ${leadDocument.name}\n- **Email:** ${leadDocument.email}\n- **Phone:** ${leadDocument.phone || 'Not provided'}\n- **Company / Organization:** ${leadDocument.company || 'Direct Client'}\n- **Service Requested:** ${leadDocument.service}\n- **Estimated Budget:** ${leadDocument.budget}\n- **Reference Tracking ID:** ${leadCode}\n\n**Client Message / Project Brief:**\n> ${leadDocument.message}\n\n---\n*Logged to Kapate OS via Public Portal on ${now.toLocaleString()}*`;

    // 2b. Dispatch to internal corporate Mailbox so the message appears in OS Inbox
    const emailMessageId = `MSG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const emailThreadId = `THR-${leadCode}`;

    const newEmailMsg = {
      id: emailMessageId,
      threadId: emailThreadId,
      from: { name: leadDocument.name, email: leadDocument.email, type: 'TO' as const },
      to: [
        { name: 'Executive Office Mailbox', email: 'admin@kapateconsultancy.in', type: 'TO' as const },
        { name: 'Shon Kapate', email: 'shon@kapateconsultancy.in', type: 'TO' as const },
        { name: 'Enterprise Sales Desk', email: 'sales@kapateconsultancy.in', type: 'TO' as const }
      ],
      subject: `New Client Enquiry [${leadCode}]: ${leadDocument.service} — ${leadDocument.name}`,
      body: emailBody,
      snippet: leadDocument.message.substring(0, 120),
      timestamp: timeStr,
      date: createdAt.split('T')[0],
      isRead: false,
      isStarred: true,
      isImportant: true,
      folder: 'INBOX' as const,
      priority: 'High' as const,
      labels: ['Client', 'Urgent'],
      attachments: []
    };

    const newEmailThread = {
      id: emailThreadId,
      subject: `New Client Enquiry [${leadCode}]: ${leadDocument.service} — ${leadDocument.name}`,
      snippet: leadDocument.message.substring(0, 120),
      lastMessageTimestamp: timeStr,
      lastSenderName: leadDocument.name,
      isUnread: true,
      isStarred: true,
      isImportant: true,
      folder: 'INBOX' as const,
      labels: ['Client', 'Urgent'],
      priority: 'High' as const,
      messageCount: 1,
      hasAttachments: false,
      participants: [
        { name: leadDocument.name, email: leadDocument.email, type: 'TO' as const },
        { name: 'Executive Office Mailbox', email: 'admin@kapateconsultancy.in', type: 'TO' as const },
        { name: 'Shon Kapate', email: 'shon@kapateconsultancy.in', type: 'TO' as const }
      ],
      messages: [newEmailMsg]
    };

    dataStore.addEmailThread(newEmailThread as any);
    dataStore.addEmailMessage(newEmailMsg as any);

    // 2c. Dispatch Real-Time In-App Notification
    dataStore.addNotification({
      id: `notif-${Date.now()}`,
      userId: 'all',
      title: `New Client Enquiry (${leadCode})`,
      message: `${leadDocument.name} submitted an enquiry for ${leadDocument.service} (${leadDocument.company || 'Website Form'})`,
      type: 'lead',
      read: false,
      timestamp: now.toISOString(),
      actionUrl: '/os?tab=mail'
    });

    // 2d. Dispatch Team Chat Alert
    dataStore.addChatMessage({
      id: `chat-${Date.now()}`,
      channelId: 'chan-general',
      senderId: 'sys-bot',
      senderName: 'Kapate OS Portal Bot',
      senderRole: 'SUPER_ADMIN',
      content: `🔔 **New Client Consultation Enquiry Received [${leadCode}]**\n• **Client:** ${leadDocument.name} (${leadDocument.email})\n• **Practice Area:** ${leadDocument.service}\n• **Company:** ${leadDocument.company || 'Direct Client'}\n• **Brief:** "${leadDocument.message}"`,
      timestamp: now.toISOString()
    });

    let cloudSaved = false;

    // 3. Direct persistence to Cloud MongoDB Atlas (best-effort)
    try {
      const leadsCollection = await getCloudCollection("leads");
      await leadsCollection.insertOne({
        ...leadDocument,
        id: leadCode,
        status: 'New Lead',
        created: createdAt.split('T')[0],
        owner: 'Shon Kapate',
        score: 90
      });

      const threadsCollection = await getCloudCollection("email_threads");
      await threadsCollection.insertOne(newEmailThread as any);

      cloudSaved = true;
    } catch (mongoErr: any) {
      console.warn("MongoDB Atlas direct insert warning:", mongoErr?.message || mongoErr);
    }

    // 4. Also forward to Python FastAPI backend if reachable
    const backendUrl =
      process.env.INTERNAL_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      await fetch(`${backendUrl.replace(/\/+$/, "")}/api/v1/public/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadDocument),
        signal: controller.signal,
      }).catch(() => {});

      clearTimeout(timeoutId);
    } catch {
      // Graceful fallback
    }

    return NextResponse.json(
      {
        success: true,
        message: "Thank you. Your consultation request has been received and logged to our system. Our team will contact you shortly.",
        lead_code: leadCode,
        cloud_database: cloudSaved ? "MongoDB Atlas (Connected)" : "Synced locally",
        created_at: createdAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    let leads: any[] = [];
    try {
      const leadsCollection = await getCloudCollection("leads");
      leads = await leadsCollection.find({}).sort({ created_at: -1 }).limit(50).toArray();
    } catch {
      // Fallback to dataStore
      leads = dataStore.getLeads().map(l => ({
        lead_code: l.id,
        name: l.name,
        email: l.email,
        phone: l.phone,
        company: l.company,
        service: l.service,
        budget: l.budget,
        message: l.description,
        status: l.status,
        source: l.source,
        created_at: l.created
      }));
    }

    return NextResponse.json({
      success: true,
      count: leads.length,
      database: "Kapate OS Unified Store",
      leads
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
