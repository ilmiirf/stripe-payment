"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export async function createCheckoutSession(priceId: string) {
    try {
        console.log("====================================");
        console.log("🚀 STRIPE CHECKOUT SESSION CREATION");
        console.log("====================================");
        console.log("📋 Price ID received:", priceId);
        console.log("🌍 App URL:", process.env.NEXT_PUBLIC_APP_URL);
        console.log("🔑 Stripe Key exists:", !!process.env.STRIPE_SECRET_KEY);
        console.log("====================================");

        // Validate environment variables
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error("STRIPE_SECRET_KEY is not configured");
        }

        if (!process.env.NEXT_PUBLIC_APP_URL) {
            throw new Error("NEXT_PUBLIC_APP_URL is not configured");
        }

        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            console.error("❌ User not authenticated");
            throw new Error("Not authenticated");
        }

        console.log("✅ User authenticated:", session.user.email);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let customerId: string | undefined = (session.user as any).stripeId;

        // If not in session, try resolving from Stripe directly
        if (!customerId) {
            console.log("🔍 stripeId not found in session, searching Stripe...");
            const customers = await stripe.customers.list({
                email: session.user.email,
                limit: 1,
            });

            if (customers.data.length > 0) {
                customerId = customers.data[0].id;
                console.log("✅ Found existing Stripe customer:", customerId);
            }
        }

        // Create Stripe customer if doesn't exist
        if (!customerId) {
            console.log("📝 Creating new Stripe customer...");
            try {
                const customer = await stripe.customers.create({
                    email: session.user.email,
                    name: session.user.name || undefined,
                    metadata: {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        userId: (session.user as any).id,
                    },
                });
                customerId = customer.id;
                console.log("✅ Stripe customer created:", customerId);
            } catch (error: any) {
                console.error("❌ Failed to create Stripe customer:", error.message);
                throw new Error(`Failed to create Stripe customer: ${error.message}`);
            }
        } else {
            console.log("✅ Using stripe customer ID:", customerId);
        }

        // Validate Price ID
        if (!priceId || !priceId.startsWith("price_")) {
            console.error("❌ Invalid Price ID format:", priceId);
            throw new Error(`Invalid Stripe Price ID: "${priceId}". Must start with "price_"`);
        }

        console.log("🔨 Creating Stripe checkout session...");
        console.log("📦 Checkout params:", {
            mode: "subscription",
            customer: customerId,
            priceId: priceId,
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
        });

        // Create checkout session
        let checkoutSession;
        try {
            checkoutSession = await stripe.checkout.sessions.create({
                mode: "subscription",
                payment_method_types: ["card"],
                customer: customerId,
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
                cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                client_reference_id: (session.user as any).id,
                metadata: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    userId: (session.user as any).id,
                },
                allow_promotion_codes: true,
                billing_address_collection: "auto",
            });
        } catch (error: any) {
            console.error("❌ Stripe API Error:", error);
            console.error("❌ Error type:", error.type);
            console.error("❌ Error code:", error.code);
            console.error("❌ Error message:", error.message);
            throw new Error(`Stripe API Error: ${error.message}`);
        }

        if (!checkoutSession.url) {
            console.error("❌ No checkout URL returned from Stripe");
            throw new Error("Failed to create checkout session - no URL returned");
        }

        console.log("✅ Checkout session created successfully!");
        console.log("🆔 Session ID:", checkoutSession.id);
        console.log("🔗 Checkout URL:", checkoutSession.url);
        console.log("====================================");

        // Return the URL instead of redirecting
        return { url: checkoutSession.url };
    } catch (error: any) {
        console.error("====================================");
        console.error("❌ CHECKOUT SESSION ERROR");
        console.error("====================================");
        console.error("Error:", error);
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
        console.error("====================================");
        throw new Error(error.message || "Failed to create checkout session");
    }
}

export async function createPortalSession() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        throw new Error("Not authenticated");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let customerId = (session.user as any).stripeId;

    if (!customerId) {
        const customers = await stripe.customers.list({
            email: session.user.email,
            limit: 1,
        });

        if (customers.data.length > 0) {
            customerId = customers.data[0].id;
        }
    }

    if (!customerId) {
        throw new Error("No subscription found");
    }

    const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    // Return the URL instead of redirecting
    return { url: portalSession.url };
}