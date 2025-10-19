
"use client";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Department, defaultDepartments } from "@/types";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Loader2, Terminal, PlusCircle, Building, ChevronRight, CheckCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "../ui/input";
import Link from "next/link";
import { addDepartmentWithBeds } from "./actions";

const addDepartmentFormSchema = z.object({
  departmentName: z.string(),
  numberOfBeds: z.number().min(1, "At least one bed is required.").max(100, "You can add a maximum of 100 beds at a time."),
});

export function DepartmentManagement() {
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedDept, setSelectedDept] = useState<string | null>(null);

    const form = useForm<z.infer<typeof addDepartmentFormSchema>>({
        resolver: zodResolver(addDepartmentFormSchema),
        defaultValues: { numberOfBeds: 10 },
    });

    useEffect(() => {
        if (!userProfile?.uid) {
            setLoading(false);
            return;
        }

        const departmentsRef = collection(db, "hospitals", userProfile.uid, "departments");
        const unsubscribe = onSnapshot(departmentsRef, (snapshot) => {
            const deptsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
            setDepartments(deptsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching departments:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch departments." });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userProfile, toast]);

    const handleFormSubmit = async (values: z.infer<typeof addDepartmentFormSchema>) => {
        if (!userProfile || !selectedDept) return;
        setIsSubmitting(true);
        try {
            const result = await addDepartmentWithBeds({
                hospitalId: userProfile.uid,
                departmentName: selectedDept,
                numberOfBeds: values.numberOfBeds,
            });
            toast({ title: "Success", description: result.message });
            setIsFormOpen(false);
            form.reset({ numberOfBeds: 10 });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Submission Failed", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const openAddDialog = (deptName: string) => {
        setSelectedDept(deptName);
        form.setValue('departmentName', deptName);
        setIsFormOpen(true);
    };

    const addedDepartmentNames = useMemo(() => new Set(departments.map(d => d.name)), [departments]);
    const availableDepartments = useMemo(() => defaultDepartments.filter(d => !addedDepartmentNames.has(d.name)), [addedDepartmentNames]);


    if (loading) {
        return <Skeleton className="h-96 w-full" />;
    }

    if (!userProfile || userProfile.role !== 'hospital') {
        return (
            <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>You do not have permission to manage departments.</AlertDescription>
            </Alert>
        );
    }

    return (
        <>
            <div className="grid lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Your Departments</CardTitle>
                        <CardDescription>A list of all departments currently in your hospital. Click one to manage its beds.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {departments.length > 0 ? (
                                departments.map(dept => (
                                    <Link key={dept.id} href={`/hospital/departments/${dept.id}`}>
                                        <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted transition-colors cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <Building className="w-6 h-6 text-primary" />
                                                <div>
                                                    <p className="font-semibold">{dept.name}</p>
                                                    <p className="text-sm text-muted-foreground">{dept.description}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Building className="mx-auto h-12 w-12 mb-4" />
                                    <h3 className="text-lg font-semibold">No Departments Added</h3>
                                    <p>Add departments from the list on the right.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Add New Departments</CardTitle>
                        <CardDescription>Select a predefined department to add it to your hospital.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                           {availableDepartments.map(dept => (
                                <div key={dept.name} className="flex items-center justify-between p-4 rounded-lg border">
                                    <div>
                                        <p className="font-semibold">{dept.name}</p>
                                        <p className="text-sm text-muted-foreground">{dept.description}</p>
                                    </div>
                                    <Button size="sm" onClick={() => openAddDialog(dept.name)}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add
                                    </Button>
                                </div>
                            ))}
                             {availableDepartments.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                                    <CheckCircle className="mx-auto h-12 w-12 mb-4 text-green-500" />
                                    <h3 className="text-lg font-semibold">All Departments Added</h3>
                                    <p>You have added all available default departments.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add Department Dialog */}
             <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setSelectedDept(null); setIsFormOpen(isOpen); }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add "{selectedDept}"</DialogTitle>
                        <DialogDescription>
                            Specify how many beds to create for this department.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
                            <FormField
                                control={form.control}
                                name="numberOfBeds"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Number of Beds</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number" 
                                            placeholder="e.g., 20" 
                                            {...field}
                                            onChange={e => {
                                                const value = e.target.value;
                                                field.onChange(value === '' ? undefined : parseInt(value, 10));
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Department & Beds
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    )
}
