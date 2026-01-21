// test-db.ts
import { prisma } from "@/lib/db";

async function testDatabase() {
    try {
        console.log("🔍 Testing database connection...");

        // Test connection
        await prisma.$connect();
        console.log("✅ Database connected!");

        // Count users
        const userCount = await prisma.user.count();
        console.log("👥 Total users:", userCount);

        // List all users
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                subscriptionStatus: true,
                stripeCustomerId: true,
                stripeSubscriptionId: true,
            }
        });
        console.log("📋 Users:", JSON.stringify(users, null, 2));

        await prisma.$disconnect();
    } catch (error) {
        console.error("❌ Database error:", error);
    }
}

testDatabase();