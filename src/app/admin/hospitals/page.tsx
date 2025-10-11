"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, Query } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import type { Hospital } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import indianStates from "@/lib/india-states-districts.json";
import { Badge } from "@/components/ui/badge";

export default function AllHospitalsPage() {
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedState, setSelectedState] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("");

    useEffect(() => {
        const q = query(collection(db, "hospitals"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const hospitalsData: Hospital[] = [];
            querySnapshot.forEach((doc) => {
                hospitalsData.push({ ...doc.data(), uid: doc.id } as Hospital);
            });
            setHospitals(hospitalsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const districts = useMemo(() => {
        if (!selectedState) return [];
        const stateData = indianStates.states.find(s => s.state === selectedState);
        return stateData ? stateData.districts : [];
    }, [selectedState]);

    const filteredHospitals = useMemo(() => {
        return hospitals.filter(hospital => {
            const stateMatch = selectedState ? hospital.state === selectedState : true;
            const districtMatch = selectedDistrict ? hospital.district === selectedDistrict : true;
            return stateMatch && districtMatch;
        });
    }, [hospitals, selectedState, selectedDistrict]);

    const handleStateChange = (value: string) => {
        setSelectedState(value);
        setSelectedDistrict("");
    };

    const handleClearFilters = () => {
        setSelectedState("");
        setSelectedDistrict("");
    };

    const getStatusVariant = (status: Hospital['status']) => {
        switch (status) {
            case 'approved': return 'default';
            case 'pending': return 'secondary';
            case 'rejected': return 'destructive';
            default: return 'outline';
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Filter Hospitals</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4">
                    <Select onValueChange={handleStateChange} value={selectedState}>
                        <SelectTrigger className="md:w-[200px]">
                            <SelectValue placeholder="Select a state" />
                        </SelectTrigger>
                        <SelectContent>
                            {indianStates.states.map(s => (
                                <SelectItem key={s.state} value={s.state}>{s.state}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select onValueChange={setSelectedDistrict} value={selectedDistrict} disabled={!selectedState}>
                        <SelectTrigger className="md:w-[200px]">
                            <SelectValue placeholder="Select a district" />
                        </SelectTrigger>
                        <SelectContent>
                            {districts.map(d => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleClearFilters} variant="outline">Clear Filters</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>All Registered Hospitals</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Hospital Name</TableHead>
                                <TableHead>Admin</TableHead>
                                <TableHead>City</TableHead>
                                <TableHead>State</TableHead>
                                <TableHead>District</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredHospitals.length > 0 ? (
                                filteredHospitals.map(hospital => (
                                    <TableRow key={hospital.uid}>
                                        <TableCell className="font-medium">{hospital.name}</TableCell>
                                        <TableCell>{hospital.adminName}</TableCell>
                                        <TableCell>{hospital.city}</TableCell>
                                        <TableCell>{hospital.state}</TableCell>
                                        <TableCell>{hospital.district}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(hospital.status)}>
                                                {hospital.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">
                                        No hospitals found for the selected filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}