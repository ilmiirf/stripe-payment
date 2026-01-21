import NextAuth, { NextAuthOptions } from "next-auth";
import AzureADB2CProvider from "next-auth/providers/azure-ad-b2c";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
    providers: [
        AzureADB2CProvider({
            tenantId: process.env.AZURE_AD_B2C_TENANT_NAME!,
            clientId: process.env.AZURE_AD_B2C_CLIENT_ID!,
            clientSecret: process.env.AZURE_AD_B2C_CLIENT_SECRET!,
            primaryUserFlow: process.env.AZURE_AD_B2C_PRIMARY_USER_FLOW!,
            authorization: { params: { scope: "offline_access openid" } },
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        GithubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (!user.email || !account) return false;

            // Ensure user exists in DB
            try {
                const existingUser = await prisma.user.findUnique({
                    where: { email: user.email },
                });

                if (!existingUser) {
                    await prisma.user.create({
                        data: {
                            email: user.email,
                            name: user.name,
                            image: user.image,
                            providerAccountId: account.providerAccountId,
                        },
                    });
                }
                return true;
            } catch (error) {
                console.error("Error creating user:", error);
                return false;
            }
        },
        async session({ session, token }) {
            if (session.user?.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: session.user.email },
                });

                if (dbUser) {
                    // Attach custom fields to session
                    (session as any).user.id = dbUser.id;
                    (session as any).user.stripeCustomerId = dbUser.stripeCustomerId;
                    (session as any).user.subscriptionStatus = dbUser.subscriptionStatus;
                    (session as any).user.planInterval = dbUser.planInterval;
                }
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
