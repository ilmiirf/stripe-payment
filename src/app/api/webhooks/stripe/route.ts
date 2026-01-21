import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === "invoice.payment_succeeded") {
        const invoice = event.data.object as Stripe.Invoice;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscriptionId = (invoice as any).subscription as string;
        const customerId = invoice.customer as string;

        if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);

            await prisma.user.updateMany({
                where: {
                    stripeCustomerId: customerId,
                },
                data: {
                    subscriptionStatus: "active",
                    stripeSubscriptionId: subscriptionId,
                },
            });
        }
    }

    if (event.type === "customer.subscription.updated") {
        const subscription = event.data.object as Stripe.Subscription;

        await prisma.user.updateMany({
            where: {
                stripeCustomerId: subscription.customer as string,
            },
            data: {
                subscriptionStatus: subscription.status,
                stripeSubscriptionId: subscription.id,
            },
        });
    }

    if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as Stripe.Subscription;

        await prisma.user.updateMany({
            where: {
                stripeCustomerId: subscription.customer as string,
            },
            data: {
                subscriptionStatus: "inactive",
                stripeSubscriptionId: null,
            },
        });
    }

    return new NextResponse(null, { status: 200 });
}
