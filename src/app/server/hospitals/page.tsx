
"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import type { Hospital } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { HospitalsTable } from "@/components/server/HospitalsTable";
import { Skeleton } from "@/components/ui/skeleton";

export default function ManageHospitalsPage() {
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const q = query(collection(db, "hospitals"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const hospitalsData: Hospital[] = [];
            querySnapshot.forEach((doc) => {
                hospitalsData.push({ uid: doc.id, ...doc.data() } as Hospital);
            });
            setHospitals(hospitalsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching hospitals:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not fetch hospitals data.",
            });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);
    
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Manage Hospitals</h1>
                <p className="text-muted-foreground">
                    View all registered hospital accounts.
                </p>
            </div>
            {loading ? (
                 <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : (
                <HospitalsTable hospitals={hospitals} />
            )}
        </div>
    );
}
