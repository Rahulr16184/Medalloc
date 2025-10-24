
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function HospitalDashboardPage() {
    
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Welcome to your Hospital Dashboard</h2>
            <p className="text-muted-foreground">
                Manage your bed availability and forecast future demand.
            </p>

            <Card>
                <CardHeader>
                    <CardTitle>Getting Started</CardTitle>
                    <CardDescription>Use the navigation above to manage your hospital.</CardDescription>
                </CardHeader>
                <CardContent>
                   <p>You can manage your departments and beds, and see an overview of your hospital's bed status.</p>
                </CardContent>
            </Card>
        </div>
    );
}
