"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { signIn, useSession } from "next-auth/react";
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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <a className="flex items-center justify-center font-bold text-xl" href="#">
          <Zap className="h-6 w-6 mr-2 text-blue-500" />
          SaaS Starter
        </a>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <a href="#features" className="text-sm font-medium hover:text-blue-500 transition-colors">
            Features
          </a>
          <a href="#pricing" className="text-sm font-medium hover:text-blue-500 transition-colors">
            Pricing
          </a>
          <Button onClick={() => signIn()} variant="ghost" size="sm">
            Sign In
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-white to-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-700">
                  Complete SaaS Solution
                </div>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
                  Build Your SaaS
                  <br />
                  <span className="text-blue-500">In Record Time</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl lg:text-2xl">
                  Complete starter kit with Next.js 14, Stripe payments, authentication, and database.
                  Everything you need to launch your SaaS product.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Button
                  onClick={() => signIn()}
                  size="lg"
                  className="bg-blue-500 hover:bg-blue-600 text-lg px-8"
                >
                  Get Started Free
                </Button>
                <Button
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  variant="outline"
                  size="lg"
                  className="text-lg px-8"
                >
                  View Pricing
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                No credit card required • 14-day money-back guarantee
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Everything You Need
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl mt-4">
                Pre-built features to help you launch faster
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Authentication</h3>
                <p className="text-gray-600">
                  Secure authentication with Azure AD B2C, Google, and GitHub
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Stripe Payments</h3>
                <p className="text-gray-600">
                  Complete Stripe integration with subscriptions and billing portal
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Database Ready</h3>
                <p className="text-gray-600">
                  Prisma ORM with MySQL for robust data management
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-gray-50 to-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Ready to Get Started?
                </h2>
                <p className="mx-auto max-w-[600px] text-gray-600 md:text-xl">
                  Join thousands of developers building their SaaS products faster
                </p>
              </div>
              <Button
                onClick={() => signIn()}
                size="lg"
                className="bg-blue-500 hover:bg-blue-600 text-lg px-8 mt-8"
              >
                Start Building Now
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 bg-gray-50 border-t">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              © 2024 SaaS Starter. All rights reserved.
            </p>
            <nav className="flex gap-4">
              <a href="#" className="text-sm text-gray-600 hover:text-blue-500">
                Terms
              </a>
              <a href="#" className="text-sm text-gray-600 hover:text-blue-500">
                Privacy
              </a>
              <a href="#" className="text-sm text-gray-600 hover:text-blue-500">
                Contact
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}