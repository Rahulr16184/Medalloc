
"use client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function HospitalDashboardPage() {
    const { hospital, loading } = useAuth();
    
    if (loading) {
        return <Skeleton className="h-64 w-full" />
    }

    if (!hospital) {
        return (
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    Could not load hospital data. This might be because the hospital document does not exist or there was a network issue. Please contact support if this persists.
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Welcome to your Hospital Dashboard</h2>
            <p className="text-muted-foreground">
                Manage your bed availability and forecast future demand.
            </p>

            {hospital.status === 'pending' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Approval Pending</CardTitle>
                        <CardDescription>Your hospital registration is currently under review by our administrators.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>You will be able to be seen by patients once your registration is approved. You can still set up your departments and beds in the meantime.</p>
                        <p className="mt-4 text-sm text-muted-foreground">Thank you for your patience.</p>
                    </CardContent>
                </Card>
            )}

            {hospital.status === 'rejected' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Registration Rejected</CardTitle>
                        <CardDescription>Unfortunately, your hospital registration could not be approved at this time.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>If you believe this is an error, please contact support.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
