import { describe, it, expect, vi, beforeEach } from "vitest";
import { clearSelectedCompany } from "@/lib/company-cookie";
import { parseResponse } from "../helpers";

const { POST } = await import("@/app/api/auth/clear-company/route");

describe("POST /api/auth/clear-company", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears the company cookie and returns success", async () => {
    const res = await POST();
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(clearSelectedCompany).toHaveBeenCalled();
  });
});
