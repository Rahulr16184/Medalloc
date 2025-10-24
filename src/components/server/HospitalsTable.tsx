
"use client";

import { useState, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Hospital } from "@/types";
import indianStates from "@/lib/india-states-districts.json";

interface HospitalsTableProps {
    hospitals: Hospital[];
}

export function HospitalsTable({ hospitals }: HospitalsTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [stateFilter, setStateFilter] = useState("all");
    const [districtFilter, setDistrictFilter] = useState("all");

    const districtsForState = useMemo(() => {
        if (stateFilter === "all") return [];
        const selectedState = indianStates.states.find(s => s.state === stateFilter);
        return selectedState ? selectedState.districts : [];
    }, [stateFilter]);

    const filteredHospitals = useMemo(() => {
        return hospitals.filter(hospital => {
            const matchesSearch = hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                hospital.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                hospital.district?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesState = stateFilter === "all" || hospital.state === stateFilter;
            const matchesDistrict = districtFilter === "all" || hospital.district === districtFilter;
            return matchesSearch && matchesState && matchesDistrict;
        });
    }, [hospitals, searchTerm, stateFilter, districtFilter]);

    return (
        <div className="space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Input
                    placeholder="Search hospitals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                />
                 <Select value={stateFilter} onValueChange={(value) => { setStateFilter(value); setDistrictFilter("all"); }}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by state" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All States</SelectItem>
                        {indianStates.states.map(s => <SelectItem key={s.state} value={s.state}>{s.state}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={districtFilter} onValueChange={setDistrictFilter} disabled={stateFilter === 'all'}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by district" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Districts</SelectItem>
                        {districtsForState.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Hospital Name</TableHead>
                            <TableHead>Admin Email</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead className="text-center">Beds (Occupied/Total)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredHospitals.length > 0 ? (
                            filteredHospitals.map((hospital) => (
                                <TableRow key={hospital.uid}>
                                    <TableCell className="font-medium">{hospital.name}</TableCell>
                                    <TableCell>{hospital.adminEmail}</TableCell>
                                    <TableCell>{hospital.city || '-'}, {hospital.state || '-'}</TableCell>
                                    <TableCell className="text-center">
                                        {hospital.occupiedBeds} / {hospital.totalBeds}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No hospitals found matching your criteria.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
