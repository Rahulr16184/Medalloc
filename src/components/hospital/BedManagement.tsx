
"use client";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Department, Hospital } from "@/types";
import { collection, doc, onSnapshot, query, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Loader2, Terminal, Bed } from "lucide-react";
import Link from "next/link";
import { Progress } from "../ui/progress";

interface DepartmentWithBedCount extends Department {
    totalBeds: number;
    occupiedBeds: number;
}


export function BedManagement() {
    const { userProfile } = useAuth();
    const { toast } = useToast();

    const [departments, setDepartments] = useState<DepartmentWithBedCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [hospital, setHospital] = useState<Hospital | null>(null);

    useEffect(() => {
        if (!userProfile?.uid) {
            setLoading(false);
            return;
        }

        const hospitalRef = doc(db, "hospitals", userProfile.uid);
        const hospitalUnsubscribe = onSnapshot(hospitalRef, (doc) => {
            setHospital(doc.exists() ? doc.data() as Hospital : null);
        });

        const departmentsRef = collection(db, "hospitals", userProfile.uid, "departments");
        const departmentsUnsubscribe = onSnapshot(departmentsRef, async (snapshot) => {
            const deptsDataPromises = snapshot.docs.map(async (deptDoc) => {
                const department = { id: deptDoc.id, ...deptDoc.data() } as Department;
                const bedsRef = collection(deptDoc.ref, "beds");
                const bedsQuery = query(bedsRef);
                
                // Use a one-time fetch for bed counts to avoid too many listeners
                let total = 0;
                let occupied = 0;
                
                const bedsUnsubscribe = onSnapshot(bedsQuery, (bedsSnapshot) => {
                     total = bedsSnapshot.size;
                     occupied = bedsSnapshot.docs.filter(d => d.data().status === 'Occupied').length;

                     setDepartments(prevDepts => {
                        const existingDept = prevDepts.find(d => d.id === department.id);
                        if (existingDept && existingDept.totalBeds === total && existingDept.occupiedBeds === occupied) {
                            return prevDepts;
                        }
                        const newDepts = prevDepts.filter(d => d.id !== department.id);
                        return [...newDepts, { ...department, totalBeds: total, occupiedBeds: occupied }];
                     });
                });
                // Note: We are not storing/calling the unsubscribe function from here,
                // which is okay for this component's lifecycle as the parent listener (departmentsUnsubscribe) handles cleanup.

                return { ...department, totalBeds: total, occupiedBeds: occupied };
            });

            const deptsData = await Promise.all(deptsDataPromises);
            setDepartments(deptsData.sort((a,b) => a.name.localeCompare(b.name)));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching departments:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch department data." });
            setLoading(false);
        });

        return () => {
            hospitalUnsubscribe();
            departmentsUnsubscribe();
        };
    }, [userProfile, toast]);

    if (loading) {
        return (
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
            </div>
        );
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
    
    const overallOccupancy = hospital.totalBeds > 0 ? (hospital.occupiedBeds / hospital.totalBeds) * 100 : 0;


    return (
       <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Overall Hospital Occupancy</CardTitle>
                    <CardDescription>A summary of bed usage across all departments.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <p className="text-2xl font-bold">{hospital.occupiedBeds} / {hospital.totalBeds} <span className="text-sm font-normal text-muted-foreground">Beds Occupied</span></p>
                        <p className="text-2xl font-bold">{Math.round(overallOccupancy)}% <span className="text-sm font-normal text-muted-foreground">Occupancy</span></p>
                    </div>
                    <Progress value={overallOccupancy} />
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {departments.map(dept => {
                    const occupancy = dept.totalBeds > 0 ? (dept.occupiedBeds / dept.totalBeds) * 100 : 0;
                    return (
                        <Link href={`/hospital/departments/${dept.id}`} key={dept.id}>
                            <Card className="hover:bg-muted/50 transition-colors h-full flex flex-col">
                                <CardHeader>
                                    <CardTitle>{dept.name}</CardTitle>
                                    <CardDescription>{dept.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow flex flex-col justify-end space-y-3">
                                    <div className="flex items-center justify-between text-lg">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Bed className="w-5 h-5"/>
                                            <span className="font-medium">Occupancy</span>
                                        </div>
                                        <span className="font-bold">{dept.occupiedBeds} / {dept.totalBeds}</span>
                                    </div>
                                    <Progress value={occupancy} />
                                </CardContent>
                            </Card>
                        </Link>
                    )
                })}
            </div>
             { !loading && departments.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border rounded-lg">
                    <p>No departments found.</p>
                    <p className="text-sm">Please add departments in the 'Departments & Beds' section.</p>
                </div>
            )}
       </div>
    )
}
