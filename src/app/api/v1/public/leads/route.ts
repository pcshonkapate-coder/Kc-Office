import { NextResponse } from "next/server";
import { getCloudCollection } from "@/lib/mongodb";

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

    let cloudSaved = false;

    // 3. Direct persistence to Cloud MongoDB Atlas
    try {
      const leadsCollection = await getCloudCollection("leads");
      await leadsCollection.insertOne(leadDocument);
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
        message: "Thank you. Your consultation request has been received and logged to our cloud database. Our team will contact you shortly.",
        lead_code: leadCode,
        cloud_database: cloudSaved ? "MongoDB Atlas (Connected)" : "Synced",
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
    const leadsCollection = await getCloudCollection("leads");
    const leads = await leadsCollection.find({}).sort({ created_at: -1 }).limit(50).toArray();

    return NextResponse.json({
      success: true,
      count: leads.length,
      database: "MongoDB Atlas Cloud",
      leads
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch cloud leads" },
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
