
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, collection, onSnapshot, query, updateDoc, writeBatch, increment } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Hospital, Department, Bed, BedStatus } from "@/types";
import Link from "next/link";
import { ChevronLeft, Building, Bed as BedIcon, Loader2, BedDouble, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { bookBed } from "./actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


interface DepartmentWithBeds extends Department {
    beds: Bed[];
}

export default function HospitalDetailsPage({ params }: { params: { hospitalId: string } }) {
    const { toast } = useToast();
    const MOCK_PATIENT_ID = "mock-patient-id";
    const [hospital, setHospital] = useState<Hospital | null>(null);
    const [departments, setDepartments] = useState<DepartmentWithBeds[]>([]);
    const [loading, setLoading] = useState(true);
    const [bedToBook, setBedToBook] = useState<Bed | null>(null);
    const [isBooking, setIsBooking] = useState(false);


    useEffect(() => {
        const fetchHospital = async () => {
            const hospitalDoc = await getDoc(doc(db, "hospitals", params.hospitalId));
            if (hospitalDoc.exists()) {
                setHospital({ uid: hospitalDoc.id, ...hospitalDoc.data() } as Hospital);
            }
        };
        fetchHospital();

        const deptsRef = collection(db, "hospitals", params.hospitalId, "departments");
        const unsubscribe = onSnapshot(query(deptsRef), (snapshot) => {
            const deptsWithBeds: { [key: string]: DepartmentWithBeds } = {};
            
            if (snapshot.empty) {
                setDepartments([]);
                setLoading(false);
                return;
            }

            snapshot.docs.forEach(deptDoc => {
                const department = { id: deptDoc.id, ...deptDoc.data() } as Department;
                deptsWithBeds[deptDoc.id] = { ...department, beds: [] };

                const bedsRef = collection(deptDoc.ref, "beds");
                onSnapshot(query(bedsRef), (bedsSnapshot) => {
                    const bedsData = bedsSnapshot.docs.map(bedDoc => ({ id: bedDoc.id, ...bedDoc.data() } as Bed)).sort((a,b) => a.bedId.localeCompare(b.bedId));
                    
                    setDepartments(prevDepts => {
                        const newDepts = [...prevDepts];
                        const deptIndex = newDepts.findIndex(d => d.id === deptDoc.id);
                        const updatedDept = { ...department, beds: bedsData };

                        if (deptIndex > -1) {
                            newDepts[deptIndex] = updatedDept;
                        } else {
                            newDepts.push(updatedDept);
                        }
                        
                        return newDepts.sort((a,b) => a.name.localeCompare(b.name));
                    });
                    setLoading(false);
                });
            });
        });

        return () => unsubscribe();
    }, [params.hospitalId]);

    const handleBookBed = async () => {
        if (!bedToBook) return;
        setIsBooking(true);
        try {
            await bookBed({
                hospitalId: bedToBook.hospitalId,
                departmentId: bedToBook.departmentId,
                bedId: bedToBook.id,
                patientId: MOCK_PATIENT_ID,
            });
            
            toast({
                title: "Bed Booked Successfully!",
                description: `You have booked bed ${bedToBook.bedId} at ${hospital?.name}.`,
            });

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Booking Failed",
                description: error.message || "Could not book the bed. Please try again.",
            });
        } finally {
            setBedToBook(null);
            setIsBooking(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-24 w-full" />
                <div className="space-y-8">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }
    
    if (!hospital) {
        return (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Hospital Not Found</AlertTitle>
                <AlertDescription>The requested hospital could not be found. It may have been removed.</AlertDescription>
                 <Button asChild variant="link" className="p-0 h-auto mt-2">
                    <Link href="/patient">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back to Hospitals
                    </Link>
                </Button>
            </Alert>
        );
    }

    const statusStyles: Record<BedStatus, string> = {
        Available: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800",
        Occupied: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800",
        Cleaning: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800",
        Maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800",
    };

    return (
        <div className="space-y-6">
             <Link href="/patient" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Hospitals List
            </Link>

            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl flex items-center gap-3">
                        <Building className="w-8 h-8 text-primary"/>
                        {hospital.name}
                    </CardTitle>
                    <CardDescription>{hospital.address}, {hospital.city}, {hospital.state} - {hospital.postalCode}</CardDescription>
                </CardHeader>
            </Card>

            <div className="space-y-8">
                {departments.map(dept => (
                    <Card key={dept.id}>
                        <CardHeader>
                            <CardTitle>{dept.name}</CardTitle>
                            <CardDescription>{dept.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
                                {dept.beds.map(bed => (
                                    <div key={bed.id} className={cn(
                                        "rounded-lg border p-3 flex flex-col items-center justify-center aspect-square text-center",
                                        statusStyles[bed.status]
                                    )}>
                                        <BedIcon className="w-6 h-6 mb-1"/>
                                        <span className="text-sm font-semibold truncate block">{bed.bedId}</span>
                                        <span className="text-xs opacity-90">{bed.type}</span>
                                        <span className="text-xs font-bold mt-1">{bed.status}</span>
                                        {bed.status === 'Available' && (
                                            <Button size="sm" className="mt-2 h-7" onClick={() => setBedToBook(bed)}>
                                                Book
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                {dept.beds.length === 0 && (
                                    <p className="col-span-full text-center text-muted-foreground py-8">No beds found in this department.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
                 { !loading && departments.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground border rounded-lg">
                        <BedDouble className="mx-auto h-12 w-12 mb-4" />
                        <p className="text-lg font-semibold">No departments found.</p>
                        <p className="text-sm">This hospital has not set up any departments yet.</p>
                    </div>
                )}
            </div>

            <AlertDialog open={!!bedToBook} onOpenChange={(isOpen) => !isOpen && setBedToBook(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Bed Booking</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to book bed <span className="font-bold">{bedToBook?.bedId}</span> in the <span className="font-bold">{departments.find(d => d.id === bedToBook?.departmentId)?.name}</span> department? This action cannot be undone.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBookBed} disabled={isBooking}>
                        {isBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Booking
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
