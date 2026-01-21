import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const pathname = req.nextUrl.pathname;

        // If user is authenticated
        if (token) {
            const user = token as any;

            // Allow access to dashboard if coming from success payment
            // This gives time for webhook to update database
            if (pathname === "/dashboard" && req.nextUrl.searchParams.get("success") === "true") {
                return NextResponse.next();
            }

            // Redirect from landing page to appropriate page
            if (pathname === "/") {
                if (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing") {
                    return NextResponse.redirect(new URL("/dashboard", req.url));
                } else {
                    return NextResponse.redirect(new URL("/pricing", req.url));
                }
            }

            // Protect dashboard - only for users with active subscription
            if (pathname.startsWith("/dashboard")) {
                if (user.subscriptionStatus !== "active" && user.subscriptionStatus !== "trialing") {
                    // Don't redirect if it's the first access after payment (success=true)
                    if (req.nextUrl.searchParams.get("success") !== "true") {
                        return NextResponse.redirect(new URL("/pricing", req.url));
                    }
                }
            }

            // Allow access to pricing page for all authenticated users
            if (pathname === "/pricing") {
                return NextResponse.next();
            }
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const pathname = req.nextUrl.pathname;

                // Public routes - no authentication required
                const publicRoutes = ["/", "/api/auth", "/api/webhooks"];
                if (publicRoutes.some(route => pathname.startsWith(route))) {
                    return true;
                }

                // Protected routes - require authentication
                return !!token;
            },
        },
    }
);

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth|api/webhooks).*)",
    ],
};