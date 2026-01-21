import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

// TODO: Import your new database client here
// import { db } from "@/lib/db"; 

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

    // Handle "invoice.payment_succeeded"
    if (event.type === "invoice.payment_succeeded") {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string;
        const customerId = invoice.customer as string;

        if (subscriptionId) {
            // Logic to update user status to "active"
            // Example: await db.execute('UPDATE User SET subscriptionStatus = "active"...')
            console.log(`Updating user ${customerId} to active`);
        }
    }

    // Handle "customer.subscription.updated"
    if (event.type === "customer.subscription.updated") {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Logic to sync the Stripe status (e.g., "past_due", "trailing") to your DB
        console.log(`Updating user ${customerId} status to ${subscription.status}`);
    }

    // Handle "customer.subscription.deleted"
    if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Logic to mark subscription as inactive/null
        console.log(`User ${customerId} subscription deleted`);
    }

    return new NextResponse("Webhook Received", { status: 200 });
}