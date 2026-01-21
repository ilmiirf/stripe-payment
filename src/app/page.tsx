"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, Zap, Shield } from "lucide-react";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const user = session.user as any;

      // If user has active subscription, go to dashboard
      if (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing") {
        router.push("/dashboard");
      } else {
        // If user is logged in but no subscription, go to pricing
        router.push("/pricing");
      }
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Only show landing page if user is not authenticated
  if (status === "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // The `getServerSession` call is not valid in a client component.
  // Assuming the `session` variable in the JSX below should refer to the `session` from `useSession()`.
  // The original instruction included `const session = await getServerSession(authOptions);`
  // but this is incompatible with "use client".
  // The existing `session` from `useSession()` will be used instead.

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <a className="flex items-center justify-center font-bold text-xl" href="#">
          <Zap className="h-6 w-6 mr-2 text-blue-500" />
          Tesing
        </a>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <a href="#features" className="text-sm font-medium hover:text-blue-500 transition-colors">
            Features
          </a>
          <a href="#pricing" className="text-sm font-medium hover:text-blue-500 transition-colors">
            Pricing
          </a>
          {!session ? (
            <div className="flex gap-2">
              <Button onClick={() => signIn("azure-ad-b2c")} variant="outline" size="sm">
                Sign In with Azure B2C
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/dashboard">Dashboard</a>
              </Button>
              <Button onClick={() => signOut({ callbackUrl: "/api/auth/signout" })} variant="ghost" size="sm">
                Sign Out
              </Button>
            </div>
          )}
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-white to-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                {!session ? (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={() => signIn("azure-ad-b2c")}
                      variant="outline"
                      size="lg"
                      className="text-lg px-8"
                    >
                      Sign In with B2C
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="default"
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-lg px-8"
                    asChild
                  >
                    <a href="/dashboard">Go to Dashboard</a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}