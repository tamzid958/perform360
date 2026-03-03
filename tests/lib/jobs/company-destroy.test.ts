import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { getJobStatus } from "@/lib/queue";
import { writeAuditLog } from "@/lib/audit";
import { sendEmail, getCompanyDestroyedEmail } from "@/lib/email";
import { cascadeDeleteCompany } from "@/lib/company-cascade-delete";
import { handleCompanyDestroy } from "@/lib/jobs/company-destroy";

const basePayload = {
  companyId: "co-1",
  userId: "user-1",
  userEmail: "admin@company.com",
  companyName: "Acme Corp",
  adminEmails: ["admin@company.com", "hr@company.com"],
};

describe("handleCompanyDestroy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("deletes company and sends confirmation emails", async () => {
    vi.mocked(prisma.company.findUnique).mockResolvedValue({ id: "co-1" } as any);

    const promise = handleCompanyDestroy(basePayload);
    await vi.runAllTimersAsync();
    await promise;

    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "company_destroy",
        companyId: "co-1",
      })
    );
    expect(getCompanyDestroyedEmail).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(cascadeDeleteCompany).toHaveBeenCalledWith("co-1");
  });

  it("skips when company already deleted", async () => {
    vi.mocked(prisma.company.findUnique).mockResolvedValue(null);

    const promise = handleCompanyDestroy(basePayload);
    await vi.runAllTimersAsync();
    await promise;

    expect(cascadeDeleteCompany).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("waits for export job to complete before destroying", async () => {
    vi.mocked(getJobStatus)
      .mockResolvedValueOnce({ status: "PROCESSING" } as any)
      .mockResolvedValueOnce({ status: "COMPLETED" } as any);
    vi.mocked(prisma.company.findUnique).mockResolvedValue({ id: "co-1" } as any);

    const promise = handleCompanyDestroy({
      ...basePayload,
      exportJobId: "export-job-1",
    });
    await vi.runAllTimersAsync();
    await promise;

    expect(getJobStatus).toHaveBeenCalledWith("export-job-1");
    expect(cascadeDeleteCompany).toHaveBeenCalledWith("co-1");
  });

  it("proceeds when export job is DEAD", async () => {
    vi.mocked(getJobStatus).mockResolvedValueOnce({ status: "DEAD" } as any);
    vi.mocked(prisma.company.findUnique).mockResolvedValue({ id: "co-1" } as any);

    const promise = handleCompanyDestroy({
      ...basePayload,
      exportJobId: "export-job-1",
    });
    await vi.runAllTimersAsync();
    await promise;

    expect(cascadeDeleteCompany).toHaveBeenCalledWith("co-1");
  });

  it("proceeds when export job not found", async () => {
    vi.mocked(getJobStatus).mockResolvedValueOnce(null);
    vi.mocked(prisma.company.findUnique).mockResolvedValue({ id: "co-1" } as any);

    const promise = handleCompanyDestroy({
      ...basePayload,
      exportJobId: "export-job-1",
    });
    await vi.runAllTimersAsync();
    await promise;

    expect(cascadeDeleteCompany).toHaveBeenCalledWith("co-1");
  });

  it("does not fail if one confirmation email fails", async () => {
    vi.mocked(prisma.company.findUnique).mockResolvedValue({ id: "co-1" } as any);
    vi.mocked(sendEmail)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("SMTP error"));

    const promise = handleCompanyDestroy(basePayload);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.not.toThrow();
    expect(cascadeDeleteCompany).toHaveBeenCalledWith("co-1");
  });
});
