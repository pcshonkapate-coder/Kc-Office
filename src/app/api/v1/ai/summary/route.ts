import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { type, content, client, budget } = body;

  if (type === 'lead_summary') {
    return NextResponse.json({
      data: {
        industry: 'Enterprise Software & Financial Tech',
        requirement: content ? `Analysis of: ${content.substring(0, 100)}...` : 'Automated AI customer support ticketing & agent co-pilot system.',
        potentialProject: 'Kapate OS AI Custom Implementation',
        complexity: 'High (Requires LLM Fine-tuning & RAG pipeline)',
        suggestedService: 'AI Solutions / Machine Learning',
        suggestedNextAction: 'Schedule Discovery Call with Lead Consultant & Execute NDA',
      }
    });
  }

  if (type === 'meeting_summary') {
    return NextResponse.json({
      data: {
        summary: 'Consulting discovery session covering technical architecture, security perimeter, and deliverable milestones.',
        requirements: ['Sub-second latency response', '99.9% uptime SLA', 'SOC 2 and ISO 27001 compliance', 'Custom prompt guardrails'],
        actionItems: ['Draft Statement of Work (SOW)', 'Establish staging sandbox environment', 'Finalize SLA terms'],
        risks: 'Strict data residency rules require isolated cloud VPC deployment.',
        nextSteps: 'Deliver formal proposal & project kickoff within 5 business days.'
      }
    });
  }

  if (type === 'proposal') {
    return NextResponse.json({
      data: {
        executiveSummary: `Strategic AI & Engineering engagement tailored for ${client || 'Enterprise Partner'}.`,
        scope: ['Data audit & preparation', 'Model fine-tuning & architecture', 'Backend API microservices', 'Executive observability dashboard'],
        deliverables: ['Production Docker artifacts', 'Security benchmark report', 'Integration SDK', 'Continuous SLA monitoring'],
        technology: ['TypeScript', 'Python', 'FastAPI', 'Next.js', 'MongoDB Atlas', 'Docker'],
        timeline: '8-12 Weeks',
        pricingStructure: `Milestone 1: 30% | Milestone 2: 40% | Milestone 3: 30% (${budget || '$50,000'})`
      }
    });
  }

  if (type === 'tasks') {
    return NextResponse.json({
      data: [
        { title: 'Requirements & Architectural Blueprint', priority: 'High', estimatedHours: 16 },
        { title: 'Database Schema & Zero-Trust Security Policy', priority: 'High', estimatedHours: 20 },
        { title: 'Core API Integration & Service Pipelines', priority: 'High', estimatedHours: 32 },
        { title: 'Frontend UI Dashboards & Real-time State Sync', priority: 'Medium', estimatedHours: 24 },
        { title: 'Automated Test Suite & Edge-Case Validation', priority: 'Medium', estimatedHours: 18 },
        { title: 'Production Containerization & Load Testing', priority: 'Urgent', estimatedHours: 14 },
      ]
    });
  }

  if (type === 'email_summary') {
    const threadSubject = body.subject || 'Enterprise Discussion';
    const lastSnippet = body.snippet || (body.messages && body.messages[body.messages.length - 1]?.body) || 'Project delivery and milestone updates.';
    return NextResponse.json({
      data: {
        summary: `Thread focuses on architectural milestones, SLA compliance, and operational sign-off for "${threadSubject}". Key discussions: ${lastSnippet.substring(0, 150)}. Deliverables align with Kapate OS verified roadmap.`,
        actionItems: [
          `Review technical deliverables and milestone sign-off for "${threadSubject}"`,
          `Validate SLA & compliance targets with ${body.senderName || 'Stakeholder'}`,
          `Schedule engineering sync and update project deliverables in Kapate OS`
        ]
      }
    });
  }

  if (type === 'email_draft_reply') {
    const sender = body.senderName ? body.senderName.split(' ')[0] : 'Colleague';
    const threadSubject = body.subject || 'Project Milestone';
    const user = auth.user.name || 'Kapate OS Team';
    const draft = `Hi ${sender},\n\nThank you for the detailed update regarding "${threadSubject}".\n\nI have reviewed the current progress, technical specifications, and timeline against our Kapate OS SLA criteria. Everything is on schedule and meets our quality benchmarks.\n\nPlease proceed with the next scheduled milestone, and keep the team updated through the portal.\n\nBest regards,\n${user}\nKapate Consultancy`;
    return NextResponse.json({
      data: {
        reply: draft
      }
    });
  }

  return NextResponse.json({ error: 'Invalid AI prompt type' }, { status: 400 });
}
