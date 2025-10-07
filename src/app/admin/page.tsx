"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Activity } from "lucide-react";

export default function AdminDashboardPage() {

  // In a real app, these values would be fetched from Firestore
  const stats = {
    totalHospitals: 12,
    pendingApprovals: 3,
    totalBedCapacity: 4500,
  }

  return (
    <div className="space-y-6">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hospitals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalHospitals}</div>
              <p className="text-xs text-muted-foreground">
                +2 since last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
              <p className="text-xs text-muted-foreground">
                Hospitals waiting for review
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bed Capacity</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBedCapacity.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across all approved hospitals
              </p>
            </CardContent>
          </Card>
        </div>
      <div>
        <h2 className="text-2xl font-semibold mb-4">Welcome, Admin!</h2>
        <p className="text-muted-foreground">
          From this dashboard, you can manage hospital approvals and monitor the overall status of the hospital network.
          Use the navigation on the left to get started.
        </p>
      </div>
    </div>
  );
}
