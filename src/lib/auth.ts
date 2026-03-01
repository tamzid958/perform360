import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { sendEmail, getMagicLinkEmail } from "./email";

type AppUserRole = "ADMIN" | "HR" | "MEMBER";

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
      server: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
      from: process.env.SMTP_FROM || "noreply@performs360.com",
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
          where: { email: user.email },
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

        // Resolve app User via authUserId link (handles multi-company correctly)
        // Falls back to email lookup for legacy users without authUserId set
        const appUser = await prisma.user.findFirst({
          where: {
            OR: [
              { authUserId: user.id },
              { email: session.user.email },
            ],
          },
          orderBy: { createdAt: "desc" },
          select: { id: true, role: true, companyId: true },
        });

        if (appUser) {
          session.user.role = appUser.role;
          session.user.companyId = appUser.companyId;
        }
      }
      return session;
    },
  },
  session: {
    strategy: "database",
  },
});
