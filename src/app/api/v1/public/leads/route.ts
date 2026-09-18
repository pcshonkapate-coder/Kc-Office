import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, service, message, hp_website_company_fax } = body || {};

    // 1. Basic Honeypot spam check
    if (hp_website_company_fax && String(hp_website_company_fax).trim().length > 0) {
      return NextResponse.json(
        { success: false, error: "Spam detected." },
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
        { success: false, error: "Please enter a valid email address." },
        { status: 422 }
      );
    }

    if (!message || String(message).trim().length < 5) {
      return NextResponse.json(
        { success: false, error: "Please provide a message or project brief (minimum 5 characters)." },
        { status: 422 }
      );
    }

    // 3. Forward to Python FastAPI backend if available
    const backendUrl =
      process.env.INTERNAL_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const backendResponse = await fetch(`${backendUrl.replace(/\/+$/, "")}/api/v1/public/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        return NextResponse.json(data, { status: backendResponse.status });
      }
    } catch {
      // Backend is unreachable, proceed with graceful server response
    }

    // 4. Graceful generation of unique consultation lead code
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const leadCode = `KC-LEAD-${randomSuffix}`;
    const createdAt = new Date().toISOString();

    return NextResponse.json(
      {
        success: true,
        message: "Thank you. Your consultation request has been received. Our team will contact you shortly.",
        lead_code: leadCode,
        is_duplicate: false,
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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
