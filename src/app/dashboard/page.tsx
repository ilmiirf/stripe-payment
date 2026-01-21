"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut, User, CreditCard } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showSuccess, setShowSuccess] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        // Check for success parameter from Stripe redirect
        if (searchParams.get("success") === "true") {
            setShowSuccess(true);
            setIsRefreshing(true);

            // Refresh session to get updated subscription status
            const refreshSession = async () => {
                // Wait a bit for webhook to process
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Trigger session refresh
                await update();

                setIsRefreshing(false);

                // Remove the success parameter from URL after 5 seconds
                setTimeout(() => {
                    setShowSuccess(false);
                    router.replace("/dashboard");
                }, 5000);
            };

            refreshSession();
        }
    }, [searchParams, router, update]);

    if (status === "loading" || isRefreshing) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                    {isRefreshing && <p className="text-sm text-gray-500">Updating your subscription...</p>}
                </div>
            </div>
        );
    }

    if (!session) {
        router.push("/");
        return null;
    }

    const user = session.user as any;

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Dashboard</h1>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium">{user.name || user.email}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                            <Button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                variant="outline"
                                size="sm"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Success Message */}
            {showSuccess && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4">
                    <div className="container mx-auto px-4">
                        <p className="text-green-800 font-medium">
                            🎉 Payment successful! Your subscription is now active.
                        </p>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Welcome Card */}
                    <Card className="md:col-span-2 lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Welcome back, {user.name?.split(" ")[0] || "User"}! 👋</CardTitle>
                            <CardDescription>
                                Here's what's happening with your account today.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    {/* User Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <User className="h-5 w-5 mr-2" />
                                Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Name</p>
                                    <p className="text-base">{user.name || "Not set"}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Email</p>
                                    <p className="text-base">{user.email}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Subscription Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <CreditCard className="h-5 w-5 mr-2" />
                                Subscription
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Status</p>
                                    <p className="text-base capitalize">
                                        {user.subscriptionStatus || "Processing..."}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Plan</p>
                                    <p className="text-base capitalize">
                                        {user.planInterval ? `Pro (${user.planInterval})` : "Processing..."}
                                    </p>
                                </div>
                                {!user.subscriptionStatus && showSuccess && (
                                    <p className="text-xs text-blue-600 mt-2">
                                        ⏳ Subscription is being activated...
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Stats</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Projects</span>
                                    <span className="font-medium">0</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Team Members</span>
                                    <span className="font-medium">1</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Storage Used</span>
                                    <span className="font-medium">0 GB</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Cards */}
                    <Card className="md:col-span-2 lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>Get started with these common tasks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3">
                                <Button variant="outline" className="h-20 flex flex-col gap-2">
                                    <span className="text-2xl">📊</span>
                                    <span>View Analytics</span>
                                </Button>
                                <Button variant="outline" className="h-20 flex flex-col gap-2">
                                    <span className="text-2xl">⚙️</span>
                                    <span>Settings</span>
                                </Button>
                                <Button variant="outline" className="h-20 flex flex-col gap-2">
                                    <span className="text-2xl">💬</span>
                                    <span>Support</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}