import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { sendEmail, getMagicLinkEmail } from "./email";
import { getSelectedCompanyId, clearSelectedCompany } from "./company-cookie";

type AppUserRole = "ADMIN" | "HR" | "EMPLOYEE" | "EXTERNAL";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      role?: AppUserRole;
      companyId?: string;
    };
  }
}

// Proxy prisma client so PrismaAdapter uses AuthUser (email @unique)
// instead of User (@@unique([email, companyId]))
const adapterPrisma = new Proxy(prisma, {
  get(target, prop, receiver) {
    if (prop === "user") return target.authUser;
    return Reflect.get(target, prop, receiver);
  },
});

const baseAdapter = PrismaAdapter(adapterPrisma) as ReturnType<typeof PrismaAdapter>;

// Wrap deleteSession to handle "record not found" errors gracefully.
// The email provider callback can attempt to delete a session that
// doesn't exist (e.g. first login, expired/cleaned session).
const adapter: typeof baseAdapter = {
  ...baseAdapter,
  async deleteSession(sessionToken: string) {
    try {
      await prisma.session.delete({ where: { sessionToken } });
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.name === "PrismaClientKnownRequestError" &&
        "code" in error &&
        (error as { code: string }).code === "P2025"
      ) {
        return;
      }
      throw error;
    }
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  providers: [
    EmailProvider({
      server: { host: "", port: 0, auth: { user: "", pass: "" } },
      from: "noreply@performs360.com",
      async sendVerificationRequest({ identifier: email, url }) {
        const { html, text } = getMagicLinkEmail(url);
        await sendEmail({
          to: email,
          subject: "Sign in to Performs360",
          html,
          text,
        });
      },
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/verify",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return false;
      const [appUser, superAdmin] = await Promise.all([
        prisma.user.findFirst({
          where: {
            email: user.email,
            archivedAt: null,
            role: { in: ["ADMIN", "HR"] },
          },
          select: { id: true },
        }),
        prisma.superAdmin.findUnique({
          where: { email: user.email },
          select: { id: true },
        }),
      ]);
      if (!appUser && !superAdmin) return false;
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;

        // Check if user has a selected company (cookie-based, for multi-company support)
        let selectedCompanyId: string | null = null;
        try {
          selectedCompanyId = await getSelectedCompanyId();
        } catch {
          // cookies() may not be available in all contexts
        }

        let appUser;
        if (selectedCompanyId) {
          // Validate ownership — user must belong to the selected company
          appUser = await prisma.user.findFirst({
            where: {
              archivedAt: null,
              OR: [
                { authUserId: user.id, companyId: selectedCompanyId },
                { email: session.user.email, companyId: selectedCompanyId },
              ],
            },
            select: { id: true, role: true, companyId: true },
          });

          // Tampered or stale cookie — clear it
          if (!appUser) {
            try {
              await clearSelectedCompany();
            } catch {
              // cookies() may not be writable in all contexts
            }
          }
        }

        // Fallback: no cookie, tampered cookie, or stale cookie
        if (!appUser) {
          appUser = await prisma.user.findFirst({
            where: {
              archivedAt: null,
              OR: [
                { authUserId: user.id },
                { email: session.user.email },
              ],
            },
            orderBy: { createdAt: "desc" },
            select: { id: true, role: true, companyId: true },
          });
        }

        if (appUser) {
          session.user.role = appUser.role;
          session.user.companyId = appUser.companyId;
        }
      }
      return session;
    },
  },
  events: {
    async signOut() {
      try {
        await clearSelectedCompany();
      } catch {
        // cookies() may not be available in all signOut contexts
      }
    },
  },
  session: {
    strategy: "database",
  },
});
