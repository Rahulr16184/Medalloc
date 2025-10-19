
"use client";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Bed, BedStatus, Department, bedTypes } from "@/types";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Loader2, Terminal, PlusCircle, Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";

const bedFormSchema = z.object({
  bedId: z.string().min(1, "Bed ID is required."),
  type: z.string().min(1, "Bed type is required."),
  status: z.enum(['Available', 'Occupied', 'Cleaning', 'Maintenance']),
  notes: z.string().optional(),
});

interface BedsManagementProps {
  departmentId: string;
}

export function BedsManagement({ departmentId }: BedsManagementProps) {
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const [department, setDepartment] = useState<Department | null>(null);
    const [beds, setBeds] = useState<Bed[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingBed, setEditingBed] = useState<Bed | null>(null);
    const [bedToDelete, setBedToDelete] = useState<Bed | null>(null);

    const form = useForm<z.infer<typeof bedFormSchema>>({
        resolver: zodResolver(bedFormSchema),
        defaultValues: {
            bedId: "",
            type: "",
            status: "Available",
            notes: "",
        },
    });

    useEffect(() => {
        if (!userProfile?.uid || !departmentId) {
            setLoading(false);
            return;
        }

        const deptRef = doc(db, "hospitals", userProfile.uid, "departments", departmentId);
        const deptUnsubscribe = onSnapshot(deptRef, (docSnap) => {
            if (docSnap.exists()) {
                setDepartment({ id: docSnap.id, ...docSnap.data() } as Department);
            } else {
                setDepartment(null);
            }
        });

        const bedsRef = collection(db, "hospitals", userProfile.uid, "departments", departmentId, "beds");
        const bedsUnsubscribe = onSnapshot(bedsRef, (snapshot) => {
            const bedsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bed)).sort((a, b) => a.bedId.localeCompare(b.bedId));
            setBeds(bedsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching beds:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch beds.' });
            setLoading(false);
        });

        return () => {
            deptUnsubscribe();
            bedsUnsubscribe();
        };
    }, [userProfile, departmentId, toast]);
    
    const handleFormSubmit = async (values: z.infer<typeof bedFormSchema>) => {
        if (!userProfile) return;
        setIsSubmitting(true);
        try {
            const bedData = {
                ...values,
                hospitalId: userProfile.uid,
                departmentId: departmentId
            };
            if(editingBed) {
                const bedRef = doc(db, "hospitals", userProfile.uid, "departments", departmentId, "beds", editingBed.id);
                await updateDoc(bedRef, bedData);
                toast({ title: "Bed Updated", description: `Bed ${values.bedId} has been updated.` });
            } else {
                const bedsRef = collection(db, "hospitals", userProfile.uid, "departments", departmentId, "beds");
                await addDoc(bedsRef, bedData);
                toast({ title: "Bed Added", description: `Bed ${values.bedId} has been added to the department.` });
            }
            setIsFormOpen(false);
            setEditingBed(null);
            form.reset();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Submission Failed", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteBed = async () => {
        if (!bedToDelete || !userProfile) return;

        const bedRef = doc(db, "hospitals", userProfile.uid, "departments", departmentId, "beds", bedToDelete.id);
        try {
            await deleteDoc(bedRef);
            toast({ title: "Bed Deleted", description: `Bed ${bedToDelete.bedId} has been removed.` });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
        } finally {
            setBedToDelete(null);
        }
    };

    const openForm = (bed: Bed | null = null) => {
        setEditingBed(bed);
        form.reset(bed ? {
            bedId: bed.bedId,
            type: bed.type,
            status: bed.status,
            notes: bed.notes || "",
        } : {
            bedId: "",
            type: department?.defaultBedType || "",
            status: "Available",
            notes: "",
        });
        setIsFormOpen(true);
    };

    const statusVariant: Record<BedStatus, "default" | "secondary" | "destructive" | "outline"> = {
        Available: "default",
        Occupied: "destructive",
        Cleaning: "secondary",
        Maintenance: "outline",
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-10 w-1/4" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!department) {
        return (
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Department not found. It may have been deleted.</AlertDescription>
            </Alert>
        );
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl">Bed Management: {department.name}</CardTitle>
                        <CardDescription>{department.description}</CardDescription>
                    </div>
                    <Button onClick={() => openForm()}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Bed
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bed ID</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {beds.length > 0 ? beds.map(bed => (
                                <TableRow key={bed.id}>
                                    <TableCell className="font-medium">{bed.bedId}</TableCell>
                                    <TableCell>{bed.type}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusVariant[bed.status]}>{bed.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{bed.notes || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openForm(bed)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                 <DropdownMenuItem onClick={() => setBedToDelete(bed)} className="text-red-600">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No beds found. Click "Add Bed" to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add/Edit Bed Dialog */}
            <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
                if (!isOpen) {
                    form.reset();
                    setEditingBed(null);
                }
                setIsFormOpen(isOpen);
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingBed ? "Edit Bed" : "Add a New Bed"}</DialogTitle>
                        <DialogDescription>
                            Fill in the details for the bed. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
                            <FormField control={form.control} name="bedId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bed ID</FormLabel>
                                    <FormControl><Input placeholder="e.g., ICU-001" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bed Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a bed type" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {bedTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
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
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingBed ? "Save Changes" : "Create Bed"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

             {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!bedToDelete} onOpenChange={(isOpen) => !isOpen && setBedToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the bed <span className="font-bold">{bedToDelete?.bedId}</span>.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteBed} className="bg-destructive hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

    