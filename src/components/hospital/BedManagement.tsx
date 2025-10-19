
"use client";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Department, Hospital, Bed, BedStatus, bedTypes } from "@/types";
import { collection, onSnapshot, query, doc, updateDoc, writeBatch } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Loader2, Terminal, Bed as BedIcon, BedDouble } from "lucide-react";
import { Progress } from "../ui/progress";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";

interface DepartmentWithBeds extends Department {
    beds: Bed[];
    totalBeds: number;
    occupiedBeds: number;
}

const bedFormSchema = z.object({
  bedId: z.string().min(1, "Bed ID is required."),
  type: z.string().min(1, "Bed type is required."),
  status: z.enum(['Available', 'Occupied', 'Cleaning', 'Maintenance']),
  notes: z.string().optional(),
});


export function BedManagement() {
    const { userProfile } = useAuth();
    const { toast } = useToast();

    const [departments, setDepartments] = useState<DepartmentWithBeds[]>([]);
    const [loading, setLoading] = useState(true);
    const [hospital, setHospital] = useState<Hospital | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingBed, setEditingBed] = useState<Bed | null>(null);

    const form = useForm<z.infer<typeof bedFormSchema>>({
        resolver: zodResolver(bedFormSchema),
        defaultValues: { bedId: "", type: "", status: "Available", notes: "" },
    });

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
        const departmentsUnsubscribe = onSnapshot(departmentsRef, (snapshot) => {
            const deptsWithBeds: { [key: string]: DepartmentWithBeds } = {};
            
            if(snapshot.empty) {
                setDepartments([]);
                setLoading(false);
                return;
            }

            snapshot.docs.forEach(deptDoc => {
                const department = { id: deptDoc.id, ...deptDoc.data() } as Department;
                deptsWithBeds[deptDoc.id] = {
                    ...department,
                    beds: [],
                    totalBeds: 0,
                    occupiedBeds: 0
                };

                const bedsRef = collection(deptDoc.ref, "beds");
                onSnapshot(bedsRef, (bedsSnapshot) => {
                    const bedsData = bedsSnapshot.docs.map(bedDoc => ({ id: bedDoc.id, ...bedDoc.data() } as Bed)).sort((a,b) => a.bedId.localeCompare(b.bedId));
                    const occupiedCount = bedsData.filter(b => b.status === 'Occupied').length;

                    setDepartments(prevDepts => {
                        const newDepts = [...prevDepts];
                        const deptIndex = newDepts.findIndex(d => d.id === deptDoc.id);
                        const updatedDept = {
                            ...department,
                            beds: bedsData,
                            totalBeds: bedsData.length,
                            occupiedBeds: occupiedCount
                        };

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

    const handleFormSubmit = async (values: z.infer<typeof bedFormSchema>) => {
        if (!userProfile || !editingBed) return;
        setIsSubmitting(true);
        try {
            const bedRef = doc(db, "hospitals", userProfile.uid, "departments", editingBed.departmentId, "beds", editingBed.id);
            await updateDoc(bedRef, { status: values.status, notes: values.notes });
            toast({ title: "Bed Status Updated", description: `Bed ${editingBed.bedId} is now ${values.status}.` });
            setEditingBed(null);
            form.reset();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Update Failed", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditDialog = (bed: Bed) => {
        setEditingBed(bed);
        form.reset({
            bedId: bed.bedId,
            type: bed.type,
            status: bed.status,
            notes: bed.notes || "",
        });
    };
    
    if (loading) {
        return (
             <div className="space-y-8">
                <Skeleton className="h-40 rounded-lg" />
                <Skeleton className="h-64 rounded-lg" />
                <Skeleton className="h-64 rounded-lg" />
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

    const statusStyles: Record<BedStatus, string> = {
        Available: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-900",
        Occupied: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900",
        Cleaning: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900",
        Maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800 dark:hover:bg-yellow-900",
    };

    return (
       <div className="space-y-8">
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

            <div className="space-y-8">
                {departments.map(dept => {
                    const occupancy = dept.totalBeds > 0 ? (dept.occupiedBeds / dept.totalBeds) * 100 : 0;
                    return (
                        <Card key={dept.id}>
                            <CardHeader>
                                <CardTitle>{dept.name}</CardTitle>
                                <CardDescription>{dept.description}</CardDescription>
                                <div className="pt-2">
                                     <div className="flex justify-between items-baseline text-sm">
                                        <p>{dept.occupiedBeds} / {dept.totalBeds} <span className="text-muted-foreground">Beds Occupied</span></p>
                                        <p>{Math.round(occupancy)}% <span className="text-muted-foreground">Occupancy</span></p>
                                    </div>
                                    <Progress value={occupancy} className="h-2 mt-1"/>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
                                    {dept.beds.map(bed => (
                                        <button key={bed.id} onClick={() => openEditDialog(bed)} className={cn(
                                            "rounded-md border p-2 flex flex-col items-center justify-center aspect-square transition-colors",
                                            statusStyles[bed.status]
                                        )}>
                                            <BedIcon className="w-5 h-5 mb-1"/>
                                            <span className="text-xs font-semibold truncate">{bed.bedId}</span>
                                            <span className="text-[10px] opacity-80">{bed.status}</span>
                                        </button>
                                    ))}
                                    {dept.beds.length === 0 && (
                                        <p className="col-span-full text-center text-muted-foreground py-8">No beds in this department.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
             { !loading && departments.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border rounded-lg">
                    <BedDouble className="mx-auto h-12 w-12 mb-4" />
                    <p className="text-lg font-semibold">No departments found.</p>
                    <p className="text-sm">Please add departments in the 'Departments & Beds' section.</p>
                </div>
            )}
             <Dialog open={!!editingBed} onOpenChange={(isOpen) => !isOpen && setEditingBed(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Update Bed: {editingBed?.bedId}</DialogTitle>
                        <DialogDescription>
                            Change the status and add notes for this bed. The Bed ID and Type cannot be changed from here.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
                             <div className="grid grid-cols-2 gap-4">
                                <FormItem>
                                    <FormLabel>Bed ID</FormLabel>
                                    <Input value={editingBed?.bedId} disabled />
                                </FormItem>
                                <FormItem>
                                    <FormLabel>Bed Type</FormLabel>
                                    <Input value={editingBed?.type} disabled />
                                </FormItem>
                            </div>
                             <FormField control={form.control} name="status" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Available">Available</SelectItem>
                                            <SelectItem value="Occupied">Occupied</SelectItem>
                                            <SelectItem value="Cleaning">Cleaning</SelectItem>
                                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="notes" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes (Optional)</FormLabel>
                                    <FormControl><Input placeholder="e.g., Near window" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setEditingBed(null)}>Cancel</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
       </div>
    );
}

    