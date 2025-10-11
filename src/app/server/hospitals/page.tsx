"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, doc, updateDoc } from "firebase/firestore";
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

    const handleStatusChange = async (hospitalId: string, status: 'approved' | 'rejected') => {
        const hospitalRef = doc(db, "hospitals", hospitalId);
        try {
            await updateDoc(hospitalRef, { status });
            toast({
                title: "Status Updated",
                description: `Hospital status has been set to ${status}.`,
            });
        } catch (error) {
            console.error("Error updating status:", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Could not update hospital status.",
            });
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Manage Hospitals</h1>
                <p className="text-muted-foreground">
                    View, approve, or reject hospital registrations.
                </p>
            </div>
            {loading ? (
                 <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : (
                <HospitalsTable hospitals={hospitals} onStatusChange={handleStatusChange} />
            )}
        </div>
    );
}
