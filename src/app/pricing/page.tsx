"use client";

import { useState } from "react";
import { createCheckoutSession } from "@/app/actions/stripe";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function PricingPage() {
    const [isLoading, setIsLoading] = useState(false);
    const { data: session } = useSession();
    const router = useRouter();

    // Replace with actual Stripe Price IDs from your dashboard
    const monthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || "price_MONTHLY_ID";
    const yearlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY || "price_YEARLY_ID";

    const handleSubscribe = async (priceId: string, planType: string) => {
        console.log(`🔘 Button clicked for ${planType} plan`);

        if (!session) {
            console.log("❌ No session, redirecting to sign in");
            router.push("/api/auth/signin?callbackUrl=/pricing");
            return;
        }

        try {
            setIsLoading(true);

            // Debug: Log all info
            console.log("=== DEBUG INFO ===");
            console.log("🔍 Selected Plan:", planType);
            console.log("🔍 Selected Price ID:", priceId);
            console.log("🔍 Monthly Price ID:", monthlyPriceId);
            console.log("🔍 Yearly Price ID:", yearlyPriceId);
            console.log("🔍 User Email:", session.user?.email);
            console.log("==================");

            // Check if price ID is valid
            if (!priceId || !priceId.startsWith("price_")) {
                const errorMsg = `Invalid Stripe Price ID: "${priceId}". Check your .env.local file. It should start with "price_"`;
                console.error("❌", errorMsg);
                alert(errorMsg);
                setIsLoading(false);
                return;
            }

            console.log("✅ Price ID valid, calling createCheckoutSession...");
            const result = await createCheckoutSession(priceId);

            if (result?.url) {
                console.log("✅ Got checkout URL:", result.url);
                console.log("🔄 Redirecting to Stripe Checkout...");
                // Redirect to Stripe Checkout
                window.location.href = result.url;
            } else {
                throw new Error("No checkout URL returned");
            }
        } catch (error: any) {
            console.error("❌ Error creating checkout session:", error);
            console.error("❌ Error stack:", error.stack);
            alert(`Failed to start checkout: ${error.message || "Unknown error"}\n\nCheck browser console for details.`);
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <section className="w-full py-12 md:py-24 lg:py-32" id="pricing">
                <div className="container px-4 md:px-6 mx-auto">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                                Choose Your Plan
                            </h2>
                            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                                Simple pricing for everyone. Save 17% with yearly billing.
                            </p>
                        </div>
                    </div>

                    <div className="mx-auto grid max-w-sm items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-2 mt-12">
                        {/* Monthly Plan */}
                        <Card className="relative border-2 border-blue-500 shadow-lg">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                    POPULAR
                                </span>
                            </div>
                            <CardHeader>
                                <CardTitle>Monthly Plan</CardTitle>
                                <CardDescription>Perfect for getting started.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold">
                                    $20.00
                                    <span className="text-sm font-normal text-gray-500">
                                        /month
                                    </span>
                                </div>
                                <ul className="mt-6 space-y-3">
                                    <li className="flex items-center">
                                        <Check className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                                        <span className="text-sm">Unlimited Projects</span>
                                    </li>
                                    <li className="flex items-center">
                                        <Check className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                                        <span className="text-sm">Advanced Analytics</span>
                                    </li>
                                    <li className="flex items-center">
                                        <Check className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                                        <span className="text-sm">Priority Support 24/7</span>
                                    </li>
                                    <li className="flex items-center">
                                        <Check className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                                        <span className="text-sm">Custom Integrations</span>
                                    </li>
                                    <li className="flex items-center">
                                        <Check className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                                        <span className="text-sm">Team Collaboration</span>
                                    </li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full bg-blue-500 hover:bg-blue-600"
                                    onClick={() => handleSubscribe(monthlyPriceId, "Monthly")}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        "Get Started"
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>

                        {/* Yearly Plan */}
                        <Card className="relative border-2 border-green-500 shadow-lg">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                    SAVE 17%
                                </span>
                            </div>
                            <CardHeader>
                                <CardTitle>Yearly Plan</CardTitle>
                                <CardDescription>Best value for committed users.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold">
                                    $220.00
                                    <span className="text-sm font-normal text-gray-500">
                                        /year
                                    </span>
                                </div>
                                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                    $20 saved per year (17% off)
                                </p>
                                <ul className="mt-6 space-y-3">
                                    <li className="flex items-center">
                                        <Check className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                                        <span className="text-sm">Unlimited Projects</span>
                                    </li>
                                    <li className="flex items-center">
                                        <Check className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                                        <span className="text-sm">Advanced Analytics</span>
                                    </li>
                                    <li className="flex items-center">
                                        <Check className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                                        <span className="text-sm">Priority Support 24/7</span>
                                    </li>
                                    <li className="flex items-center">
                                        <Check className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                                        <span className="text-sm">Custom Integrations</span>
                                    </li>
                                    <li className="flex items-center">
                                        <Check className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                                        <span className="text-sm">Team Collaboration</span>
                                    </li>
                                    <li className="flex items-center">
                                        <Check className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                                        <span className="text-sm font-semibold text-green-600">2 Months Free!</span>
                                    </li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full bg-green-500 hover:bg-green-600"
                                    onClick={() => handleSubscribe(yearlyPriceId, "Yearly")}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        "Get Started"
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* FAQ or Additional Info */}
                    <div className="mt-16 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            All plans include a 14-day money-back guarantee. Cancel anytime.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}