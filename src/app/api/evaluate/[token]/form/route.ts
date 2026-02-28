import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // Validate OTP session from cookie
    const sessionToken = request.cookies.get("evaluation_session")?.value;
    if (!sessionToken) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Authentication required", code: "NO_SESSION" },
        { status: 401 }
      );
    }

    const otpSession = await prisma.otpSession.findUnique({
      where: { sessionToken },
      include: {
        assignment: {
          include: {
            cycle: {
              select: {
                name: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!otpSession || !otpSession.sessionExpiry || otpSession.sessionExpiry < new Date()) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Session expired. Please verify again.", code: "SESSION_EXPIRED" },
        { status: 401 }
      );
    }

    if (otpSession.assignment.token !== token) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Session does not match this evaluation", code: "SESSION_MISMATCH" },
        { status: 403 }
      );
    }

    const { assignment } = otpSession;

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

    // Fetch subject name
    const subject = await prisma.user.findFirst({
      where: { id: assignment.subjectId },
      select: { name: true },
    });

    return NextResponse.json<ApiResponse<{
      subjectName: string;
      cycleName: string;
      relationship: string;
      sections: TemplateSection[];
    }>>({
      success: true,
      data: {
        subjectName: subject?.name ?? "Unknown",
        cycleName: assignment.cycle.name,
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
