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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, CheckCircle, XCircle, Clock } from "lucide-react";
import type { Hospital } from "@/types";
import { cn } from "@/lib/utils";
import indianStates from "@/lib/india-states-districts.json";

interface HospitalsTableProps {
    hospitals: Hospital[];
    onStatusChange: (hospitalId: string, status: "approved" | "rejected") => void;
}

const statusVariant: Record<Hospital['status'], "default" | "secondary" | "destructive"> = {
    approved: "default",
    pending: "secondary",
    rejected: "destructive",
};

const StatusIcon = ({ status }: { status: Hospital['status'] }) => {
    switch (status) {
        case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
        case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
        default: return null;
    }
};

export function HospitalsTable({ hospitals, onStatusChange }: HospitalsTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
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
            const matchesStatus = statusFilter === "all" || hospital.status === statusFilter;
            const matchesState = stateFilter === "all" || hospital.state === stateFilter;
            const matchesDistrict = districtFilter === "all" || hospital.district === districtFilter;
            return matchesSearch && matchesStatus && matchesState && matchesDistrict;
        });
    }, [hospitals, searchTerm, statusFilter, stateFilter, districtFilter]);

    return (
        <div className="space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Input
                    placeholder="Search hospitals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                />
                 <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
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
                            <TableHead>Location</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-center">Beds (Available/Total)</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredHospitals.length > 0 ? (
                            filteredHospitals.map((hospital) => (
                                <TableRow key={hospital.uid}>
                                    <TableCell className="font-medium">{hospital.name}</TableCell>
                                    <TableCell>{hospital.city}, {hospital.state}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={statusVariant[hospital.status]} className="capitalize flex items-center gap-1.5 justify-center">
                                           <StatusIcon status={hospital.status} />
                                           {hospital.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {hospital.totalBeds - hospital.occupiedBeds} / {hospital.totalBeds}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onStatusChange(hospital.uid, 'approved')}>
                                                    Approve
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onStatusChange(hospital.uid, 'rejected')}>
                                                    Reject
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
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
