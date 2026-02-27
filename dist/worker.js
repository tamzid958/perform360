"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/lib/email/providers/resend.ts
var resend_exports = {};
__export(resend_exports, {
  resendProvider: () => resendProvider
});
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY env var is required for resend provider");
    }
    _resend = new import_resend.Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}
var import_resend, DEFAULT_FROM, _resend, resendProvider;
var init_resend = __esm({
  "src/lib/email/providers/resend.ts"() {
    "use strict";
    import_resend = require("resend");
    DEFAULT_FROM = process.env.EMAIL_FROM || "Performs360 <noreply@performs360.com>";
    _resend = null;
    resendProvider = {
      async send({ to, subject, html, text }) {
        const { error } = await getResend().emails.send({
          from: DEFAULT_FROM,
          to,
          subject,
          html,
          ...text ? { text } : {}
        });
        if (error) {
          throw new Error(`Resend: failed to send email: ${error.message}`);
        }
      },
      async sendWithAttachments({
        to,
        subject,
        html,
        text,
        attachments
      }) {
        const { error } = await getResend().emails.send({
          from: DEFAULT_FROM,
          to,
          subject,
          html,
          ...text ? { text } : {},
          attachments: attachments.map((a) => ({
            filename: a.filename,
            content: typeof a.content === "string" ? Buffer.from(a.content) : a.content,
            contentType: a.contentType
          }))
        });
        if (error) {
          throw new Error(`Resend: failed to send email: ${error.message}`);
        }
      }
    };
  }
});

// src/lib/email/providers/brevo.ts
var brevo_exports = {};
__export(brevo_exports, {
  brevoProvider: () => brevoProvider
});
function getApiKey() {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    throw new Error("BREVO_API_KEY env var is required for brevo provider");
  }
  return key;
}
function parseFrom(from) {
  const match = from.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { email: from };
}
async function brevoSend(payload) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": getApiKey(),
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo: failed to send email (${res.status}): ${body}`);
  }
}
var DEFAULT_FROM2, brevoProvider;
var init_brevo = __esm({
  "src/lib/email/providers/brevo.ts"() {
    "use strict";
    DEFAULT_FROM2 = process.env.EMAIL_FROM || "Performs360 <noreply@performs360.com>";
    brevoProvider = {
      async send({ to, subject, html, text }) {
        const sender = parseFrom(DEFAULT_FROM2);
        await brevoSend({
          sender,
          to: [{ email: to }],
          subject,
          htmlContent: html,
          ...text ? { textContent: text } : {}
        });
      },
      async sendWithAttachments({
        to,
        subject,
        html,
        text,
        attachments
      }) {
        const sender = parseFrom(DEFAULT_FROM2);
        await brevoSend({
          sender,
          to: [{ email: to }],
          subject,
          htmlContent: html,
          ...text ? { textContent: text } : {},
          attachment: attachments.map((a) => ({
            name: a.filename,
            content: typeof a.content === "string" ? a.content : a.content.toString("base64")
          }))
        });
      }
    };
  }
});

// src/lib/email/providers/smtp.ts
var smtp_exports = {};
__export(smtp_exports, {
  smtpProvider: () => smtpProvider
});
function getTransport() {
  if (!_transport) {
    if (!process.env.SMTP_HOST) {
      throw new Error("SMTP_HOST env var is required for smtp provider");
    }
    _transport = import_nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return _transport;
}
var import_nodemailer, DEFAULT_FROM3, _transport, smtpProvider;
var init_smtp = __esm({
  "src/lib/email/providers/smtp.ts"() {
    "use strict";
    import_nodemailer = __toESM(require("nodemailer"));
    DEFAULT_FROM3 = process.env.EMAIL_FROM || "Performs360 <noreply@performs360.com>";
    _transport = null;
    smtpProvider = {
      async send({ to, subject, html, text }) {
        await getTransport().sendMail({
          from: DEFAULT_FROM3,
          to,
          subject,
          html,
          ...text ? { text } : {}
        });
      },
      async sendWithAttachments({
        to,
        subject,
        html,
        text,
        attachments
      }) {
        await getTransport().sendMail({
          from: DEFAULT_FROM3,
          to,
          subject,
          html,
          ...text ? { text } : {},
          attachments: attachments.map((a) => ({
            filename: a.filename,
            content: typeof a.content === "string" ? Buffer.from(a.content, "base64") : a.content,
            contentType: a.contentType
          }))
        });
      }
    };
  }
});

// src/lib/prisma.ts
var import_client = require("@prisma/client");
var globalForPrisma = globalThis;
var prisma = globalForPrisma.prisma || new import_client.PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// src/lib/constants.ts
var RELATIONSHIP_LABELS = {
  manager: "Manager",
  direct_report: "Direct Report",
  peer: "Peer",
  self: "Self",
  external: "External"
};
var BLOG_CONFIG = {
  dailyArticleCount: 1,
  minWords: 800,
  maxWords: 1500,
  postsPerPage: 9
};
var JOB_CONFIG = {
  pollIntervalMs: 1e3,
  schedulerIntervalMs: 5 * 60 * 1e3,
  defaultMaxAttempts: 3,
  retentionDays: 7,
  staleThresholdMinutes: 30,
  reEncryptBatchSize: 100
};

// src/lib/queue.ts
async function enqueue(type, payload, options) {
  const job = await prisma.jobQueue.create({
    data: {
      type,
      payload,
      priority: options?.priority ?? 0,
      maxAttempts: options?.maxAttempts ?? JOB_CONFIG.defaultMaxAttempts,
      runAt: options?.runAt ?? /* @__PURE__ */ new Date()
    }
  });
  return job.id;
}
async function enqueueBatch(jobs) {
  const created = await prisma.$transaction(
    jobs.map(
      (j) => prisma.jobQueue.create({
        data: {
          type: j.type,
          payload: j.payload,
          priority: j.options?.priority ?? 0,
          maxAttempts: j.options?.maxAttempts ?? JOB_CONFIG.defaultMaxAttempts,
          runAt: j.options?.runAt ?? /* @__PURE__ */ new Date()
        }
      })
    )
  );
  return created.map((j) => j.id);
}
async function dequeue(types) {
  const typeFilter = types && types.length > 0 ? `AND "type" IN (${types.map((t) => `'${t}'`).join(",")})` : "";
  const rows = await prisma.$queryRawUnsafe(`
    UPDATE "JobQueue"
    SET "status" = 'PROCESSING',
        "startedAt" = NOW(),
        "attempts" = "attempts" + 1,
        "updatedAt" = NOW()
    WHERE "id" = (
      SELECT "id" FROM "JobQueue"
      WHERE "status" = 'PENDING'
        AND "runAt" <= NOW()
        ${typeFilter}
      ORDER BY "priority" DESC, "runAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  `);
  return rows.length > 0 ? rows[0] : null;
}
async function complete(jobId) {
  await prisma.jobQueue.update({
    where: { id: jobId },
    data: {
      status: "COMPLETED",
      completedAt: /* @__PURE__ */ new Date()
    }
  });
}
async function fail(jobId, error, attempts, maxAttempts) {
  const truncatedError = error.substring(0, 2e3);
  if (attempts >= maxAttempts) {
    await prisma.jobQueue.update({
      where: { id: jobId },
      data: {
        status: "DEAD",
        lastError: truncatedError,
        completedAt: /* @__PURE__ */ new Date()
      }
    });
    return;
  }
  const backoffMs = Math.pow(5, attempts) * 1e3;
  const runAt = new Date(Date.now() + backoffMs);
  await prisma.jobQueue.update({
    where: { id: jobId },
    data: {
      status: "PENDING",
      lastError: truncatedError,
      runAt
    }
  });
}
async function getJobStatus(jobId) {
  return prisma.jobQueue.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      type: true,
      status: true,
      lastError: true,
      attempts: true,
      maxAttempts: true,
      createdAt: true,
      completedAt: true
    }
  });
}
async function recoverStaleJobs() {
  const threshold = new Date(
    Date.now() - JOB_CONFIG.staleThresholdMinutes * 60 * 1e3
  );
  const result = await prisma.jobQueue.updateMany({
    where: {
      status: "PROCESSING",
      startedAt: { lt: threshold }
    },
    data: {
      status: "PENDING",
      lastError: "Recovered from stale PROCESSING state (worker restart)"
    }
  });
  return result.count;
}
async function pruneOldJobs(retentionDays = JOB_CONFIG.retentionDays) {
  const cutoff = new Date(
    Date.now() - retentionDays * 24 * 60 * 60 * 1e3
  );
  const result = await prisma.jobQueue.deleteMany({
    where: {
      status: { in: ["COMPLETED", "DEAD"] },
      createdAt: { lt: cutoff }
    }
  });
  return result.count;
}
async function hasPendingJob(type) {
  const existing = await prisma.jobQueue.findFirst({
    where: {
      type,
      status: { in: ["PENDING", "PROCESSING"] }
    },
    select: { id: true }
  });
  return existing !== null;
}

// src/lib/queue-worker.ts
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function timestamp() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function createWorker(handlers, options) {
  const pollInterval = options?.pollIntervalMs ?? JOB_CONFIG.pollIntervalMs;
  let running = false;
  let processing = false;
  async function processJob(job) {
    const handler = handlers.get(job.type);
    if (!handler) {
      await fail(job.id, `Unknown job type: ${job.type}`, job.attempts, job.maxAttempts);
      console.error(`[Worker] ${timestamp()} Unknown job type: ${job.type} (${job.id})`);
      return;
    }
    const start = Date.now();
    console.log(`[Worker] ${timestamp()} Processing ${job.type} (${job.id}), attempt ${job.attempts}/${job.maxAttempts}`);
    try {
      await handler(job.payload, job.id);
      await complete(job.id);
      const duration = Date.now() - start;
      console.log(`[Worker] ${timestamp()} Completed ${job.id} (${duration}ms)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await fail(job.id, message, job.attempts, job.maxAttempts);
      const status = job.attempts >= job.maxAttempts ? "DEAD" : "retrying";
      console.error(`[Worker] ${timestamp()} Failed ${job.id}: ${message} (${status})`);
    }
  }
  async function poll() {
    while (running) {
      try {
        const job = await dequeue();
        if (!job) {
          await sleep(pollInterval);
          continue;
        }
        processing = true;
        await processJob(job);
        processing = false;
      } catch (error) {
        processing = false;
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[Worker] ${timestamp()} Poll error: ${message}`);
        await sleep(pollInterval);
      }
    }
  }
  return {
    async start() {
      running = true;
      console.log(`[Worker] ${timestamp()} Starting (poll interval: ${pollInterval}ms)`);
      const recovered = await recoverStaleJobs();
      if (recovered > 0) {
        console.log(`[Worker] ${timestamp()} Recovered ${recovered} stale jobs`);
      }
      await poll();
      console.log(`[Worker] ${timestamp()} Stopped gracefully`);
    },
    async stop() {
      console.log(`[Worker] ${timestamp()} Shutting down...`);
      running = false;
      const deadline = Date.now() + 6e4;
      while (processing && Date.now() < deadline) {
        await sleep(500);
      }
      if (processing) {
        console.warn(`[Worker] ${timestamp()} Forced shutdown \u2014 job still processing`);
      }
    }
  };
}

// src/lib/email/factory.ts
var _provider = null;
function getEmailProvider() {
  if (!_provider) {
    const name = process.env.EMAIL_PROVIDER || "smtp";
    _provider = createProvider(name);
  }
  return _provider;
}
function createProvider(name) {
  switch (name) {
    case "resend": {
      const { resendProvider: resendProvider2 } = (init_resend(), __toCommonJS(resend_exports));
      return resendProvider2;
    }
    case "brevo": {
      const { brevoProvider: brevoProvider2 } = (init_brevo(), __toCommonJS(brevo_exports));
      return brevoProvider2;
    }
    case "smtp": {
      const { smtpProvider: smtpProvider2 } = (init_smtp(), __toCommonJS(smtp_exports));
      return smtpProvider2;
    }
    default:
      throw new Error(
        `Unknown EMAIL_PROVIDER "${name}". Valid options: resend, brevo, smtp`
      );
  }
}

// src/lib/email/templates.ts
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function emailWrapper(subtitle, bodyContent) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="480" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
              <tr>
                <td>
                  <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 600; color: #1d1d1f;">Performs360</h1>
                  <p style="margin: 0 0 24px; font-size: 14px; color: #86868b;">${subtitle}</p>
                  ${bodyContent}
                </td>
              </tr>
            </table>
            <p style="margin: 24px 0 0; font-size: 12px; color: #a1a1a6; text-align: center;">Performs360 &mdash; 360&deg; Performance Evaluation</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
function ctaButton(href, label) {
  return `<a href="${escapeHtml(href)}" style="display: inline-block; background: #0071e3; color: white; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-size: 15px; font-weight: 500;">${escapeHtml(label)}</a>`;
}
function getSummaryInviteEmail(recipientName, cycleName, assignments, summaryUrl) {
  const assignmentListHtml = assignments.map(
    (a) => `<li style="margin: 4px 0; font-size: 14px; color: #48484a;"><strong>${escapeHtml(a.subjectName)}</strong> <span style="color: #86868b;">&middot; ${escapeHtml(a.relationship)}</span></li>`
  ).join("");
  const count = assignments.length;
  const html = emailWrapper(
    "Evaluation Invitation",
    `
    <p style="margin: 0 0 16px; font-size: 15px; color: #1d1d1f; line-height: 1.5;">Hi ${escapeHtml(recipientName)},</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #48484a; line-height: 1.5;">You have <strong>${count}</strong> evaluation${count === 1 ? "" : "s"} to complete for the <strong>${escapeHtml(cycleName)}</strong> cycle:</p>
    <ul style="margin: 0 0 24px; padding-left: 20px;">${assignmentListHtml}</ul>
    ${ctaButton(summaryUrl, "View All Evaluations")}
    <p style="margin: 24px 0 0; font-size: 13px; color: #86868b; line-height: 1.4;">You'll verify your identity once, then have 4 hours to complete all evaluations.</p>
    `
  );
  const assignmentListText = assignments.map((a) => `  - ${a.subjectName} (${a.relationship})`).join("\n");
  const text = `Hi ${recipientName},

You have ${count} evaluation${count === 1 ? "" : "s"} to complete for the ${cycleName} cycle:

${assignmentListText}

View all evaluations: ${summaryUrl}

You'll verify your identity once, then have 4 hours to complete all evaluations.`;
  return { html, text };
}
function getSummaryReminderEmail(recipientName, cycleName, deadline, assignments, summaryUrl) {
  const assignmentListHtml = assignments.map(
    (a) => `<li style="margin: 4px 0; font-size: 14px; color: #48484a;"><strong>${escapeHtml(a.subjectName)}</strong> <span style="color: #86868b;">&middot; ${escapeHtml(a.relationship)}</span></li>`
  ).join("");
  const count = assignments.length;
  const html = emailWrapper(
    "Evaluation Reminder",
    `
    <p style="margin: 0 0 16px; font-size: 15px; color: #1d1d1f; line-height: 1.5;">Hi ${escapeHtml(recipientName)},</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #48484a; line-height: 1.5;">You still have <strong>${count}</strong> pending evaluation${count === 1 ? "" : "s"} for the <strong>${escapeHtml(cycleName)}</strong> cycle:</p>
    <ul style="margin: 0 0 16px; padding-left: 20px;">${assignmentListHtml}</ul>
    <p style="margin: 0 0 24px; font-size: 15px; color: #48484a; line-height: 1.5;">The deadline is <strong>${escapeHtml(deadline)}</strong>. Please complete them before then.</p>
    ${ctaButton(summaryUrl, "View All Evaluations")}
    <p style="margin: 24px 0 0; font-size: 13px; color: #86868b; line-height: 1.4;">You'll verify your identity once, then have 4 hours to complete all evaluations.</p>
    `
  );
  const assignmentListText = assignments.map((a) => `  - ${a.subjectName} (${a.relationship})`).join("\n");
  const text = `Hi ${recipientName},

You still have ${count} pending evaluation${count === 1 ? "" : "s"} for the ${cycleName} cycle:

${assignmentListText}

The deadline is ${deadline}. Please complete them before then.

View all evaluations: ${summaryUrl}

You'll verify your identity once, then have 4 hours to complete all evaluations.`;
  return { html, text };
}
function getDataExportEmail(companyName, exportedAt) {
  const html = emailWrapper(
    "Data Export",
    `
    <p style="margin: 0 0 16px; font-size: 15px; color: #1d1d1f; line-height: 1.5;">Hi,</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #48484a; line-height: 1.5;">Your data export for <strong>${escapeHtml(companyName)}</strong> is ready. The JSON file is attached to this email.</p>
    <p style="margin: 0 0 4px; font-size: 13px; color: #86868b; line-height: 1.4;">Exported on ${escapeHtml(exportedAt)}.</p>
    <p style="margin: 0; font-size: 13px; color: #86868b; line-height: 1.4;">This file contains decrypted evaluation responses. Please store it securely and delete it when no longer needed.</p>
    `
  );
  const text = `Hi,

Your data export for ${companyName} is ready. The JSON file is attached to this email.

Exported on ${exportedAt}.

This file contains decrypted evaluation responses. Please store it securely and delete it when no longer needed.`;
  return { html, text };
}
function getCompanyDestroyedEmail(companyName, destroyedAt, initiatedBy) {
  const html = emailWrapper(
    "Company Deleted",
    `
    <p style="margin: 0 0 16px; font-size: 15px; color: #1d1d1f; line-height: 1.5;">Hi,</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #48484a; line-height: 1.5;">
      This email confirms that <strong>${escapeHtml(companyName)}</strong> and all associated data
      have been permanently deleted from Performs360.
    </p>
    <div style="background: #fef2f2; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #991b1b;">Deletion Details</p>
      <p style="margin: 0 0 4px; font-size: 13px; color: #7f1d1d;">Company: ${escapeHtml(companyName)}</p>
      <p style="margin: 0 0 4px; font-size: 13px; color: #7f1d1d;">Deleted on: ${escapeHtml(destroyedAt)}</p>
      <p style="margin: 0; font-size: 13px; color: #7f1d1d;">Initiated by: ${escapeHtml(initiatedBy)}</p>
    </div>
    <p style="margin: 0 0 4px; font-size: 13px; color: #86868b; line-height: 1.4;">
      This action is irreversible. All users, teams, evaluation cycles, responses, encryption keys,
      and audit logs have been permanently removed.
    </p>
    <p style="margin: 0; font-size: 13px; color: #86868b; line-height: 1.4;">
      If you did not initiate this action, please contact support immediately.
    </p>
    `
  );
  const text = `Hi,

This email confirms that ${companyName} and all associated data have been permanently deleted from Performs360.

Company: ${companyName}
Deleted on: ${destroyedAt}
Initiated by: ${initiatedBy}

This action is irreversible. All users, teams, evaluation cycles, responses, encryption keys, and audit logs have been permanently removed.

If you did not initiate this action, please contact support immediately.`;
  return { html, text };
}
function getReportsExportEmail(cycleName, subjectCount) {
  const html = emailWrapper(
    "Reports Export",
    `
    <p style="margin: 0 0 16px; font-size: 15px; color: #1d1d1f; line-height: 1.5;">Hi,</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #48484a; line-height: 1.5;">
      Your report export for the <strong>${escapeHtml(cycleName)}</strong> cycle is ready.
      The attached ZIP contains ${subjectCount} individual report PDF${subjectCount !== 1 ? "s" : ""}.
    </p>
    <p style="margin: 0; font-size: 13px; color: #86868b; line-height: 1.4;">
      This file contains evaluation scores and feedback. Please store it securely.
    </p>
    `
  );
  const text = `Hi,

Your report export for the ${cycleName} cycle is ready. The attached ZIP contains ${subjectCount} individual report PDF${subjectCount !== 1 ? "s" : ""}.

This file contains evaluation scores and feedback. Please store it securely.`;
  return { html, text };
}
function getReportsExportExcelEmail(cycleName, subjectCount) {
  const html = emailWrapper(
    "Excel Scores Export",
    `
    <p style="margin: 0 0 16px; font-size: 15px; color: #1d1d1f; line-height: 1.5;">Hi,</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #48484a; line-height: 1.5;">
      Your Excel scores export for the <strong>${escapeHtml(cycleName)}</strong> cycle is ready.
      The attached spreadsheet contains scores for ${subjectCount} individual${subjectCount !== 1 ? "s" : ""} across multiple sheets.
    </p>
    <p style="margin: 0; font-size: 13px; color: #86868b; line-height: 1.4;">
      This file contains evaluation scores. Please store it securely.
    </p>
    `
  );
  const text = `Hi,

Your Excel scores export for the ${cycleName} cycle is ready. The attached spreadsheet contains scores for ${subjectCount} individual${subjectCount !== 1 ? "s" : ""} across multiple sheets.

This file contains evaluation scores. Please store it securely.`;
  return { html, text };
}

// src/lib/email/index.ts
async function sendEmail(options) {
  await getEmailProvider().send(options);
}
async function sendEmailWithAttachments(options) {
  await getEmailProvider().sendWithAttachments(options);
}

// src/lib/jobs/email.ts
async function handleEmailSend(payload) {
  await sendEmail({
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text
  });
}

// src/lib/audit.ts
var import_client2 = require("@prisma/client");
async function writeAuditLog(input) {
  try {
    await prisma.auditLog.create({
      data: {
        companyId: input.companyId,
        userId: input.userId ?? null,
        action: input.action,
        target: input.target ?? null,
        metadata: input.metadata ?? import_client2.Prisma.JsonNull,
        ip: input.ip ?? null
      }
    });
  } catch (error) {
    console.error("[AuditLog] Failed to write audit log:", error);
  }
}

// src/types/job.ts
var JOB_TYPES = {
  EMAIL_SEND: "email.send",
  CYCLE_ACTIVATE: "cycle.activate",
  CYCLE_REMIND: "cycle.remind",
  CYCLE_AUTO_CLOSE: "cycle.auto-close",
  ENCRYPTION_ROTATE_KEY: "encryption.rotate-key",
  CLEANUP_OTP_SESSIONS: "cleanup.otp-sessions",
  DATA_EXPORT: "data.export",
  COMPANY_DESTROY: "company.destroy",
  REPORTS_EXPORT_CYCLE: "reports.export-cycle",
  REPORTS_EXPORT_CYCLE_EXCEL: "reports.export-cycle-excel",
  BLOG_GENERATE: "blog.generate"
};

// src/lib/jobs/cycle.ts
var APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
async function handleCycleActivate(payload) {
  const { cycleId, companyId, userId } = payload;
  const [cycle, company] = await Promise.all([
    prisma.evaluationCycle.findUnique({
      where: { id: cycleId },
      select: { name: true }
    }),
    prisma.company.findUnique({
      where: { id: companyId },
      select: { settings: true }
    })
  ]);
  if (!cycle) throw new Error(`Cycle not found: ${cycleId}`);
  const notifications = company?.settings?.notifications;
  const sendInvitations = notifications?.evaluationInvitations !== false;
  const assignments = await prisma.evaluationAssignment.findMany({
    where: { cycleId },
    select: {
      id: true,
      token: true,
      subjectId: true,
      reviewerId: true,
      relationship: true
    }
  });
  if (assignments.length === 0) return;
  const userIds = /* @__PURE__ */ new Set();
  for (const a of assignments) {
    userIds.add(a.reviewerId);
    userIds.add(a.subjectId);
  }
  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(userIds) } },
    select: { id: true, email: true, name: true }
  });
  const userMap = new Map(users.map((u) => [u.id, u]));
  const byReviewer = /* @__PURE__ */ new Map();
  for (const a of assignments) {
    const list = byReviewer.get(a.reviewerId) ?? [];
    list.push(a);
    byReviewer.set(a.reviewerId, list);
  }
  const emailJobs = [];
  for (const [reviewerId, reviewerAssignments] of byReviewer) {
    const reviewer = userMap.get(reviewerId);
    if (!reviewer) continue;
    const reviewerLink = await prisma.cycleReviewerLink.upsert({
      where: { cycleId_reviewerId: { cycleId, reviewerId } },
      create: { cycleId, reviewerId },
      update: {}
    });
    if (!sendInvitations) continue;
    const summaryUrl = `${APP_URL}/review/${reviewerLink.token}`;
    const subjectList = reviewerAssignments.map((a) => ({
      subjectName: userMap.get(a.subjectId)?.name ?? "Unknown",
      relationship: RELATIONSHIP_LABELS[a.relationship] ?? a.relationship
    }));
    const { html, text } = getSummaryInviteEmail(
      reviewer.name,
      cycle.name,
      subjectList,
      summaryUrl
    );
    const count = subjectList.length;
    emailJobs.push({
      type: JOB_TYPES.EMAIL_SEND,
      payload: {
        to: reviewer.email,
        subject: `${cycle.name} \u2014 ${count} Evaluation${count === 1 ? "" : "s"} to Complete`,
        html,
        text
      }
    });
  }
  if (emailJobs.length > 0) {
    await enqueueBatch(emailJobs);
  }
  await writeAuditLog({
    companyId,
    userId,
    action: "cycle_activate",
    target: `cycle:${cycleId}`,
    metadata: {
      totalAssignments: assignments.length,
      uniqueReviewers: byReviewer.size,
      emailsQueued: emailJobs.length
    }
  });
}
async function handleCycleRemind(payload) {
  const { cycleId, companyId, assignmentId } = payload;
  const [cycle, company] = await Promise.all([
    prisma.evaluationCycle.findUnique({
      where: { id: cycleId },
      select: { name: true, endDate: true, status: true }
    }),
    prisma.company.findUnique({
      where: { id: companyId },
      select: { settings: true }
    })
  ]);
  if (!cycle || cycle.status !== "ACTIVE") return;
  const notifications = company?.settings?.notifications;
  if (notifications?.cycleReminders === false) return;
  const pendingAssignments = await prisma.evaluationAssignment.findMany({
    where: {
      cycleId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      ...assignmentId ? { id: assignmentId } : {}
    },
    select: {
      token: true,
      reviewerId: true,
      subjectId: true,
      relationship: true
    }
  });
  if (pendingAssignments.length === 0) return;
  const userIds = Array.from(
    new Set(pendingAssignments.flatMap((a) => [a.reviewerId, a.subjectId]))
  );
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true }
  });
  const userMap = new Map(users.map((u) => [u.id, u]));
  const deadline = cycle.endDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const byReviewer = /* @__PURE__ */ new Map();
  for (const a of pendingAssignments) {
    const list = byReviewer.get(a.reviewerId) ?? [];
    list.push(a);
    byReviewer.set(a.reviewerId, list);
  }
  const emailJobs = [];
  for (const [reviewerId, reviewerAssignments] of byReviewer) {
    const reviewer = userMap.get(reviewerId);
    if (!reviewer) continue;
    const reviewerLink = await prisma.cycleReviewerLink.findUnique({
      where: { cycleId_reviewerId: { cycleId, reviewerId } }
    });
    if (!reviewerLink) continue;
    const summaryUrl = `${APP_URL}/review/${reviewerLink.token}`;
    const subjectList = reviewerAssignments.map((a) => ({
      subjectName: userMap.get(a.subjectId)?.name ?? "Unknown",
      relationship: RELATIONSHIP_LABELS[a.relationship] ?? a.relationship
    }));
    const count = subjectList.length;
    const { html, text } = getSummaryReminderEmail(
      reviewer.name,
      cycle.name,
      deadline,
      subjectList,
      summaryUrl
    );
    emailJobs.push({
      type: JOB_TYPES.EMAIL_SEND,
      payload: {
        to: reviewer.email,
        subject: `Reminder: ${count} Pending Evaluation${count === 1 ? "" : "s"} \u2014 ${cycle.name}`,
        html,
        text
      }
    });
  }
  if (emailJobs.length > 0) {
    await enqueueBatch(emailJobs);
  }
  await writeAuditLog({
    companyId,
    action: "cycle_remind",
    target: `cycle:${cycleId}`,
    metadata: { remindersQueued: emailJobs.length }
  });
}
async function handleCycleAutoClose(_payload) {
  const overdueCycles = await prisma.evaluationCycle.findMany({
    where: {
      status: "ACTIVE",
      endDate: { lt: /* @__PURE__ */ new Date() }
    },
    select: { id: true, companyId: true, name: true }
  });
  for (const cycle of overdueCycles) {
    await prisma.evaluationCycle.update({
      where: { id: cycle.id },
      data: { status: "CLOSED" }
    });
    await writeAuditLog({
      companyId: cycle.companyId,
      action: "cycle_close",
      target: `cycle:${cycle.id}`,
      metadata: { reason: "auto-close (past deadline)" }
    });
    console.log(`[Jobs] Auto-closed cycle "${cycle.name}" (${cycle.id})`);
  }
  const completedCycles = await prisma.evaluationCycle.findMany({
    where: {
      status: "ACTIVE",
      assignments: {
        every: { status: "SUBMITTED" },
        some: {}
      }
    },
    select: { id: true, companyId: true, name: true }
  });
  for (const cycle of completedCycles) {
    await prisma.evaluationCycle.update({
      where: { id: cycle.id },
      data: { status: "CLOSED" }
    });
    await writeAuditLog({
      companyId: cycle.companyId,
      action: "cycle_close",
      target: `cycle:${cycle.id}`,
      metadata: { reason: "auto-close (100% completion)" }
    });
    console.log(`[Jobs] Auto-closed cycle "${cycle.name}" (${cycle.id}) \u2014 100% complete`);
  }
}

// src/lib/encryption.ts
var import_crypto = require("crypto");
var ALGORITHM = "aes-256-gcm";
var IV_LENGTH = 16;
var TAG_LENGTH = 16;
function decryptDataKey(encryptedDataKey, masterKey) {
  const data = Buffer.from(encryptedDataKey, "base64");
  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = (0, import_crypto.createDecipheriv)(ALGORITHM, masterKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}
function encrypt(plaintext, key) {
  const iv = (0, import_crypto.randomBytes)(IV_LENGTH);
  const cipher = (0, import_crypto.createCipheriv)(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    encrypted: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: authTag.toString("base64")
  };
}
function decrypt(encrypted, iv, tag, key) {
  const decipher = (0, import_crypto.createDecipheriv)(ALGORITHM, key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final()
  ]).toString("utf8");
}

// src/lib/jobs/encryption.ts
async function handleEncryptionRotateKey(payload) {
  const { companyId, userId, masterKeyHex, oldDataKeyHex, newKeyVersion } = payload;
  const oldDataKey = Buffer.from(oldDataKeyHex, "hex");
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { encryptionKeyEncrypted: true }
  });
  if (!company) throw new Error(`Company not found: ${companyId}`);
  const masterKey = Buffer.from(masterKeyHex, "hex");
  const newPlainDataKey = decryptDataKey(company.encryptionKeyEncrypted, masterKey);
  let reEncryptedCount = 0;
  let cursor;
  for (; ; ) {
    const responses = await prisma.evaluationResponse.findMany({
      where: {
        assignment: {
          cycle: { companyId }
        },
        keyVersion: { lt: newKeyVersion }
      },
      select: {
        id: true,
        answersEncrypted: true,
        answersIv: true,
        answersTag: true
      },
      take: JOB_CONFIG.reEncryptBatchSize,
      ...cursor ? { skip: 1, cursor: { id: cursor } } : {},
      orderBy: { id: "asc" }
    });
    if (responses.length === 0) break;
    const updates = responses.map((response) => {
      const plaintext = decrypt(
        response.answersEncrypted,
        response.answersIv,
        response.answersTag,
        oldDataKey
      );
      const { encrypted, iv, tag } = encrypt(plaintext, newPlainDataKey);
      return prisma.evaluationResponse.update({
        where: { id: response.id },
        data: {
          answersEncrypted: encrypted,
          answersIv: iv,
          answersTag: tag,
          keyVersion: newKeyVersion
        }
      });
    });
    await prisma.$transaction(updates);
    reEncryptedCount += responses.length;
    cursor = responses[responses.length - 1].id;
    if (responses.length < JOB_CONFIG.reEncryptBatchSize) break;
  }
  await writeAuditLog({
    companyId,
    userId,
    action: "key_rotation",
    metadata: {
      newKeyVersion,
      reEncryptedResponses: reEncryptedCount,
      source: "background_job"
    }
  });
  console.log(`[Jobs] Key rotation complete for company ${companyId}: ${reEncryptedCount} responses re-encrypted`);
}

// src/lib/jobs/cleanup.ts
async function handleCleanupOtpSessions(_payload) {
  const now = /* @__PURE__ */ new Date();
  const expiredSessions = await prisma.otpSession.deleteMany({
    where: {
      verifiedAt: { not: null },
      sessionExpiry: { lt: now }
    }
  });
  const expiredOtps = await prisma.otpSession.deleteMany({
    where: {
      verifiedAt: null,
      expiresAt: { lt: now }
    }
  });
  const prunedJobs = await pruneOldJobs();
  console.log(
    `[Jobs] Cleanup: ${expiredSessions.count} expired sessions, ${expiredOtps.count} expired OTPs, ${prunedJobs} old jobs pruned`
  );
}

// src/lib/jobs/data-export.ts
function safeParseAnswers(answersEncrypted, answersIv, answersTag, dataKey) {
  const plaintext = decrypt(answersEncrypted, answersIv, answersTag, dataKey);
  try {
    return JSON.parse(plaintext);
  } catch {
    return plaintext;
  }
}
async function handleDataExport(payload) {
  const { companyId, userId, userEmail, dataKeyHex } = payload;
  const dataKey = Buffer.from(dataKeyHex, "hex");
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      settings: true,
      keyVersion: true,
      encryptionSetupAt: true,
      createdAt: true,
      updatedAt: true
    }
  });
  if (!company) throw new Error(`Company not found: ${companyId}`);
  const [users, teams, templates, cycles, assignments, auditLogs, recoveryCodes] = await Promise.all([
    prisma.user.findMany({
      where: { companyId: company.id },
      include: {
        teamMemberships: {
          select: { id: true, teamId: true, role: true }
        }
      },
      orderBy: { createdAt: "asc" }
    }),
    prisma.team.findMany({
      where: { companyId: company.id },
      include: {
        members: {
          select: { id: true, userId: true, role: true }
        }
      },
      orderBy: { createdAt: "asc" }
    }),
    prisma.evaluationTemplate.findMany({
      where: {
        OR: [
          { companyId: company.id },
          {
            cycleTeams: {
              some: {
                cycle: { companyId: company.id }
              }
            }
          }
        ]
      },
      orderBy: { createdAt: "asc" }
    }),
    prisma.evaluationCycle.findMany({
      where: { companyId: company.id },
      include: {
        cycleTeams: {
          select: {
            id: true,
            teamId: true,
            templateId: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: "asc" }
    }),
    prisma.evaluationAssignment.findMany({
      where: {
        cycle: { companyId: company.id }
      },
      include: {
        otpSessions: true,
        responses: true
      },
      orderBy: { createdAt: "asc" }
    }),
    prisma.auditLog.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "asc" }
    }),
    prisma.recoveryCode.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "asc" }
    })
  ]);
  const assignmentsDecrypted = assignments.map((assignment) => ({
    id: assignment.id,
    cycleId: assignment.cycleId,
    templateId: assignment.templateId,
    subjectId: assignment.subjectId,
    reviewerId: assignment.reviewerId,
    relationship: assignment.relationship,
    status: assignment.status,
    token: assignment.token,
    createdAt: assignment.createdAt,
    otpSessions: assignment.otpSessions,
    responses: assignment.responses.map((response) => ({
      id: response.id,
      assignmentId: response.assignmentId,
      reviewerId: response.reviewerId,
      subjectId: response.subjectId,
      keyVersion: response.keyVersion,
      submittedAt: response.submittedAt,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      answers: safeParseAnswers(
        response.answersEncrypted,
        response.answersIv,
        response.answersTag,
        dataKey
      )
    }))
  }));
  const exportedAt = (/* @__PURE__ */ new Date()).toISOString();
  const exportPayload = {
    metadata: {
      schemaVersion: 1,
      exportedAt,
      exportedBy: { userId, email: userEmail }
    },
    company: {
      id: company.id,
      name: company.name,
      slug: company.slug,
      logo: company.logo,
      settings: company.settings,
      keyVersion: company.keyVersion,
      encryptionSetupAt: company.encryptionSetupAt,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt
    },
    users,
    teams,
    templates,
    cycles,
    assignments: assignmentsDecrypted,
    auditLogs,
    recoveryCodes
  };
  const fileName = `performs360-${company.slug}-data-dump-${exportedAt.slice(0, 10)}.json`;
  const jsonContent = JSON.stringify(exportPayload, null, 2);
  const { html, text } = getDataExportEmail(company.name, exportedAt.slice(0, 10));
  await sendEmailWithAttachments({
    to: userEmail,
    subject: `Your ${company.name} data export is ready`,
    html,
    text,
    attachments: [
      {
        filename: fileName,
        content: jsonContent,
        contentType: "application/json"
      }
    ]
  });
  await writeAuditLog({
    companyId,
    userId,
    action: "data_export",
    metadata: {
      deliveredTo: userEmail,
      source: "background_job"
    }
  });
  console.log(
    `[Jobs] Data export complete for company ${companyId}: emailed to ${userEmail}`
  );
}

// src/lib/company-cascade-delete.ts
async function cascadeDeleteCompany(companyId) {
  const companyUsers = await prisma.user.findMany({
    where: { companyId },
    select: { authUserId: true }
  });
  const authUserIds = companyUsers.map((u) => u.authUserId).filter((id) => id !== null);
  if (authUserIds.length > 0) {
    await prisma.session.deleteMany({
      where: { userId: { in: authUserIds } }
    });
  }
  await prisma.otpSession.deleteMany({
    where: { assignment: { cycle: { companyId } } }
  });
  await prisma.evaluationResponse.deleteMany({
    where: { assignment: { cycle: { companyId } } }
  });
  await prisma.evaluationAssignment.deleteMany({
    where: { cycle: { companyId } }
  });
  await prisma.cycleTeam.deleteMany({
    where: { cycle: { companyId } }
  });
  await prisma.evaluationCycle.deleteMany({
    where: { companyId }
  });
  await prisma.teamMember.deleteMany({
    where: { team: { companyId } }
  });
  await prisma.team.deleteMany({
    where: { companyId }
  });
  await prisma.evaluationTemplate.deleteMany({
    where: { companyId }
  });
  await prisma.recoveryCode.deleteMany({
    where: { companyId }
  });
  await prisma.auditLog.deleteMany({
    where: { companyId }
  });
  await prisma.user.deleteMany({
    where: { companyId }
  });
  await prisma.company.delete({
    where: { id: companyId }
  });
}

// src/lib/jobs/company-destroy.ts
async function handleCompanyDestroy(payload) {
  const { companyId, userId, userEmail, companyName, adminEmails, exportJobId } = payload;
  if (exportJobId) {
    const maxWaitMs = 10 * 60 * 1e3;
    const pollIntervalMs = 5e3;
    const deadline = Date.now() + maxWaitMs;
    while (Date.now() < deadline) {
      const exportJob = await getJobStatus(exportJobId);
      if (!exportJob) {
        console.warn(
          `[CompanyDestroy] Export job ${exportJobId} not found, proceeding`
        );
        break;
      }
      if (exportJob.status === "COMPLETED") {
        console.log(
          `[CompanyDestroy] Export job ${exportJobId} completed, proceeding`
        );
        break;
      }
      if (exportJob.status === "DEAD" || exportJob.status === "FAILED") {
        console.warn(
          `[CompanyDestroy] Export job ${exportJobId} ${exportJob.status}, proceeding anyway`
        );
        break;
      }
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
  }
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true }
  });
  if (!company) {
    console.log(
      `[CompanyDestroy] Company ${companyId} already deleted, skipping`
    );
    return;
  }
  await writeAuditLog({
    companyId,
    userId,
    action: "company_destroy",
    metadata: {
      companyName,
      initiatedBy: userEmail,
      destroyedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  });
  const destroyedAt = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const { html, text } = getCompanyDestroyedEmail(
    companyName,
    destroyedAt,
    userEmail
  );
  const emailPromises = adminEmails.map(
    (email) => sendEmail({
      to: email,
      subject: `${companyName} has been permanently deleted from Performs360`,
      html,
      text
    }).catch((err) => {
      console.error(
        `[CompanyDestroy] Failed to email ${email}:`,
        err
      );
    })
  );
  await Promise.all(emailPromises);
  await cascadeDeleteCompany(companyId);
  console.log(
    `[CompanyDestroy] Company ${companyId} (${companyName}) permanently destroyed`
  );
}

// src/lib/reports.ts
function decryptResponse(encrypted, iv, tag, dataKey) {
  const json = decrypt(encrypted, iv, tag, dataKey);
  return JSON.parse(json);
}
async function getDecryptedResponsesForSubject(cycleId, subjectId, dataKey) {
  const responses = await prisma.evaluationResponse.findMany({
    where: {
      subjectId,
      assignment: { cycleId }
    },
    include: {
      assignment: { select: { relationship: true, templateId: true } }
    }
  });
  const results = [];
  for (const r of responses) {
    try {
      results.push({
        reviewerId: r.reviewerId,
        subjectId: r.subjectId,
        relationship: r.assignment.relationship,
        templateId: r.assignment.templateId,
        answers: decryptResponse(r.answersEncrypted, r.answersIv, r.answersTag, dataKey),
        submittedAt: r.submittedAt
      });
    } catch {
    }
  }
  return results;
}
function extractRatingScores(answers, questions) {
  const results = [];
  for (const q of questions) {
    if (q.type === "rating_scale") {
      const value = answers[q.id];
      if (typeof value === "number") {
        results.push({ questionId: q.id, score: value });
      }
    }
  }
  return results;
}
function buildCategoryScores(responses, sections) {
  return sections.filter(
    (section) => section.questions.some((q) => q.type === "rating_scale")
  ).map((section) => {
    const ratingQuestions = section.questions.filter(
      (q) => q.type === "rating_scale"
    );
    let totalScore = 0;
    let totalCount = 0;
    const maxScale = ratingQuestions[0]?.scaleMax ?? 5;
    for (const resp of responses) {
      for (const q of ratingQuestions) {
        const value = resp.answers[q.id];
        if (typeof value === "number") {
          totalScore += value;
          totalCount++;
        }
      }
    }
    return {
      category: section.title,
      score: totalCount > 0 ? parseFloat((totalScore / totalCount).toFixed(2)) : 0,
      maxScore: maxScale
    };
  });
}
function buildRelationshipScores(responses, sections) {
  const allQuestions = sections.flatMap((s) => s.questions);
  const ratingQuestions = allQuestions.filter(
    (q) => q.type === "rating_scale"
  );
  const groups = {
    manager: [],
    peer: [],
    direct_report: [],
    self: [],
    external: []
  };
  for (const resp of responses) {
    const scores = extractRatingScores(resp.answers, ratingQuestions);
    const avgForResponse = scores.length > 0 ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length : null;
    if (avgForResponse !== null && groups[resp.relationship]) {
      groups[resp.relationship].push(avgForResponse);
    }
  }
  const avg = (arr) => arr.length > 0 ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : null;
  return {
    manager: avg(groups.manager),
    peer: avg(groups.peer),
    directReport: avg(groups.direct_report),
    self: avg(groups.self),
    external: avg(groups.external)
  };
}
function buildQuestionDetails(responses, sections) {
  const allQuestions = sections.flatMap((s) => s.questions);
  return allQuestions.filter((q) => q.type === "rating_scale" || q.type === "multiple_choice").map((q) => {
    const distribution = {};
    let totalScore = 0;
    let count = 0;
    for (const resp of responses) {
      const value = resp.answers[q.id];
      if (value !== void 0 && value !== "") {
        const key = String(value);
        distribution[key] = (distribution[key] ?? 0) + 1;
        if (typeof value === "number") {
          totalScore += value;
          count++;
        }
      }
    }
    return {
      questionId: q.id,
      questionText: q.text,
      type: q.type,
      averageScore: count > 0 ? parseFloat((totalScore / count).toFixed(2)) : null,
      distribution,
      responseCount: responses.filter((r) => r.answers[q.id] !== void 0).length
    };
  });
}
function buildTextFeedback(responses, sections) {
  const allQuestions = sections.flatMap((s) => s.questions);
  const textQuestions = allQuestions.filter((q) => q.type === "text");
  const groups = [];
  for (const q of textQuestions) {
    const byRelationship = {};
    for (const resp of responses) {
      const value = resp.answers[q.id];
      if (typeof value === "string" && value.trim().length > 0) {
        const rel = resp.relationship;
        if (!byRelationship[rel]) byRelationship[rel] = [];
        byRelationship[rel].push(value.trim());
      }
    }
    for (const [relationship, feedbackItems] of Object.entries(byRelationship)) {
      groups.push({
        questionId: q.id,
        questionText: q.text,
        relationship,
        responses: feedbackItems
      });
    }
  }
  return groups;
}
function calculateOverallScore(responses, sections) {
  const allQuestions = sections.flatMap((s) => s.questions);
  const ratingQuestions = allQuestions.filter(
    (q) => q.type === "rating_scale"
  );
  let total = 0;
  let count = 0;
  for (const resp of responses) {
    for (const q of ratingQuestions) {
      const value = resp.answers[q.id];
      if (typeof value === "number") {
        total += value;
        count++;
      }
    }
  }
  return count > 0 ? parseFloat((total / count).toFixed(2)) : 0;
}
var WEIGHT_REL_KEYS = [
  ["manager", "manager"],
  ["peer", "peer"],
  ["directReport", "direct_report"],
  ["self", "self"],
  ["external", "external"]
];
function applyWeightsToRelationshipAverages(relGroups, weights) {
  if (!weights) return null;
  const avg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const averages = {
    manager: avg(relGroups.manager ?? []),
    peer: avg(relGroups.peer ?? []),
    directReport: avg(relGroups.direct_report ?? []),
    self: avg(relGroups.self ?? []),
    external: avg(relGroups.external ?? [])
  };
  const presentKeys = WEIGHT_REL_KEYS.filter(([wk]) => averages[wk] !== null);
  const absentWeightSum = WEIGHT_REL_KEYS.filter(([wk]) => averages[wk] === null).reduce((sum, [wk]) => sum + weights[wk], 0);
  if (presentKeys.length === 0) {
    return {
      score: 0,
      appliedWeights: { manager: 0, peer: 0, directReport: 0, self: 0, external: 0 }
    };
  }
  const presentWeightSum = presentKeys.reduce((sum, [wk]) => sum + weights[wk], 0);
  const appliedWeights = {};
  let weightedScore = 0;
  for (const [wk] of WEIGHT_REL_KEYS) {
    if (averages[wk] === null) {
      appliedWeights[wk] = 0;
    } else {
      const adjusted = presentWeightSum > 0 ? weights[wk] + weights[wk] / presentWeightSum * absentWeightSum : 1 / presentKeys.length;
      appliedWeights[wk] = adjusted;
      weightedScore += averages[wk] * adjusted;
    }
  }
  return {
    score: parseFloat(weightedScore.toFixed(2)),
    appliedWeights
  };
}
function calculateWeightedOverallScore(responses, sections, weights) {
  if (!weights) return null;
  const allQuestions = sections.flatMap((s) => s.questions);
  const ratingQuestions = allQuestions.filter((q) => q.type === "rating_scale");
  const groups = {
    manager: [],
    peer: [],
    direct_report: [],
    self: [],
    external: []
  };
  for (const resp of responses) {
    const scores = extractRatingScores(resp.answers, ratingQuestions);
    if (scores.length > 0) {
      const respAvg = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
      if (groups[resp.relationship]) {
        groups[resp.relationship].push(respAvg);
      }
    }
  }
  return applyWeightsToRelationshipAverages(groups, weights);
}
function buildWeightedCategoryScores(responses, sections, weights) {
  if (!weights) return null;
  return sections.filter(
    (section) => section.questions.some((q) => q.type === "rating_scale")
  ).map((section) => {
    const ratingQuestions = section.questions.filter((q) => q.type === "rating_scale");
    const maxScale = ratingQuestions[0]?.scaleMax ?? 5;
    const relGroups = {
      manager: [],
      peer: [],
      direct_report: [],
      self: [],
      external: []
    };
    for (const resp of responses) {
      let total = 0;
      let count = 0;
      for (const q of ratingQuestions) {
        const v = resp.answers[q.id];
        if (typeof v === "number") {
          total += v;
          count++;
        }
      }
      if (count > 0 && relGroups[resp.relationship]) {
        relGroups[resp.relationship].push(total / count);
      }
    }
    const result = applyWeightsToRelationshipAverages(relGroups, weights);
    return {
      category: section.title,
      score: result?.score ?? 0,
      maxScore: maxScale
    };
  });
}
function buildSelfVsOthers(responses, sections) {
  const GAP_THRESHOLD = 0.75;
  return sections.filter((section) => section.questions.some((q) => q.type === "rating_scale")).map((section) => {
    const ratingQuestions = section.questions.filter((q) => q.type === "rating_scale");
    const selfScores = [];
    const othersScores = [];
    for (const resp of responses) {
      let total = 0;
      let count = 0;
      for (const q of ratingQuestions) {
        const v = resp.answers[q.id];
        if (typeof v === "number") {
          total += v;
          count++;
        }
      }
      if (count > 0) {
        const avg = total / count;
        if (resp.relationship === "self") {
          selfScores.push(avg);
        } else {
          othersScores.push(avg);
        }
      }
    }
    const selfScore = selfScores.length > 0 ? parseFloat((selfScores.reduce((a, b) => a + b, 0) / selfScores.length).toFixed(2)) : null;
    const othersScore = othersScores.length > 0 ? parseFloat((othersScores.reduce((a, b) => a + b, 0) / othersScores.length).toFixed(2)) : null;
    const gap = selfScore !== null && othersScore !== null ? parseFloat((selfScore - othersScore).toFixed(2)) : null;
    let insight = null;
    if (gap !== null) {
      if (gap > GAP_THRESHOLD) insight = "blind_spot";
      else if (gap < -GAP_THRESHOLD) insight = "hidden_strength";
      else insight = "aligned";
    }
    return { category: section.title, selfScore, othersScore, gap, insight };
  });
}
async function buildIndividualReport(cycleId, subjectId, companyId, dataKey) {
  const [cycle, subject] = await Promise.all([
    prisma.evaluationCycle.findUnique({
      where: { id: cycleId },
      select: { name: true }
    }),
    prisma.user.findUnique({
      where: { id: subjectId },
      select: {
        name: true,
        role: true,
        teamMemberships: {
          include: {
            team: { select: { id: true, name: true } },
            level: { select: { name: true } }
          }
        }
      }
    })
  ]);
  if (!cycle || !subject) {
    throw new Error("Cycle or subject not found");
  }
  const subjectContext = {
    role: subject.role,
    level: subject.teamMemberships[0]?.level?.name ?? null,
    teams: subject.teamMemberships.map((tm) => ({
      id: tm.team.id,
      name: tm.team.name,
      level: tm.level?.name ?? null
    }))
  };
  const allSubjectAssignments = await prisma.evaluationAssignment.findMany({
    where: { cycleId, subjectId },
    select: { templateId: true, relationship: true, status: true }
  });
  const totalAssigned = allSubjectAssignments.length;
  const totalCompleted = allSubjectAssignments.filter((a) => a.status === "SUBMITTED").length;
  const responseRate = {
    total: totalAssigned,
    completed: totalCompleted,
    rate: totalAssigned > 0 ? parseFloat((totalCompleted / totalAssigned * 100).toFixed(1)) : 0
  };
  const relBreakdownMap = /* @__PURE__ */ new Map();
  for (const a of allSubjectAssignments) {
    const existing = relBreakdownMap.get(a.relationship) ?? { total: 0, completed: 0 };
    existing.total++;
    if (a.status === "SUBMITTED") existing.completed++;
    relBreakdownMap.set(a.relationship, existing);
  }
  const reviewerBreakdown = Array.from(relBreakdownMap.entries()).map(
    ([relationship, counts]) => ({ relationship, ...counts })
  );
  const templateIds = Array.from(new Set(allSubjectAssignments.map((a) => a.templateId)));
  const [templates, cycleTeams] = await Promise.all([
    prisma.evaluationTemplate.findMany({
      where: { id: { in: templateIds } },
      select: { id: true, sections: true }
    }),
    prisma.cycleTeam.findMany({
      where: { cycleId },
      include: { team: { select: { id: true, name: true } } }
    })
  ]);
  if (templates.length === 0) {
    throw new Error("No templates found for subject's assignments");
  }
  const templateTeamMap = new Map(
    cycleTeams.map((ct) => [ct.templateId, { teamId: ct.team.id, teamName: ct.team.name }])
  );
  const templateSectionsMap = new Map(
    templates.map((t) => [t.id, t.sections])
  );
  const sections = templates.flatMap(
    (t) => t.sections
  );
  const responses = await getDecryptedResponsesForSubject(cycleId, subjectId, dataKey);
  const memberCalibrations = await prisma.calibrationAdjustment.findMany({
    where: { cycleId, subjectId },
    include: { adjuster: { select: { name: true } } }
  });
  const memberCalibByTeam = new Map(
    memberCalibrations.map((c) => [c.teamId, c])
  );
  const responsesByTeam = /* @__PURE__ */ new Map();
  for (const resp of responses) {
    const team = templateTeamMap.get(resp.templateId);
    if (!team) continue;
    const existing = responsesByTeam.get(team.teamId);
    if (existing) {
      existing.responses.push(resp);
    } else {
      responsesByTeam.set(team.teamId, { ...team, responses: [resp] });
    }
  }
  const teamWeightMap = new Map(
    cycleTeams.map((ct) => [
      ct.team.id,
      ct.weightManager !== null ? {
        manager: ct.weightManager,
        peer: ct.weightPeer,
        directReport: ct.weightDirectReport,
        self: ct.weightSelf,
        external: ct.weightExternal
      } : null
    ])
  );
  const teamBreakdowns = Array.from(responsesByTeam.values()).map(({ teamId, teamName, responses: teamResponses }) => {
    const teamCycleTeam = cycleTeams.find((ct) => ct.team.id === teamId);
    const teamSections = teamCycleTeam ? teamCycleTeam.templateId ? templateSectionsMap.get(teamCycleTeam.templateId) ?? sections : sections : sections;
    const teamWeights = teamWeightMap.get(teamId) ?? null;
    const weightedResult = calculateWeightedOverallScore(teamResponses, teamSections, teamWeights);
    const rawScore = calculateOverallScore(teamResponses, teamSections);
    const memberCalib = memberCalibByTeam.get(teamId);
    const teamOffset = teamCycleTeam?.calibrationOffset ?? null;
    let calibratedScore2 = null;
    let calibrationJustification = null;
    if (memberCalib) {
      calibratedScore2 = memberCalib.calibratedScore;
      calibrationJustification = memberCalib.justification;
    } else if (teamOffset !== null) {
      calibratedScore2 = parseFloat(Math.min(5, Math.max(0, rawScore + teamOffset)).toFixed(2));
      calibrationJustification = teamCycleTeam?.calibrationJustification ?? null;
    }
    return {
      teamId,
      teamName,
      overallScore: rawScore,
      weightedOverallScore: weightedResult?.score ?? null,
      appliedWeights: weightedResult?.appliedWeights ?? null,
      categoryScores: buildCategoryScores(teamResponses, teamSections),
      weightedCategoryScores: buildWeightedCategoryScores(teamResponses, teamSections, teamWeights),
      scoresByRelationship: buildRelationshipScores(teamResponses, teamSections),
      questionDetails: buildQuestionDetails(teamResponses, teamSections),
      textFeedback: buildTextFeedback(teamResponses, teamSections),
      calibrationOffset: teamOffset,
      calibratedScore: calibratedScore2,
      calibrationJustification
    };
  });
  const teamsWithWeights = teamBreakdowns.filter((tb) => tb.weightedOverallScore !== null);
  const weightedOverallScore = teamsWithWeights.length > 0 ? parseFloat(
    (teamsWithWeights.reduce((sum, tb) => sum + tb.weightedOverallScore, 0) / teamsWithWeights.length).toFixed(2)
  ) : null;
  const teamsWithCalibration = teamBreakdowns.filter((tb) => tb.calibratedScore !== null);
  const calibratedScore = teamsWithCalibration.length > 0 ? parseFloat(
    (teamsWithCalibration.reduce((sum, tb) => sum + tb.calibratedScore, 0) / teamsWithCalibration.length).toFixed(2)
  ) : null;
  const latestCalib = memberCalibrations.length > 0 ? memberCalibrations.reduce((latest, c) => c.updatedAt > latest.updatedAt ? c : latest) : null;
  return {
    subjectId,
    subjectName: subject.name,
    cycleId,
    cycleName: cycle.name,
    overallScore: calculateOverallScore(responses, sections),
    weightedOverallScore,
    categoryScores: buildCategoryScores(responses, sections),
    scoresByRelationship: buildRelationshipScores(responses, sections),
    questionDetails: buildQuestionDetails(responses, sections),
    textFeedback: buildTextFeedback(responses, sections),
    teamBreakdowns,
    calibratedScore,
    calibrationJustification: latestCalib?.justification ?? null,
    calibrationAdjustedBy: latestCalib?.adjuster.name ?? null,
    subjectContext,
    responseRate,
    reviewerBreakdown,
    selfVsOthers: buildSelfVsOthers(responses, sections)
  };
}
async function buildCycleReport(cycleId, companyId, dataKey) {
  const cycle = await prisma.evaluationCycle.findUnique({
    where: { id: cycleId },
    select: { name: true }
  });
  if (!cycle) throw new Error("Cycle not found");
  const assignments = await prisma.evaluationAssignment.findMany({
    where: { cycleId },
    select: { status: true, subjectId: true, reviewerId: true }
  });
  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter((a) => a.status === "SUBMITTED").length;
  const pendingAssignments = assignments.filter((a) => a.status === "PENDING").length;
  const inProgressAssignments = assignments.filter((a) => a.status === "IN_PROGRESS").length;
  const completionRate = totalAssignments > 0 ? parseFloat((completedAssignments / totalAssignments * 100).toFixed(1)) : 0;
  const participationStats = {
    totalAssignments,
    completedAssignments,
    pendingAssignments,
    inProgressAssignments
  };
  const cycleTeamLinks = await prisma.cycleTeam.findMany({
    where: { cycleId },
    select: { teamId: true, calibrationOffset: true }
  });
  const cycleTeamIds = cycleTeamLinks.map((ct) => ct.teamId);
  const allCalibrations = await prisma.calibrationAdjustment.findMany({
    where: { cycleId }
  });
  const calibBySubjectTeam = new Map(
    allCalibrations.map((c) => [`${c.subjectId}:${c.teamId}`, c])
  );
  const teamOffsetMap = new Map(
    cycleTeamLinks.map((ct) => [ct.teamId, ct.calibrationOffset])
  );
  const hasAnyCalibration = allCalibrations.length > 0 || cycleTeamLinks.some((ct) => ct.calibrationOffset !== null);
  const teams = await prisma.team.findMany({
    where: { id: { in: cycleTeamIds } },
    select: {
      id: true,
      name: true,
      members: { select: { userId: true } }
    }
  });
  const teamCompletionRates = teams.map((team) => {
    const memberIds = new Set(team.members.map((m) => m.userId));
    const teamAssignments = assignments.filter(
      (a) => memberIds.has(a.subjectId) || memberIds.has(a.reviewerId)
    );
    const teamCompleted = teamAssignments.filter((a) => a.status === "SUBMITTED").length;
    const teamTotal = teamAssignments.length;
    return {
      teamId: team.id,
      teamName: team.name,
      total: teamTotal,
      completed: teamCompleted,
      rate: teamTotal > 0 ? parseFloat((teamCompleted / teamTotal * 100).toFixed(1)) : 0
    };
  });
  const scoreDistribution = [0, 0, 0, 0, 0];
  const individualSummaries = [];
  const avgScoreByTeam = [];
  let avgScoreByRelationship = {
    manager: null,
    peer: null,
    directReport: null,
    self: null,
    external: null
  };
  const submissionTrend = [];
  const subjectIds = Array.from(new Set(assignments.map((a) => a.subjectId)));
  const subjectAssignmentCounts = /* @__PURE__ */ new Map();
  for (const a of assignments) {
    const existing = subjectAssignmentCounts.get(a.subjectId) ?? { total: 0, completed: 0 };
    existing.total++;
    if (a.status === "SUBMITTED") existing.completed++;
    subjectAssignmentCounts.set(a.subjectId, existing);
  }
  const subjectUsers = await prisma.user.findMany({
    where: { id: { in: subjectIds }, companyId },
    select: { id: true, name: true }
  });
  const subjectNameMap = new Map(subjectUsers.map((u) => [u.id, u.name]));
  if (completedAssignments > 0) {
    const cycleTeams = await prisma.cycleTeam.findMany({
      where: { cycleId },
      select: {
        teamId: true,
        templateId: true,
        weightManager: true,
        weightPeer: true,
        weightDirectReport: true,
        weightSelf: true,
        weightExternal: true
      }
    });
    const templateIds = Array.from(new Set(cycleTeams.map((ct) => ct.templateId).filter((id) => id !== null)));
    const templates = await prisma.evaluationTemplate.findMany({
      where: { id: { in: templateIds } },
      select: { sections: true }
    });
    if (templates.length > 0) {
      const allSections = templates.flatMap(
        (t) => t.sections
      );
      const ratingQuestionIds = new Set(
        allSections.flatMap((s) => s.questions).filter((q) => q.type === "rating_scale").map((q) => q.id)
      );
      const allResponses = await prisma.evaluationResponse.findMany({
        where: { assignment: { cycleId } },
        select: {
          subjectId: true,
          answersEncrypted: true,
          answersIv: true,
          answersTag: true,
          submittedAt: true,
          assignment: { select: { relationship: true } }
        }
      });
      const cycleTeamWeightMap = new Map(
        cycleTeams.map((ct) => [
          ct.teamId,
          ct.weightManager !== null ? {
            manager: ct.weightManager,
            peer: ct.weightPeer,
            directReport: ct.weightDirectReport,
            self: ct.weightSelf,
            external: ct.weightExternal
          } : null
        ])
      );
      const subjectTeamMap = /* @__PURE__ */ new Map();
      for (const team of teams) {
        for (const m of team.members) {
          const existing = subjectTeamMap.get(m.userId) ?? [];
          existing.push(team.id);
          subjectTeamMap.set(m.userId, existing);
        }
      }
      const subjectScores = /* @__PURE__ */ new Map();
      const subjectRelScores = /* @__PURE__ */ new Map();
      const relationshipScoreGroups = {
        manager: [],
        peer: [],
        direct_report: [],
        self: [],
        external: []
      };
      const dailySubmissions = /* @__PURE__ */ new Map();
      for (const resp of allResponses) {
        try {
          const answers = decryptResponse(
            resp.answersEncrypted,
            resp.answersIv,
            resp.answersTag,
            dataKey
          );
          const accum = subjectScores.get(resp.subjectId) ?? { total: 0, count: 0 };
          let respTotal = 0;
          let respCount = 0;
          for (const [key, value] of Object.entries(answers)) {
            if (ratingQuestionIds.has(key) && typeof value === "number") {
              const bucket = Math.min(Math.max(Math.round(value), 1), 5) - 1;
              scoreDistribution[bucket]++;
              accum.total += value;
              accum.count++;
              respTotal += value;
              respCount++;
            }
          }
          subjectScores.set(resp.subjectId, accum);
          if (respCount > 0) {
            const rel = resp.assignment.relationship;
            if (!subjectRelScores.has(resp.subjectId)) {
              subjectRelScores.set(resp.subjectId, {
                manager: [],
                peer: [],
                direct_report: [],
                self: [],
                external: []
              });
            }
            const relMap = subjectRelScores.get(resp.subjectId);
            if (relMap[rel]) {
              relMap[rel].push(respTotal / respCount);
            }
          }
          if (respCount > 0) {
            const rel = resp.assignment.relationship;
            if (relationshipScoreGroups[rel]) {
              relationshipScoreGroups[rel].push(respTotal / respCount);
            }
          }
          if (resp.submittedAt) {
            const dateKey = new Date(resp.submittedAt).toISOString().split("T")[0];
            dailySubmissions.set(dateKey, (dailySubmissions.get(dateKey) ?? 0) + 1);
          }
        } catch {
        }
      }
      for (const subjectId of subjectIds) {
        const scores = subjectScores.get(subjectId);
        const counts = subjectAssignmentCounts.get(subjectId) ?? { total: 0, completed: 0 };
        const overallScore = scores && scores.count > 0 ? parseFloat((scores.total / scores.count).toFixed(2)) : 0;
        let weightedOverallScore = null;
        const subjectTeamIds = subjectTeamMap.get(subjectId) ?? [];
        const relScores = subjectRelScores.get(subjectId);
        if (relScores && subjectTeamIds.length > 0) {
          const weightedScores = [];
          for (const teamId of subjectTeamIds) {
            const weights = cycleTeamWeightMap.get(teamId);
            if (weights) {
              const result = applyWeightsToRelationshipAverages(relScores, weights);
              if (result) weightedScores.push(result.score);
            }
          }
          if (weightedScores.length > 0) {
            weightedOverallScore = parseFloat(
              (weightedScores.reduce((a, b) => a + b, 0) / weightedScores.length).toFixed(2)
            );
          }
        }
        let calibratedScore = null;
        const sTeamIds = subjectTeamMap.get(subjectId) ?? [];
        const calibScores = [];
        for (const tid of sTeamIds) {
          const memberCalib = calibBySubjectTeam.get(`${subjectId}:${tid}`);
          const teamOffset = teamOffsetMap.get(tid) ?? null;
          if (memberCalib) {
            calibScores.push(memberCalib.calibratedScore);
          } else if (teamOffset !== null) {
            calibScores.push(parseFloat(Math.min(5, Math.max(0, overallScore + teamOffset)).toFixed(2)));
          }
        }
        if (calibScores.length > 0) {
          calibratedScore = parseFloat(
            (calibScores.reduce((a, b) => a + b, 0) / calibScores.length).toFixed(2)
          );
        }
        individualSummaries.push({
          subjectId,
          subjectName: subjectNameMap.get(subjectId) ?? "Unknown",
          overallScore,
          weightedOverallScore,
          reviewCount: counts.total,
          completedCount: counts.completed,
          calibratedScore
        });
      }
      const avgArr = (arr) => arr.length > 0 ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : null;
      avgScoreByRelationship = {
        manager: avgArr(relationshipScoreGroups.manager),
        peer: avgArr(relationshipScoreGroups.peer),
        directReport: avgArr(relationshipScoreGroups.direct_report),
        self: avgArr(relationshipScoreGroups.self),
        external: avgArr(relationshipScoreGroups.external)
      };
      for (const team of teams) {
        const memberIds = new Set(team.members.map((m) => m.userId));
        let teamTotal = 0;
        let teamCount = 0;
        const teamWeightedScores = [];
        const teamWeights = cycleTeamWeightMap.get(team.id) ?? null;
        for (const [sid, scores] of Array.from(subjectScores.entries())) {
          if (memberIds.has(sid) && scores.count > 0) {
            teamTotal += scores.total / scores.count;
            teamCount++;
            if (teamWeights) {
              const relScores = subjectRelScores.get(sid);
              if (relScores) {
                const result = applyWeightsToRelationshipAverages(relScores, teamWeights);
                if (result) teamWeightedScores.push(result.score);
              }
            }
          }
        }
        if (teamCount > 0) {
          const rawAvg = parseFloat((teamTotal / teamCount).toFixed(2));
          const teamOffset = teamOffsetMap.get(team.id) ?? null;
          const calibScores = [];
          for (const [sid, scores] of Array.from(subjectScores.entries())) {
            if (memberIds.has(sid) && scores.count > 0) {
              const memberRaw = scores.total / scores.count;
              const memberCalib = calibBySubjectTeam.get(`${sid}:${team.id}`);
              if (memberCalib) {
                calibScores.push(memberCalib.calibratedScore);
              } else if (teamOffset !== null) {
                calibScores.push(parseFloat(Math.min(5, Math.max(0, memberRaw + teamOffset)).toFixed(2)));
              }
            }
          }
          avgScoreByTeam.push({
            teamId: team.id,
            teamName: team.name,
            avgScore: rawAvg,
            weightedAvgScore: teamWeightedScores.length > 0 ? parseFloat(
              (teamWeightedScores.reduce((a, b) => a + b, 0) / teamWeightedScores.length).toFixed(2)
            ) : null,
            calibratedAvgScore: calibScores.length > 0 ? parseFloat((calibScores.reduce((a, b) => a + b, 0) / calibScores.length).toFixed(2)) : null
          });
        }
      }
      const sortedDates = Array.from(dailySubmissions.keys()).sort();
      let cumulative = 0;
      for (const date of sortedDates) {
        const count = dailySubmissions.get(date) ?? 0;
        cumulative += count;
        const formatted = (/* @__PURE__ */ new Date(date + "T00:00:00")).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric"
        });
        submissionTrend.push({ date: formatted, count, cumulative });
      }
    }
  } else {
    for (const subjectId of subjectIds) {
      const counts = subjectAssignmentCounts.get(subjectId) ?? { total: 0, completed: 0 };
      individualSummaries.push({
        subjectId,
        subjectName: subjectNameMap.get(subjectId) ?? "Unknown",
        overallScore: 0,
        weightedOverallScore: null,
        reviewCount: counts.total,
        completedCount: counts.completed,
        calibratedScore: null
      });
    }
  }
  return {
    cycleId,
    cycleName: cycle.name,
    completionRate,
    teamCompletionRates,
    scoreDistribution,
    participationStats,
    individualSummaries,
    avgScoreByTeam,
    avgScoreByRelationship,
    submissionTrend,
    isCalibrated: hasAnyCalibration
  };
}

// src/lib/pdf/render-report.ts
var import_pdfkit = __toESM(require("pdfkit"));
var RELATIONSHIP_DISPLAY = {
  manager: "Manager",
  peer: "Peer",
  directReport: "Direct Report",
  self: "Self",
  external: "External"
};
var COLORS = {
  primary: "#0071e3",
  heading: "#1d1d1f",
  body: "#48484a",
  muted: "#86868b",
  light: "#a1a1a6",
  tableBg: "#f5f5f7",
  border: "#e8e8ed"
};
var PAGE_MARGIN = 50;
var CONTENT_WIDTH = 612 - PAGE_MARGIN * 2;
async function renderReportToPdf(report, cycleName) {
  return new Promise((resolve, reject) => {
    const doc = new import_pdfkit.default({
      size: "LETTER",
      margin: PAGE_MARGIN,
      bufferPages: true
    });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    renderHeader(doc, report.subjectName, cycleName);
    renderOverallScore(doc, report);
    renderRelationshipScores(doc, report.scoresByRelationship);
    renderCategoryScores(doc, report.categoryScores);
    renderTextFeedback(doc, report.textFeedback);
    if (report.teamBreakdowns.length > 1) {
      for (const tb of report.teamBreakdowns) {
        doc.addPage();
        renderTeamBreakdown(doc, tb, cycleName);
      }
    }
    renderFooter(doc);
    doc.end();
  });
}
function ensureSpace(doc, needed) {
  const remaining = doc.page.height - PAGE_MARGIN - doc.y;
  if (remaining < needed) {
    doc.addPage();
    doc.x = PAGE_MARGIN;
  }
}
function resetCursor(doc) {
  doc.x = PAGE_MARGIN;
}
function renderHeader(doc, name, cycleName) {
  doc.font("Helvetica-Bold").fontSize(24).fillColor(COLORS.heading).text(name, { align: "center" });
  doc.font("Helvetica").fontSize(12).fillColor(COLORS.muted).text(cycleName, { align: "center" });
  doc.moveDown(1.5);
}
function renderOverallScore(doc, report) {
  const displayScore = report.calibratedScore ?? report.weightedOverallScore ?? report.overallScore;
  const label = report.calibratedScore != null ? "Overall Score (Calibrated)" : report.weightedOverallScore != null ? "Overall Score (Weighted)" : "Overall Score";
  doc.font("Helvetica-Bold").fontSize(42).fillColor(COLORS.primary).text(displayScore.toFixed(1), { align: "center" });
  doc.font("Helvetica").fontSize(11).fillColor(COLORS.muted).text(label, { align: "center" });
  if (report.calibratedScore != null) {
    const rawLabel = report.weightedOverallScore != null ? `Weighted: ${report.weightedOverallScore.toFixed(1)} | Raw: ${report.overallScore.toFixed(1)}` : `Raw: ${report.overallScore.toFixed(1)}`;
    doc.fontSize(10).fillColor(COLORS.light).text(rawLabel, { align: "center" });
    if (report.calibrationJustification) {
      doc.fontSize(9).fillColor(COLORS.light).text(`Justification: ${report.calibrationJustification}`, { align: "center" });
    }
  } else if (report.weightedOverallScore != null) {
    doc.fontSize(10).fillColor(COLORS.light).text(`Unweighted: ${report.overallScore.toFixed(1)}`, { align: "center" });
  }
  doc.moveDown(1.5);
}
function renderRelationshipScores(doc, scores) {
  const entries = [
    ["manager", scores.manager],
    ["peer", scores.peer],
    ["directReport", scores.directReport],
    ["self", scores.self],
    ["external", scores.external]
  ];
  const filtered = entries.filter(([, v]) => v !== null);
  if (filtered.length === 0) return;
  ensureSpace(doc, 40 + filtered.length * 24);
  doc.font("Helvetica-Bold").fontSize(16).fillColor(COLORS.heading).text("Scores by Relationship");
  doc.moveDown(0.5);
  drawTable(
    doc,
    ["Relationship", "Avg Score"],
    filtered.map(([key, value]) => [
      RELATIONSHIP_DISPLAY[key] ?? key,
      value.toFixed(1)
    ]),
    [CONTENT_WIDTH * 0.65, CONTENT_WIDTH * 0.35]
  );
  resetCursor(doc);
  doc.moveDown(1);
}
function renderCategoryScores(doc, categories) {
  if (categories.length === 0) return;
  ensureSpace(doc, 40 + categories.length * 24);
  resetCursor(doc);
  doc.font("Helvetica-Bold").fontSize(16).fillColor(COLORS.heading).text("Competency Scores");
  doc.moveDown(0.5);
  drawTable(
    doc,
    ["Category", "Score", "Max"],
    categories.map((c) => [c.category, c.score.toFixed(1), String(c.maxScore)]),
    [CONTENT_WIDTH * 0.55, CONTENT_WIDTH * 0.225, CONTENT_WIDTH * 0.225]
  );
  resetCursor(doc);
  doc.moveDown(1);
}
function renderTextFeedback(doc, feedback) {
  if (feedback.length === 0) return;
  ensureSpace(doc, 60);
  resetCursor(doc);
  doc.font("Helvetica-Bold").fontSize(16).fillColor(COLORS.heading).text("Open Feedback", PAGE_MARGIN, void 0, { width: CONTENT_WIDTH });
  doc.moveDown(0.5);
  for (const group of feedback) {
    if (group.responses.length === 0) continue;
    ensureSpace(doc, 50);
    resetCursor(doc);
    const relLabel = RELATIONSHIP_DISPLAY[group.relationship] ?? group.relationship;
    doc.font("Helvetica-Bold").fontSize(12).fillColor(COLORS.body).text(`${relLabel} \u2014 ${group.questionText}`, PAGE_MARGIN, void 0, { width: CONTENT_WIDTH });
    doc.moveDown(0.3);
    for (const response of group.responses) {
      ensureSpace(doc, 30);
      resetCursor(doc);
      doc.font("Helvetica").fontSize(11).fillColor(COLORS.body).text(`  \u2022  ${response}`, PAGE_MARGIN + 8, void 0, {
        width: CONTENT_WIDTH - 16,
        lineGap: 2
      });
      doc.moveDown(0.2);
    }
    doc.moveDown(0.5);
  }
}
function renderTeamBreakdown(doc, tb, _cycleName) {
  resetCursor(doc);
  doc.font("Helvetica-Bold").fontSize(20).fillColor(COLORS.heading).text(tb.teamName, PAGE_MARGIN, void 0, { width: CONTENT_WIDTH });
  doc.moveDown(0.5);
  renderOverallScore(doc, tb);
  renderRelationshipScores(doc, tb.scoresByRelationship);
  renderCategoryScores(doc, tb.weightedCategoryScores ?? tb.categoryScores);
  renderTextFeedback(doc, tb.textFeedback);
}
function renderFooter(doc) {
  const dateStr = (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    const savedY = doc.y;
    doc.font("Helvetica").fontSize(9).fillColor(COLORS.light).text(
      `Generated by Performs360 \xB7 ${dateStr}`,
      PAGE_MARGIN,
      doc.page.height - 35,
      { align: "center", width: CONTENT_WIDTH, lineBreak: false }
    );
    doc.y = savedY;
  }
}
function drawTable(doc, headers, rows, colWidths) {
  const rowHeight = 24;
  const cellPadding = 8;
  const startX = PAGE_MARGIN;
  let y = doc.y;
  doc.rect(startX, y, CONTENT_WIDTH, rowHeight).fill(COLORS.tableBg);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.body);
  let x = startX;
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], x + cellPadding, y + 7, {
      width: colWidths[i] - cellPadding * 2
    });
    x += colWidths[i];
  }
  y += rowHeight;
  doc.font("Helvetica").fontSize(10).fillColor(COLORS.heading);
  for (let r = 0; r < rows.length; r++) {
    ensureSpace(doc, rowHeight + 4);
    y = doc.y;
    if (r % 2 === 1) {
      doc.rect(startX, y, CONTENT_WIDTH, rowHeight).fill(COLORS.tableBg);
      doc.fillColor(COLORS.heading);
    }
    doc.moveTo(startX, y + rowHeight).lineTo(startX + CONTENT_WIDTH, y + rowHeight).strokeColor(COLORS.border).lineWidth(0.5).stroke();
    x = startX;
    for (let c = 0; c < rows[r].length; c++) {
      doc.text(rows[r][c], x + cellPadding, y + 7, {
        width: colWidths[c] - cellPadding * 2
      });
      x += colWidths[c];
    }
    doc.y = y + rowHeight;
  }
  doc.x = PAGE_MARGIN;
  doc.y += 4;
}

// src/lib/jobs/reports-export.ts
var import_jszip = __toESM(require("jszip"));
var MAX_ATTACHMENT_BYTES = 38 * 1024 * 1024;
function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 50);
}
async function handleReportsExportCycle(payload) {
  const { cycleId, companyId, userId, userEmail, dataKeyHex } = payload;
  const dataKey = Buffer.from(dataKeyHex, "hex");
  const cycle = await prisma.evaluationCycle.findFirst({
    where: { id: cycleId, companyId },
    select: { id: true, name: true }
  });
  if (!cycle) throw new Error(`Cycle not found: ${cycleId}`);
  const subjects = await prisma.evaluationAssignment.findMany({
    where: { cycleId },
    select: { subjectId: true },
    distinct: ["subjectId"]
  });
  if (subjects.length === 0) {
    throw new Error("No subjects found in cycle");
  }
  const zip = new import_jszip.default();
  for (const { subjectId } of subjects) {
    const report = await buildIndividualReport(cycleId, subjectId, companyId, dataKey);
    const pdfBuffer = await renderReportToPdf(report, cycle.name);
    const filename = `${sanitizeFilename(report.subjectName)}-${sanitizeFilename(cycle.name)}.pdf`;
    zip.file(filename, pdfBuffer);
  }
  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  if (zipBuffer.length > MAX_ATTACHMENT_BYTES) {
    throw new Error(
      `ZIP file is ${(zipBuffer.length / 1024 / 1024).toFixed(1)} MB, exceeding the 40 MB email attachment limit. Export individual reports instead.`
    );
  }
  const zipFilename = `${sanitizeFilename(cycle.name)}-reports-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.zip`;
  const { html, text } = getReportsExportEmail(cycle.name, subjects.length);
  await sendEmailWithAttachments({
    to: userEmail,
    subject: `${cycle.name} \u2014 Report PDFs ready`,
    html,
    text,
    attachments: [
      {
        filename: zipFilename,
        content: zipBuffer,
        contentType: "application/zip"
      }
    ]
  });
  await writeAuditLog({
    companyId,
    userId,
    action: "decryption",
    target: `cycle:${cycleId}`,
    metadata: {
      type: "reports_export",
      subjectCount: subjects.length,
      deliveredTo: userEmail,
      source: "background_job"
    }
  });
  console.log(
    `[Jobs] Reports export complete for cycle ${cycleId}: ${subjects.length} PDFs emailed to ${userEmail}`
  );
}

// src/lib/excel/render-cycle-report.ts
var import_exceljs = __toESM(require("exceljs"));
var HEADER_FILL = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF0071E3" }
};
var HEADER_FONT = {
  bold: true,
  color: { argb: "FFFFFFFF" },
  size: 11
};
var NUM_FMT = "0.00";
function styleHeader(ws) {
  const row = ws.getRow(1);
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  row.height = 24;
}
function autoWidth(ws) {
  ws.columns.forEach((col) => {
    let max = 12;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? "").length + 2;
      if (len > max) max = len;
    });
    col.width = Math.min(max, 40);
  });
}
async function renderCycleReportToExcel(cycleReport, individuals, cycleName) {
  const wb = new import_exceljs.default.Workbook();
  wb.creator = "Performs360";
  wb.created = /* @__PURE__ */ new Date();
  const summary = wb.addWorksheet("Summary");
  summary.columns = [
    { header: "Metric", key: "metric" },
    { header: "Value", key: "value" }
  ];
  summary.addRow({ metric: "Cycle", value: cycleName });
  summary.addRow({ metric: "Completion Rate", value: `${cycleReport.completionRate.toFixed(1)}%` });
  summary.addRow({ metric: "Total Assignments", value: cycleReport.participationStats.totalAssignments });
  summary.addRow({ metric: "Completed", value: cycleReport.participationStats.completedAssignments });
  summary.addRow({ metric: "Pending", value: cycleReport.participationStats.pendingAssignments });
  summary.addRow({ metric: "In Progress", value: cycleReport.participationStats.inProgressAssignments });
  summary.addRow({});
  summary.addRow({ metric: "Team Completion", value: "" });
  const teamHeaderRow = summary.addRow({ metric: "Team", value: "Completed / Total" });
  teamHeaderRow.getCell(1).font = { bold: true };
  teamHeaderRow.getCell(2).font = { bold: true };
  for (const tc of cycleReport.teamCompletionRates) {
    summary.addRow({ metric: tc.teamName, value: `${tc.completed}/${tc.total} (${tc.rate.toFixed(1)}%)` });
  }
  styleHeader(summary);
  autoWidth(summary);
  const hasWeighted = individuals.some((r) => r.weightedOverallScore != null);
  const hasCalibrated = individuals.some((r) => r.calibratedScore != null);
  const scoresCols = [
    { header: "Name", key: "name" },
    { header: "Team(s)", key: "teams" },
    { header: "Raw Score", key: "rawScore" }
  ];
  if (hasWeighted) scoresCols.push({ header: "Weighted Score", key: "weightedScore" });
  if (hasCalibrated) scoresCols.push({ header: "Calibrated Score", key: "calibratedScore" });
  scoresCols.push(
    { header: "Reviews Done", key: "done" },
    { header: "Total Reviews", key: "total" }
  );
  const scores = wb.addWorksheet("Individual Scores");
  scores.columns = scoresCols;
  const sorted = [...individuals].sort((a, b) => {
    const sa = a.calibratedScore ?? a.weightedOverallScore ?? a.overallScore;
    const sb = b.calibratedScore ?? b.weightedOverallScore ?? b.overallScore;
    return sb - sa;
  });
  const summaryMap = new Map(
    cycleReport.individualSummaries.map((s) => [s.subjectId, s])
  );
  for (const r of sorted) {
    const teamNames = r.teamBreakdowns.length > 0 ? r.teamBreakdowns.map((tb) => tb.teamName).join(", ") : "";
    const summ = summaryMap.get(r.subjectId);
    const row = {
      name: r.subjectName,
      teams: teamNames,
      rawScore: r.overallScore,
      done: summ?.completedCount ?? 0,
      total: summ?.reviewCount ?? 0
    };
    if (hasWeighted) row.weightedScore = r.weightedOverallScore ?? "";
    if (hasCalibrated) row.calibratedScore = r.calibratedScore ?? "";
    const dataRow = scores.addRow(row);
    dataRow.getCell("rawScore").numFmt = NUM_FMT;
    if (hasWeighted && r.weightedOverallScore != null) {
      dataRow.getCell("weightedScore").numFmt = NUM_FMT;
    }
    if (hasCalibrated && r.calibratedScore != null) {
      dataRow.getCell("calibratedScore").numFmt = NUM_FMT;
    }
  }
  styleHeader(scores);
  autoWidth(scores);
  const categories = wb.addWorksheet("Category Breakdown");
  const catCols = [
    { header: "Name", key: "name" },
    { header: "Category", key: "category" },
    { header: "Score", key: "score" },
    { header: "Max", key: "maxScore" }
  ];
  if (hasWeighted) catCols.push({ header: "Weighted Score", key: "weightedScore" });
  categories.columns = catCols;
  for (const r of sorted) {
    const weightedMap = new Map(
      (r.teamBreakdowns[0]?.weightedCategoryScores ?? []).map((c) => [c.category, c.score])
    );
    for (const cat of r.categoryScores) {
      const row = {
        name: r.subjectName,
        category: cat.category,
        score: cat.score,
        maxScore: cat.maxScore
      };
      if (hasWeighted) {
        row.weightedScore = weightedMap.get(cat.category) ?? "";
      }
      const dataRow = categories.addRow(row);
      dataRow.getCell("score").numFmt = NUM_FMT;
      if (hasWeighted && weightedMap.has(cat.category)) {
        dataRow.getCell("weightedScore").numFmt = NUM_FMT;
      }
    }
  }
  styleHeader(categories);
  autoWidth(categories);
  const teamAvg = wb.addWorksheet("Team Averages");
  const teamCols = [
    { header: "Team", key: "team" },
    { header: "Raw Avg", key: "rawAvg" }
  ];
  const hasTeamWeighted = cycleReport.avgScoreByTeam.some((t) => t.weightedAvgScore != null);
  const hasTeamCalibrated = cycleReport.avgScoreByTeam.some((t) => t.calibratedAvgScore != null);
  if (hasTeamWeighted) teamCols.push({ header: "Weighted Avg", key: "weightedAvg" });
  if (hasTeamCalibrated) teamCols.push({ header: "Calibrated Avg", key: "calibratedAvg" });
  teamAvg.columns = teamCols;
  for (const t of cycleReport.avgScoreByTeam) {
    const row = {
      team: t.teamName,
      rawAvg: t.avgScore
    };
    if (hasTeamWeighted) row.weightedAvg = t.weightedAvgScore ?? "";
    if (hasTeamCalibrated) row.calibratedAvg = t.calibratedAvgScore ?? "";
    const dataRow = teamAvg.addRow(row);
    dataRow.getCell("rawAvg").numFmt = NUM_FMT;
    if (hasTeamWeighted && t.weightedAvgScore != null) dataRow.getCell("weightedAvg").numFmt = NUM_FMT;
    if (hasTeamCalibrated && t.calibratedAvgScore != null) dataRow.getCell("calibratedAvg").numFmt = NUM_FMT;
  }
  styleHeader(teamAvg);
  autoWidth(teamAvg);
  const relSheet = wb.addWorksheet("Relationship Scores");
  relSheet.columns = [
    { header: "Name", key: "name" },
    { header: "Manager", key: "manager" },
    { header: "Peer", key: "peer" },
    { header: "Direct Report", key: "directReport" },
    { header: "Self", key: "self" },
    { header: "External", key: "external" }
  ];
  for (const r of sorted) {
    const rel = r.scoresByRelationship;
    const dataRow = relSheet.addRow({
      name: r.subjectName,
      manager: rel.manager ?? "",
      peer: rel.peer ?? "",
      directReport: rel.directReport ?? "",
      self: rel.self ?? "",
      external: rel.external ?? ""
    });
    for (const key of ["manager", "peer", "directReport", "self", "external"]) {
      if (rel[key] != null) dataRow.getCell(key).numFmt = NUM_FMT;
    }
  }
  styleHeader(relSheet);
  autoWidth(relSheet);
  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

// src/lib/jobs/reports-export-excel.ts
var MAX_ATTACHMENT_BYTES2 = 38 * 1024 * 1024;
function sanitizeFilename2(name) {
  return name.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 50);
}
async function handleReportsExportCycleExcel(payload) {
  const { cycleId, companyId, userId, userEmail, dataKeyHex } = payload;
  const dataKey = Buffer.from(dataKeyHex, "hex");
  const cycle = await prisma.evaluationCycle.findFirst({
    where: { id: cycleId, companyId },
    select: { id: true, name: true }
  });
  if (!cycle) throw new Error(`Cycle not found: ${cycleId}`);
  const subjects = await prisma.evaluationAssignment.findMany({
    where: { cycleId },
    select: { subjectId: true },
    distinct: ["subjectId"]
  });
  if (subjects.length === 0) {
    throw new Error("No subjects found in cycle");
  }
  const cycleReport = await buildCycleReport(cycleId, companyId, dataKey);
  const individualReports = [];
  for (const { subjectId } of subjects) {
    const report = await buildIndividualReport(cycleId, subjectId, companyId, dataKey);
    individualReports.push(report);
  }
  const excelBuffer = await renderCycleReportToExcel(
    cycleReport,
    individualReports,
    cycle.name
  );
  if (excelBuffer.length > MAX_ATTACHMENT_BYTES2) {
    throw new Error(
      `Excel file is ${(excelBuffer.length / 1024 / 1024).toFixed(1)} MB, exceeding the 40 MB email attachment limit.`
    );
  }
  const filename = `${sanitizeFilename2(cycle.name)}-scores-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.xlsx`;
  const { html, text } = getReportsExportExcelEmail(cycle.name, subjects.length);
  await sendEmailWithAttachments({
    to: userEmail,
    subject: `${cycle.name} \u2014 Excel Scores Report`,
    html,
    text,
    attachments: [
      {
        filename,
        content: excelBuffer,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }
    ]
  });
  await writeAuditLog({
    companyId,
    userId,
    action: "decryption",
    target: `cycle:${cycleId}`,
    metadata: {
      type: "reports_export_excel",
      subjectCount: subjects.length,
      deliveredTo: userEmail,
      source: "background_job"
    }
  });
  console.log(
    `[Jobs] Excel export complete for cycle ${cycleId}: ${subjects.length} subjects emailed to ${userEmail}`
  );
}

// src/lib/blog-utils.ts
var import_isomorphic_dompurify = __toESM(require("isomorphic-dompurify"));
var import_crypto2 = require("crypto");
var ALLOWED_TAGS = [
  "h2",
  "h3",
  "h4",
  "p",
  "ul",
  "ol",
  "li",
  "a",
  "strong",
  "em",
  "b",
  "i",
  "br",
  "blockquote",
  "code",
  "pre",
  "hr",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "span",
  "div",
  "sup",
  "sub"
];
var ALLOWED_ATTR = ["href", "rel", "target", "id", "class"];
function sanitizeHtml(dirty) {
  return import_isomorphic_dompurify.default.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR
  });
}
function sanitizeSlug(raw) {
  return raw.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function getEncryptionKey() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  const { createHash } = require("crypto");
  return createHash("sha256").update(secret).digest();
}
function decryptApiKey(stored) {
  if (!stored || !stored.includes(":")) return stored;
  const parts = stored.split(":");
  if (parts.length !== 3) return "";
  const [ivB64, tagB64, ciphertextB64] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");
  const decipher = (0, import_crypto2.createDecipheriv)("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]);
  return decrypted.toString("utf8");
}

// src/lib/ollama.ts
async function getBlogSettings() {
  const settings = await prisma.blogSettings.findUnique({
    where: { id: "singleton" }
  });
  if (!settings || !settings.ollamaApiUrl) {
    throw new Error(
      "Blog settings not configured. Set Ollama API URL in SuperAdmin > Blog settings."
    );
  }
  const apiKey = decryptApiKey(settings.ollamaApiKey);
  return { ...settings, ollamaApiKey: apiKey };
}
function buildHeaders(apiKey) {
  const headers = {
    "Content-Type": "application/json"
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }
  return headers;
}
async function listModels() {
  const settings = await getBlogSettings();
  const baseUrl = settings.ollamaApiUrl.replace(/\/$/, "");
  const res = await fetch(`${baseUrl}/api/tags`, {
    method: "GET",
    headers: buildHeaders(settings.ollamaApiKey)
  });
  if (!res.ok) {
    throw new Error(`Ollama /api/tags failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.models ?? [];
}
async function generate(prompt, system, options) {
  const settings = await getBlogSettings();
  const baseUrl = settings.ollamaApiUrl.replace(/\/$/, "");
  const headers = buildHeaders(settings.ollamaApiKey);
  const modelsToTry = [];
  if (settings.ollamaModel) {
    modelsToTry.push(settings.ollamaModel);
  }
  try {
    const available = await listModels();
    for (const m of available) {
      if (!modelsToTry.includes(m.name)) {
        modelsToTry.push(m.name);
      }
    }
  } catch {
    if (modelsToTry.length === 0) {
      throw new Error("No Ollama models available and /api/tags failed");
    }
  }
  if (modelsToTry.length === 0) {
    throw new Error("No Ollama models available");
  }
  let lastError = null;
  for (const model of modelsToTry) {
    try {
      const body = {
        model,
        prompt,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.numPredict ?? 4096,
          num_ctx: options?.numCtx ?? 8192,
          top_p: options?.topP ?? 0.9
        }
      };
      if (system) {
        body.system = system;
      }
      const res = await fetch(`${baseUrl}/api/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(3e5)
        // 5 min timeout
      });
      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(
          `Ollama generate failed (model: ${model}): ${res.status} ${errorText}`
        );
      }
      const data = await res.json();
      console.log(
        `[Ollama] Generated with model=${model}, tokens=${data.eval_count ?? "?"}, done=${data.done}, done_reason=${data.done_reason ?? "none"}`
      );
      if (!data.response || data.response.trim().length === 0) {
        throw new Error(
          `Ollama returned empty response (model: ${model}, done: ${data.done}, done_reason: ${data.done_reason ?? "none"}, eval_count: ${data.eval_count ?? 0})`
        );
      }
      return data.response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `[Ollama] Model ${model} failed: ${lastError.message}. Trying next model...`
      );
    }
  }
  throw new Error(
    `All Ollama models failed. Last error: ${lastError?.message}`
  );
}

// src/lib/blog-prompt.ts
function buildSystemPrompt() {
  return `You are a senior HR consultant and writer with 15+ years in performance management, employee engagement, and organizational development. You write for Performs360.

VOICE:
- Conversational, peer-to-peer. Like explaining to a smart colleague over coffee.
- Use first-person sparingly: "I've seen teams struggle with...", "In my experience..."
- Share specific anecdotes: "At one mid-size company I worked with...", "A manager I coached once told me..."
- Have strong opinions. Say what works, what doesn't, and why.
- Use contractions naturally. Ask occasional rhetorical questions.

NEVER use these phrases: "In today's fast-paced world", "It's no secret that", "In the ever-evolving landscape", "Let's dive in", "Game-changer", "Unlock the power of", "At the end of the day", "Navigate the complexities", "It is important to note that", "It goes without saying", "Needless to say"

EXAMPLE OF GOOD TONE:
"I once worked with a 200-person company that ran annual reviews like clockwork \u2014 and nobody trusted them. Managers copied last year's comments, employees nodded along, and nothing changed. When they switched to quarterly 360-degree feedback using Performs360, something shifted. People actually started talking to each other about performance, not just about it."

EXAMPLE OF BAD TONE (never write like this):
"In today's rapidly evolving business landscape, performance management has become a critical component of organizational success. It is important to note that companies that invest in robust feedback mechanisms are better positioned to drive employee engagement and achieve strategic objectives. Let's dive into the key strategies that can unlock the full potential of your workforce."

PERFORMS360 PROMOTION:
Performs360 is a free 360-degree performance review platform. Pick 2-3 features from the list below that naturally fit the article's topic. Mention each once, woven into the narrative \u2014 not listed or dumped together.

Available features (choose what fits):
- Free forever, no credit card, no vendor lock-in
- End-to-end AES-256-GCM encryption with company-owned keys (Argon2id)
- Zero-access architecture \u2014 not even Performs360 can read your data
- Auto-generated reviewer assignments from org chart
- Custom evaluation templates (rating scales, open-text, multiple choice)
- Per-level templates: different evaluation forms based on employee level (e.g. junior vs senior engineers get different review criteria)
- Per-direction templates: different templates based on review relationship (e.g. manager\u2192report uses a leadership template, peer\u2192peer uses a collaboration template, self-review uses a reflection template)
- Impersonator role: designate someone (e.g. HR or an external coach) to submit reviews on behalf of specific relationships \u2014 useful when a reviewer is unavailable, or for anonymous third-party assessments
- Zero-friction for reviewers: secure link + OTP, no accounts needed
- Reports with radar charts, score breakdowns, anonymized feedback by relationship type
- Relationship weight control: adjust how much weight manager, peer, direct report, self, and external feedback carries in the final score
- Post-evaluation calibration: adjust scores after feedback collection with justifications, at team or individual level
- Trend analytics: score distribution, completion trends, self-vs-others gap analysis, and relationship trend analysis across cycles
- Excel and PDF export: download cycle-wide spreadsheet or individual PDF reports
- Encryption key rotation: rotate keys without losing data
- Recovery codes: backup access if the company passphrase is lost
- Passwordless login: magic link authentication, no passwords to manage
- Audit logging: full trail of who did what and when (cycle activations, role changes, decryptions)
- Template sections: organize evaluation questions into logical groups within a template
- CSV team import: bulk import teams with hierarchical manager relationships
- Cycle reminders: send email nudges to reviewers with pending evaluations
- Full GDPR deletion: complete company data destruction with optional pre-export
- Global templates: platform-wide templates available to all companies out of the box
- Scales from 5 to 5,000 team members

Write with confidence: "Performs360 handles this automatically", "Tools like Performs360 make this simple".
End the conclusion with a CTA linking to Performs360 \u2014 vary the phrasing each time. Examples:
- "Try <a href="https://performs360.com" target="_blank" rel="noopener">Performs360</a> free \u2014 no credit card required."
- "See how <a href="https://performs360.com" target="_blank" rel="noopener">Performs360</a> makes 360-degree reviews effortless."
- "Get started with <a href="https://performs360.com" target="_blank" rel="noopener">Performs360</a> and run your first cycle in minutes."
Do NOT reuse the same CTA sentence across articles.

REFERENCES (include 2-3 per article):
Cite real research inline. Use the source name and year without a URL link, since URLs may not be accurate.
The current year is ${(/* @__PURE__ */ new Date()).getFullYear()}. Use recent citations (within the last 3-5 years).
Format: "According to Gallup's 2024 State of the Workplace report, ..." or "A 2023 McKinsey study found that ..."
Acceptable sources: Gallup, Deloitte, McKinsey, Gartner, SHRM, Harvard Business Review, Forbes, BLS, EEOC.

OUTPUT: Always respond with valid JSON matching the exact schema requested. No markdown fences, no extra text outside the JSON.`;
}
async function buildArticlePrompt() {
  const existingPosts = await prisma.blogPost.findMany({
    select: { title: true, slug: true, primaryKeyword: true },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  const existingTitles = existingPosts.map((p) => p.title);
  const recentKeywords = existingPosts.map((p) => p.primaryKeyword);
  const titlesBlock = existingTitles.length > 0 ? `

These articles already exist \u2014 do NOT repeat or closely rephrase any of them:
${existingTitles.map((t) => `- ${t}`).join("\n")}` : "";
  const keywordsBlock = recentKeywords.length > 0 ? `

Recent primary keywords (pick a DIFFERENT category than these): ${[...new Set(recentKeywords)].join(", ")}` : "";
  const internalLinksBlock = existingTitles.length > 0 ? `

INTERNAL LINKING: If relevant, link to one existing blog post inline. Available posts:
${existingPosts.slice(0, 10).map((p) => `- <a href="https://performs360.com/blog/${p.slug}">${p.title}</a>`).join("\n")}` : "";
  return `First, choose a specific, narrow blog topic from ONE of these categories. Pick a DIFFERENT category than the recent keywords listed below.

CATEGORY A \u2014 Performance & Feedback:
  360-degree reviews, performance management strategies, review best practices, continuous feedback culture, goal setting and OKRs

CATEGORY B \u2014 People & Culture:
  employee engagement and retention, workplace culture, psychological safety, employee wellbeing and burnout, DEI in the workplace, employee recognition programs

CATEGORY C \u2014 Leadership & Development:
  manager coaching and leadership, talent development and upskilling, succession planning, conflict resolution, change management

CATEGORY D \u2014 Operations & Productivity:
  team productivity and collaboration, remote/hybrid work, workplace communication, meeting culture and productivity, cross-functional collaboration

CATEGORY E \u2014 HR Strategy & Tech:
  HR technology trends, people analytics, compensation and benefits strategy, employer branding, onboarding best practices, exit interviews and offboarding, internal mobility and career pathing, org design and restructuring, AI in HR
${titlesBlock}${keywordsBlock}${internalLinksBlock}

The topic must be narrow and specific (not a broad overview). It should be something a manager, HR professional, or team lead would actually search for.

Then write a comprehensive blog article about that topic.

CONTENT:
- ${BLOG_CONFIG.minWords}-${BLOG_CONFIG.maxWords} words
- Conversational tone \u2014 the reader should feel like they're learning from someone who's been there
- Mix short punchy sentences with longer explanatory ones
- Give specific, concrete advice \u2014 name real techniques, frameworks, or scenarios
- Include 2-3 data points or statistics from named sources (e.g. "Gallup's 2023 report found...")

FLOW:
- Every paragraph must logically follow the previous one. Use transitions: "That's why...", "But here's the catch...", "Building on that...", "The flip side is..."
- Each section should tell a mini-story: set up a problem, explore it, land on an insight
- Don't list disconnected tips \u2014 show how one practice leads to another
- Article arc: hook \u2192 problem \u2192 exploration \u2192 solution \u2192 takeaway
- Write narrative articles, NOT listicles. Lists support the prose \u2014 they are not the article. Never structure the whole article as "10 tips for X" or "7 ways to Y".

PARAGRAPHS:
- 2-4 sentences max per <p> tag. Never longer.
- Each section under an <h2> should have 2-4 separate <p> tags
- Alternate between paragraphs, lists, and sub-headings. No walls of text.

HTML STRUCTURE:
- No <h1> tags (title is rendered separately)
- Start with a 2-3 sentence intro <p>, followed by a preview <p>
- Use <h2> for 4-6 main sections, <h3> for sub-points
- Every paragraph in its own <p> tag \u2014 one idea per <p>
- Use <ul>/<ol> with <li> \u2014 at least 2 lists in the article
- End with <h2>Conclusion</h2> containing a takeaway <p> and a CTA <p> that links to <a href="https://performs360.com" target="_blank" rel="noopener">Performs360</a>
- No <img> tags

SEO:
- Primary keyword in the first 100 words, in at least one <h2>, and in the conclusion
- 8+ semantically related keywords used naturally
- Grade 6-9 readability
- Structure one section for featured snippet optimization (clear definition or numbered list)

Respond with this exact JSON:
{
  "title": "Engaging article title (50-65 characters)",
  "meta_title": "SEO-optimized page title (max 60 characters)",
  "slug": "url-friendly-slug",
  "excerpt": "Summary for card display (120-160 characters)",
  "content_html": "Full HTML article following the rules above",
  "meta_description": "SEO meta description (150-160 characters)",
  "primary_keyword": "primary keyword phrase (2-4 words)",
  "semantic_keywords": ["kw1", "kw2", "kw3", "kw4", "kw5", "kw6", "kw7", "kw8"]
}`;
}
function validateArticleSchema(data) {
  const requiredKeys = [
    "title",
    "meta_title",
    "slug",
    "excerpt",
    "content_html",
    "meta_description",
    "primary_keyword",
    "semantic_keywords"
  ];
  for (const key of requiredKeys) {
    if (!(key in data) || data[key] === null || data[key] === void 0) {
      return false;
    }
  }
  if (!Array.isArray(data.semantic_keywords)) {
    return false;
  }
  return true;
}

// src/lib/jobs/blog-generate.ts
async function handleBlogGenerate(payload) {
  const { count } = payload;
  const systemPrompt = buildSystemPrompt();
  let successCount = 0;
  const errors = [];
  for (let i = 0; i < count; i++) {
    try {
      console.log(`[BlogGenerate] Generating article ${i + 1}/${count}...`);
      const articlePrompt = await buildArticlePrompt();
      const articleRaw = await generate(articlePrompt, systemPrompt, {
        temperature: 0.7,
        numPredict: 4096,
        numCtx: 8192
      });
      const articleRawData = parseJson(articleRaw);
      if (!articleRawData || !validateArticleSchema(articleRawData)) {
        throw new Error(
          `Invalid article response: missing required fields. Keys: ${Object.keys(articleRawData ?? {}).join(", ")}`
        );
      }
      const articleData = articleRawData;
      const wordCount = countWords(articleData.content_html);
      if (wordCount < BLOG_CONFIG.minWords || wordCount > BLOG_CONFIG.maxWords) {
        console.warn(
          `[BlogGenerate] Article ${i + 1} word count ${wordCount} outside range ${BLOG_CONFIG.minWords}-${BLOG_CONFIG.maxWords}, proceeding anyway`
        );
      }
      const existingTitles = await prisma.blogPost.findMany({
        select: { title: true },
        orderBy: { createdAt: "desc" },
        take: 50
      });
      const similarTitle = existingTitles.find(
        (p) => titleSimilarity(p.title, articleData.title) > 0.7
      );
      if (similarTitle) {
        throw new Error(
          `Generated title "${articleData.title}" is too similar to existing title "${similarTitle.title}"`
        );
      }
      const cleanHtml = sanitizeHtml(articleData.content_html);
      const slug = await ensureUniqueSlug(articleData.slug);
      await prisma.blogPost.create({
        data: {
          title: articleData.title,
          slug,
          excerpt: articleData.excerpt,
          contentHtml: cleanHtml,
          metaTitle: articleData.meta_title,
          metaDescription: articleData.meta_description,
          primaryKeyword: articleData.primary_keyword,
          semanticKeywords: articleData.semantic_keywords,
          status: "PUBLISHED",
          publishedAt: /* @__PURE__ */ new Date()
        }
      });
      successCount++;
      console.log(
        `[BlogGenerate] Article ${i + 1} saved: "${articleData.title}" (${wordCount} words)`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Article ${i + 1}: ${message}`);
      console.error(`[BlogGenerate] Article ${i + 1} failed: ${message}`);
    }
  }
  console.log(
    `[BlogGenerate] Done. ${successCount}/${count} articles generated.`
  );
  if (successCount === 0) {
    throw new Error(
      `All ${count} articles failed to generate. Errors: ${errors.join("; ")}`
    );
  }
}
function parseJson(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      try {
        return JSON.parse(fenceMatch[1].trim());
      } catch {
      }
    }
    const braceMatch = trimmed.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}
function countWords(html) {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return 0;
  return text.split(" ").length;
}
function titleSimilarity(a, b) {
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const bigrams = (s) => {
    const words = normalize(s).split(/\s+/);
    const set = /* @__PURE__ */ new Set();
    for (let i = 0; i < words.length - 1; i++) {
      set.add(`${words[i]} ${words[i + 1]}`);
    }
    return set;
  };
  const setA = bigrams(a);
  const setB = bigrams(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const bg of setA) {
    if (setB.has(bg)) intersection++;
  }
  return 2 * intersection / (setA.size + setB.size);
}
async function ensureUniqueSlug(baseSlug) {
  const slug = sanitizeSlug(baseSlug) || `post-${Date.now()}`;
  const existing = await prisma.blogPost.findMany({
    where: {
      slug: { startsWith: slug }
    },
    select: { slug: true }
  });
  const existingSlugs = new Set(existing.map((p) => p.slug));
  if (!existingSlugs.has(slug)) return slug;
  let counter = 2;
  while (counter <= 100) {
    const candidate = `${slug}-${counter}`;
    if (!existingSlugs.has(candidate)) return candidate;
    counter++;
  }
  return `${slug}-${Date.now()}`;
}

// src/lib/jobs/index.ts
var jobHandlers = /* @__PURE__ */ new Map([
  ["email.send", handleEmailSend],
  ["cycle.activate", handleCycleActivate],
  ["cycle.remind", handleCycleRemind],
  ["cycle.auto-close", handleCycleAutoClose],
  ["encryption.rotate-key", handleEncryptionRotateKey],
  ["cleanup.otp-sessions", handleCleanupOtpSessions],
  ["data.export", handleDataExport],
  ["company.destroy", handleCompanyDestroy],
  ["reports.export-cycle", handleReportsExportCycle],
  ["reports.export-cycle-excel", handleReportsExportCycleExcel],
  ["blog.generate", handleBlogGenerate]
]);

// scripts/worker.ts
async function scheduleCronJobs() {
  if (!await hasPendingJob(JOB_TYPES.CYCLE_AUTO_CLOSE)) {
    await enqueue(JOB_TYPES.CYCLE_AUTO_CLOSE, {});
  }
  if (!await hasPendingJob(JOB_TYPES.CLEANUP_OTP_SESSIONS)) {
    await enqueue(JOB_TYPES.CLEANUP_OTP_SESSIONS, {});
  }
  if (!await hasPendingJob(JOB_TYPES.BLOG_GENERATE)) {
    try {
      const todayStart = /* @__PURE__ */ new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayPostCount = await prisma.blogPost.count({
        where: { createdAt: { gte: todayStart } }
      });
      if (todayPostCount === 0) {
        const settings = await prisma.blogSettings.findUnique({
          where: { id: "singleton" }
        });
        if (settings?.ollamaApiUrl && !settings.generationPaused) {
          await enqueue(
            JOB_TYPES.BLOG_GENERATE,
            { count: BLOG_CONFIG.dailyArticleCount },
            { maxAttempts: 1 }
          );
          console.log("[Worker] Scheduled daily blog generation");
        }
      }
    } catch {
    }
  }
}
async function main() {
  console.log("[Worker] Starting Performs360 job queue worker...");
  const worker = createWorker(jobHandlers, {
    pollIntervalMs: JOB_CONFIG.pollIntervalMs
  });
  await scheduleCronJobs();
  const schedulerTimer = setInterval(
    scheduleCronJobs,
    JOB_CONFIG.schedulerIntervalMs
  );
  const shutdown = async () => {
    clearInterval(schedulerTimer);
    await worker.stop();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
  await worker.start();
}
main().catch((err) => {
  console.error("[Worker] Fatal error:", err);
  process.exit(1);
});
