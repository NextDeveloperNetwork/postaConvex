import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email", placeholder: "arben@posta.al" },
        password: { label: "Fjalëkalimi", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (dbUser) {
            return {
              id: dbUser.id,
              name: dbUser.name || credentials.email.split('@')[0],
              email: dbUser.email,
              role: dbUser.role,
              officeId: dbUser.officeId,
              officeName: dbUser.officeName,
            } as any;
          }
        } catch (e) {
          console.error('Error fetching user during auth:', e);
        }

        return {
          id: "usr-" + Date.now(),
          name: credentials.email.split('@')[0],
          email: credentials.email,
          role: "PENDING",
        };
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role || "PENDING";
        (session.user as any).id = token.sub;
        (session.user as any).officeId = token.officeId;
        (session.user as any).officeName = token.officeName;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || "PENDING";
        token.officeId = (user as any).officeId;
        token.officeName = (user as any).officeName;
      }
      return token;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
};
