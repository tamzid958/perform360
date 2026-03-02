import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { validateEvaluationSession } from "@/lib/session-validation";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

interface TemplateQuestion {
  id: string;
  text: string;
  type: "rating_scale" | "text" | "multiple_choice";
  required: boolean;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: string[];
  conditionalOn?: string;
}

interface TemplateSection {
  title: string;
  description?: string;
  questions: TemplateQuestion[];
}

// ─── GET: Load evaluation form ───
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Validate OTP session from cookie (supports both direct and summary sessions)
    const sessionToken = request.cookies.get("evaluation_session")?.value;
    if (!sessionToken) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Authentication required", code: "NO_SESSION" },
        { status: 401 }
      );
    }

    const result = await validateEvaluationSession(sessionToken, token);
    if (!result.ok) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: result.error, code: result.code },
        { status: result.status }
      );
    }

    const { assignment } = result.session;

    if (assignment.status === "SUBMITTED") {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "This evaluation has already been submitted", code: "ALREADY_SUBMITTED" },
        { status: 410 }
      );
    }

    if (assignment.cycle.status !== "ACTIVE") {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "This evaluation cycle is no longer active", code: "CYCLE_INACTIVE" },
        { status: 410 }
      );
    }

    // Load template (from assignment's per-team template)
    const template = await prisma.evaluationTemplate.findFirst({
      where: { id: assignment.templateId },
      select: { sections: true },
    });

    if (!template) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Evaluation template not found" },
        { status: 500 }
      );
    }

    // Fetch subject name and cycle name
    const [subject, cycle] = await Promise.all([
      prisma.user.findFirst({
        where: { id: assignment.subjectId },
        select: { name: true },
      }),
      prisma.evaluationCycle.findUnique({
        where: { id: assignment.cycleId },
        select: { name: true },
      }),
    ]);

    return NextResponse.json<ApiResponse<{
      subjectName: string;
      cycleName: string;
      relationship: string;
      sections: TemplateSection[];
    }>>({
      success: true,
      data: {
        subjectName: subject?.name ?? "Unknown",
        cycleName: cycle?.name ?? "Unknown",
        relationship: assignment.relationship,
        sections: template.sections as unknown as TemplateSection[],
      },
    });
  } catch (error) {
    console.error("Form loading error:", error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to load evaluation form" },
      { status: 500 }
    );
  }
}
