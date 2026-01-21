import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { stripe } from "@/lib/stripe";

// Validate presence of required environment variables for B2C
if (!process.env.AZURE_B2C_WELL_KNOWN_URL) {
    console.warn("Missing AZURE_B2C_WELL_KNOWN_URL");
}
if (!process.env.AZURE_B2C_CLIENT_ID) {
    console.warn("Missing AZURE_B2C_CLIENT_ID");
}
if (!process.env.AZURE_B2C_CLIENT_SECRET) {
    console.warn("Missing AZURE_B2C_CLIENT_SECRET");
}

const DEFAULT_SESSION_EXPIRATION = 8 * 60 * 60 * 1000; // Default to 8 hours in milliseconds
const sessionExpiration = (() => {
    const expiration = Number(process.env.SESSION_EXPIRATION_MILLIS);
    return !isNaN(expiration) && expiration > 0 ? expiration : DEFAULT_SESSION_EXPIRATION;
})();

// Extend the JWT type to include displayName, picture, and Stripe fields
declare module "next-auth/jwt" {
    interface JWT {
        accessToken?: string
        idToken?: string
        displayName?: string
        jobTitle?: string
        surname?: string
        oid?: string
        sub?: string
        picture?: string
        aud?: string
        authTime?: number
        stripeId?: string | null;
        paymentStatus?: boolean;
        expiryDate?: string | null;
        session_expiry?: string;
        session_start?: string;
    }
}

// Define a custom profile type for Azure AD B2C
interface AzureB2CProfile extends Record<string, unknown> {
    sub?: string
    name?: string
    given_name?: string
    family_name?: string
    email?: string
    emails?: string[]
    picture?: string
    displayName?: string
    jobTitle?: string
    surname?: string
    oid?: string
    aud?: string
    auth_time?: number
}

// Extend the built-in session type
declare module "next-auth" {
    interface Session {
        user: {
            id?: string
            name?: string | null
            email?: string | null
            image?: string | null
            displayName?: string
            jobTitle?: string
            surname?: string
            oid?: string
            sub?: string
            aud?: string
            authTime?: number | null
            session_id?: string
            stripeId?: string
            paymentStatus?: boolean
            expiryDate?: string
        }
        accessToken?: string
        idToken?: string
        expires?: string
        session_expiry?: string
        session_start?: string
        session_elapsed_time?: number
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        {
            id: "azure-ad-b2c",
            name: "Azure AD B2C",
            type: "oauth",
            wellKnown: process.env.AZURE_B2C_WELL_KNOWN_URL,
            clientId: process.env.AZURE_B2C_CLIENT_ID as string,
            clientSecret: process.env.AZURE_B2C_CLIENT_SECRET as string,
            authorization: {
                params: {
                    scope: "openid profile email offline_access",
                    response_type: "code",
                },
            },
            client: {
                token_endpoint_auth_method: 'none'
            },
            idToken: true,
            checks: ["pkce", "state"],
            profile(profile: AzureB2CProfile) {
                if (process.env.NODE_ENV !== "production") {
                    console.log("profile azure ad b2c fetched: ", profile)
                }
                return {
                    id: profile.sub || "-1", // Mapping `sub` to `id`
                    name: profile.name || profile.given_name,
                    email: profile.emails?.[0] || profile.email,
                    image: profile.picture,
                    displayName: profile.displayName, // Ensure displayName is included
                    jobTitle: profile.jobTitle,
                    surname: profile.surname,
                    oid: profile.oid,
                    sub: profile.sub,
                    aud: profile.aud,
                    authTime: profile.auth_time
                }
            },
        },
    ],
    callbacks: {
        async jwt({ token, user, account, profile, trigger, session }) {
            // B2C Specific Logic
            if (account && account.provider === "azure-ad-b2c") {
                const azureB2CProfile = profile as AzureB2CProfile
                token.accessToken = account.access_token
                token.idToken = account.id_token
                token.sub = azureB2CProfile?.sub
                token.displayName = azureB2CProfile?.displayName
                token.jobTitle = azureB2CProfile?.jobTitle
                token.picture = azureB2CProfile?.picture
                token.oid = azureB2CProfile?.oid
                token.aud = azureB2CProfile?.aud
                token.authTime = azureB2CProfile?.auth_time
                token.session_expiry = new Date(Date.now() + sessionExpiration).toISOString();
                token.session_start = new Date().toISOString()
            }

            // Stripe & General Logic dijalankan saat Sign In awal
            if (user && user.email) {
                // Inisialisasi nilai default agar tidak undefined
                if (token.stripeId === undefined) token.stripeId = null;
                if (token.paymentStatus === undefined) token.paymentStatus = false;
                if (token.expiryDate === undefined) token.expiryDate = null;

                try {
                    const customers = await stripe.customers.list({
                        email: user.email,
                        limit: 1,
                    });

                    if (customers.data.length > 0) {
                        const customer = customers.data[0];
                        const subscriptions = await stripe.subscriptions.list({
                            customer: customer.id,
                            status: "active",
                            limit: 1,
                        });

                        if (subscriptions.data.length > 0) {
                            const sub = subscriptions.data[0];
                            token.stripeId = customer.id;
                            token.paymentStatus = true;
                            // Type assertion for stripe v20 compatibility
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            token.expiryDate = new Date((sub as any).current_period_end * 1000).toISOString();
                        }
                    }
                } catch (error) {
                    console.error("Stripe Error during JWT callback:", error);
                }
            }

            // Opsional: Jika Anda ingin update sesi secara manual setelah pembayaran sukses
            if (trigger === "update" && session?.paymentStatus !== undefined) {
                token.paymentStatus = session.paymentStatus;
            }

            return token;
        },
        async session({ session, token }: any) {
            session.accessToken = token.accessToken as string | undefined
            session.idToken = token.idToken as string | undefined

            if (session.user) {
                // Stripe fields
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (session.user as any).stripeId = token.stripeId as string;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (session.user as any).paymentStatus = token.paymentStatus as boolean;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (session.user as any).expiryDate = token.expiryDate as string;

                // B2C fields
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (token.sub) (session.user as any).id = token.sub;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (token.displayName) (session.user as any).displayName = token.displayName;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (token.jobTitle) (session.user as any).jobTitle = token.jobTitle;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (token.surname) (session.user as any).surname = token.surname;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (token.oid) (session.user as any).oid = token.oid;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (token.sub) (session.user as any).sub = token.sub;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (token.aud) (session.user as any).aud = token.aud;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (token.authTime) (session.user as any).authTime = token.authTime;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (token.sub && token.authTime) (session.user as any).session_id = `${token.sub}_${token.authTime}`;
            }

            session.expires = token.session_expiry || session.expires
            session.session_start = token.session_start
            if (session.session_start) {
                session.session_elapsed_time = new Date().getTime() - new Date(session.session_start).getTime()
            }

            return session;
        },
        async redirect({ url, baseUrl }) {
            if (url === "/api/auth/signout") {
                // Respect custom logout URL if present
                if (process.env.AZURE_B2C_LOGOUT_URL) {
                    return process.env.AZURE_B2C_LOGOUT_URL;
                }
                // Fallback to constructing it if variables are present, otherwise default behavior
                if (process.env.AZURE_B2C_WELL_KNOWN_URL) {
                    // Try to guess logout url or use generic one if needed, but for now just return baseUrl or standard
                    // The user code had a hardcoded string fallback, I'll keep the logic simple or use their fallback
                    return `https://genesise3ai.b2clogin.com/genesise3ai.onmicrosoft.com/B2C_1_genesis_sign_in/oauth2/v2.0/logout?p=B2C_1_genesis_sign_in&post_logout_redirect_uri=${baseUrl}/logout`;
                }
            }
            return url.startsWith(baseUrl) ? url : baseUrl
        },
    },
    debug: process.env.NEXT_AUTH_ROUTE_DEBUG?.toLowerCase() === "true" || false,
    secret: process.env.NEXTAUTH_SECRET,
};
