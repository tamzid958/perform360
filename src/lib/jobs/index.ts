import type { JobHandler } from "@/types/job";
import { handleEmailSend } from "./email";
import { handleCycleActivate, handleCycleRemind, handleCycleAutoClose } from "./cycle";
import { handleEncryptionRotateKey } from "./encryption";
import { handleCleanupOtpSessions } from "./cleanup";
import { handleDataExport } from "./data-export";
import { handleCompanyDestroy } from "./company-destroy";
import { handleReportsExportCycle } from "./reports-export";

export const jobHandlers = new Map<string, JobHandler<never>>([
  ["email.send", handleEmailSend as JobHandler<never>],
  ["cycle.activate", handleCycleActivate as JobHandler<never>],
  ["cycle.remind", handleCycleRemind as JobHandler<never>],
  ["cycle.auto-close", handleCycleAutoClose as JobHandler<never>],
  ["encryption.rotate-key", handleEncryptionRotateKey as JobHandler<never>],
  ["cleanup.otp-sessions", handleCleanupOtpSessions as JobHandler<never>],
  ["data.export", handleDataExport as JobHandler<never>],
  ["company.destroy", handleCompanyDestroy as JobHandler<never>],
  ["reports.export-cycle", handleReportsExportCycle as JobHandler<never>],
]);
