
"use client";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Hospital } from "@/types";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Loader2, Terminal } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function BedManagement() {
    const { userProfile } = useAuth();
    const { toast } = useToast();

    const [hospital, setHospital] = useState<Hospital | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [totalBeds, setTotalBeds] = useState(0);
    const [occupiedBeds, setOccupiedBeds] = useState(0);


    useEffect(() => {
        if (!userProfile?.uid) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const hospitalRef = doc(db, "hospitals", userProfile.uid);
        const unsubscribe = onSnapshot(hospitalRef, (doc) => {
            if (doc.exists()) {
                const hospitalData = doc.data() as Hospital;
                setHospital(hospitalData);
                setTotalBeds(hospitalData.totalBeds);
                setOccupiedBeds(hospitalData.occupiedBeds);
            } else {
                setHospital(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching hospital data:", error);
            setHospital(null);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userProfile]);

    const handleSave = async () => {
        if (!userProfile?.uid || !hospital) return;
        
        if (occupiedBeds > totalBeds) {
            toast({
                variant: 'destructive',
                title: "Invalid Input",
                description: "Occupied beds cannot be greater than total beds."
            });
            return;
        }
        
        setSaving(true);
        const hospitalRef = doc(db, "hospitals", userProfile.uid);
        try {
            await updateDoc(hospitalRef, {
                totalBeds: Number(totalBeds),
                occupiedBeds: Number(occupiedBeds)
            });
            toast({
                title: "Bed Count Updated",
                description: "Your hospital's bed availability has been successfully updated."
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: "Update Failed",
                description: error.message || "Could not update bed counts."
            });
        } finally {
            setSaving(false);
        }
    };


    if (loading) {
        return <Skeleton className="h-72 w-full" />;
    }

    if (!hospital || hospital.status !== 'approved') {
        return (
            <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>
                    {hospital?.status === 'pending' 
                        ? "Your hospital registration is pending approval. This feature will be available once approved." 
                        : "Bed management is only available for approved hospitals."
                    }
                </AlertDescription>
            </Alert>
        );
    }
    
    const availableBeds = totalBeds - occupiedBeds;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Update Bed Availability</CardTitle>
                <CardDescription>
                    Enter the total number of beds and the number of currently occupied beds.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="totalBeds">Total Beds</Label>
                        <Input
                            id="totalBeds"
                            type="number"
                            value={totalBeds}
                            onChange={(e) => setTotalBeds(Number(e.target.value))}
                            min="0"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="occupiedBeds">Occupied Beds</Label>
                        <Input
                            id="occupiedBeds"
                            type="number"
                            value={occupiedBeds}
                            onChange={(e) => setOccupiedBeds(Number(e.target.value))}
                             min="0"
                        />
                    </div>
                     <div className="p-4 rounded-md bg-secondary text-center">
                        <p className="text-sm font-medium text-muted-foreground">Available Beds</p>
                        <p className="text-3xl font-bold">{availableBeds >= 0 ? availableBeds : 'N/A'}</p>
                    </div>
                </div>
                 <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </CardContent>
        </Card>
    )
}
