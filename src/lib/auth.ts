import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

type AppUserRole = "ADMIN" | "HR" | "MANAGER" | "MEMBER";

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(adapterPrisma) as ReturnType<typeof PrismaAdapter>,
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
      from: process.env.SMTP_FROM || "noreply@perform360.com",
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/verify",
  },
  callbacks: {
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
