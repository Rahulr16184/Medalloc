
"use client";

import { useEffect, useState } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import type { Hospital } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Bed, BedDouble, Building, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PatientDashboardPage() {
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const q = query(collection(db, "hospitals"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const hospitalsData: Hospital[] = [];
            querySnapshot.forEach((doc) => {
                hospitalsData.push({ uid: doc.id, ...doc.data() } as Hospital);
            });
            setHospitals(hospitalsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredHospitals = hospitals.filter(hospital =>
        hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.district?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const availableBeds = (h: Hospital) => h.totalBeds - h.occupiedBeds;

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Find Hospital Beds</h1>
                <p className="text-muted-foreground">
                    Search for hospitals and view real-time bed availability.
                </p>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by hospital name, city, or district..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
            
            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-56 rounded-lg" />)}
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredHospitals.map(hospital => (
                        <Card key={hospital.uid} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building className="w-5 h-5 text-muted-foreground"/>
                                    {hospital.name}
                                </CardTitle>
                                <CardDescription>{hospital.city}, {hospital.state}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 flex-grow">
                                <div className="flex items-center justify-between p-3 rounded-md bg-secondary">
                                    <div className="flex items-center gap-2">
                                        <Bed className="w-5 h-5 text-green-500" />
                                        <span className="font-medium">Available Beds</span>
                                    </div>
                                    <span className="text-2xl font-bold text-green-600">{availableBeds(hospital)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <BedDouble className="w-4 h-4"/>
                                        <span>Total Beds</span>
                                    </div>
                                    <span>{hospital.totalBeds}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                     <div className="flex items-center gap-2">
                                        <BedDouble className="w-4 h-4 text-destructive"/>
                                        <span>Occupied Beds</span>
                                    </div>
                                    <span>{hospital.occupiedBeds}</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full">
                                    <Link href={`/patient/hospitals/${hospital.uid}`}>
                                        <BedDouble className="mr-2 h-4 w-4" />
                                        View & Book Beds
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
             { !loading && filteredHospitals.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No hospitals found matching your search.</p>
                </div>
            )}
        </div>
    );
}
