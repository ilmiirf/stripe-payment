import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

export async function POST(req: Request) {
    console.log("🔔 Webhook received!");

    const body = await req.text();
    const signature = (await headers()).get("Stripe-Signature") as string;

    console.log("📝 Signature:", signature ? "✅ Present" : "❌ Missing");

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
        console.log("✅ Webhook signature verified");
        console.log("📋 Event type:", event.type);
    } catch (error: any) {
        console.error("❌ Webhook signature verification failed:", error.message);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    try {
        console.log("🔄 Processing event:", event.type);

        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                console.log("💳 Checkout session completed");
                console.log("   Session ID:", session.id);
                console.log("   Customer:", session.customer);
                console.log("   Subscription:", session.subscription);
                console.log("   User ID from metadata:", session.metadata?.userId);

                if (!session?.metadata?.userId) {
                    console.error("❌ No userId in metadata!");
                    return new NextResponse("User ID missing in metadata", { status: 400 });
                }

                // Only process if it's a subscription
                if (session.mode === "subscription" && session.subscription) {
                    console.log("📦 Retrieving subscription details...");
                    const subscription = await stripe.subscriptions.retrieve(
                        session.subscription as string
                    );

                    console.log("📊 Subscription details:");
                    console.log("   ID:", subscription.id);
                    console.log("   Status:", subscription.status);
                    console.log("   Price ID:", subscription.items.data[0].price.id);
                    console.log("   Interval:", subscription.items.data[0].price.recurring?.interval);

                    console.log("💾 Updating database for user:", session.metadata.userId);

                    const updatedUser = await prisma.user.update({
                        where: { id: session.metadata.userId },
                        data: {
                            stripeSubscriptionId: subscription.id,
                            subscriptionStatus: subscription.status,
                            priceId: subscription.items.data[0].price.id,
                            planInterval: subscription.items.data[0].price.recurring?.interval,
                            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                        },
                    });


                    console.log("✅ Database updated successfully!");
                    console.log("   User email:", updatedUser.email);
                    console.log("   Subscription status:", updatedUser.subscriptionStatus);
                } else {
                    console.log("ℹ️ Not a subscription checkout, skipping");
                }
                break;
            }

            case "invoice.payment_succeeded": {
                const invoice = event.data.object as Stripe.Invoice;
                console.log("💰 Invoice payment succeeded");
                console.log("   Invoice ID:", invoice.id);
                console.log("   Subscription:", invoice.subscription);

                // Only process subscription invoices
                if (invoice.subscription) {
                    const subscription = await stripe.subscriptions.retrieve(
                        invoice.subscription as string
                    );

                    console.log("💾 Updating subscription in database...");

                    const updatedUser = await prisma.user.update({
                        where: { stripeSubscriptionId: subscription.id },
                        data: {
                            subscriptionStatus: subscription.status,
                            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                            priceId: subscription.items.data[0].price.id,
                            planInterval: subscription.items.data[0].price.recurring?.interval,
                        },
                    });

                    console.log("✅ Payment processed for user:", updatedUser.email);
                }
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                console.log("🔄 Subscription updated");
                console.log("   Subscription ID:", subscription.id);
                console.log("   Status:", subscription.status);

                const updatedUser = await prisma.user.update({
                    where: { stripeSubscriptionId: subscription.id },
                    data: {
                        subscriptionStatus: subscription.status,
                        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                        priceId: subscription.items.data[0].price.id,
                        planInterval: subscription.items.data[0].price.recurring?.interval,
                    },
                });

                console.log("✅ Subscription updated for user:", updatedUser.email);
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                console.log("🗑️ Subscription deleted");
                console.log("   Subscription ID:", subscription.id);

                const updatedUser = await prisma.user.update({
                    where: { stripeSubscriptionId: subscription.id },
                    data: {
                        subscriptionStatus: "canceled",
                        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                    },
                });

                console.log("✅ Subscription canceled for user:", updatedUser.email);
                break;
            }

            default:
                console.log(`ℹ️ Unhandled event type: ${event.type}`);
        }

        console.log("✅ Webhook processed successfully");
        return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
    } catch (error: any) {
        console.error("====================================");
        console.error("❌ ERROR PROCESSING WEBHOOK");
        console.error("====================================");
        console.error("Event type:", event.type);
        console.error("Error:", error);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        console.error("====================================");
        return new NextResponse(`Webhook handler failed: ${error.message}`, { status: 500 });
    }
}