"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function SuccessPage() {
    const router = useRouter();

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Card className="w-[350px] text-center">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <CheckCircle className="h-16 w-16 text-green-500" />
                    </div>
                    <CardTitle>Payment Successful!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600 mb-6">
                        Thank you for subscribing. Your account has been upgraded.
                    </p>
                    <Button onClick={() => router.push("/dashboard")} className="w-full">
                        Go to Dashboard
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
