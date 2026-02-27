export const APP_NAME = "Perform360";
export const APP_DESCRIPTION = "360° Performance Evaluation Platform";

export const OTP_CONFIG = {
  length: 6,
  expiryMinutes: 10,
  maxAttempts: 3,
  cooldownMinutes: 15,
  sessionDurationHours: 2,
  rateLimitPerEmail: 5,
} as const;

export const ROLES = {
  ADMIN: "ADMIN",
  HR: "HR",
  MANAGER: "MANAGER",
  MEMBER: "MEMBER",
} as const;

export const CYCLE_STATUSES = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  CLOSED: "CLOSED",
  ARCHIVED: "ARCHIVED",
} as const;

export const ASSIGNMENT_STATUSES = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  SUBMITTED: "SUBMITTED",
} as const;

export const TEAM_ROLES = {
  MANAGER: "MANAGER",
  DIRECT_REPORT: "DIRECT_REPORT",
  MEMBER: "MEMBER",
} as const;

export const RELATIONSHIP_LABELS: Record<string, string> = {
  manager: "Manager",
  direct_report: "Direct Report",
  peer: "Peer",
  self: "Self",
};
