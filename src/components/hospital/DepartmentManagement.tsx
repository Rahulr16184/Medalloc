
"use client";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Department } from "@/types";
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Loader2, Terminal, PlusCircle, Building, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "../ui/input";
import Link from "next/link";
import { Textarea } from "../ui/textarea";

const departmentFormSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters."),
  description: z.string().optional(),
});

export function DepartmentManagement() {
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof departmentFormSchema>>({
        resolver: zodResolver(departmentFormSchema),
        defaultValues: { name: "", description: "" },
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
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not fetch departments.",
            });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userProfile, toast]);

    const handleFormSubmit = async (values: z.infer<typeof departmentFormSchema>) => {
        if (!userProfile) return;
        setIsSubmitting(true);
        try {
            const departmentsRef = collection(db, "hospitals", userProfile.uid, "departments");
            await addDoc(departmentsRef, {
                ...values,
                hospitalId: userProfile.uid,
            });
            toast({
                title: "Department Added",
                description: `The "${values.name}" department has been created.`,
            });
            setIsFormOpen(false);
            form.reset();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: error.message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loading) {
        return <Skeleton className="h-72 w-full" />;
    }

    if (!userProfile || userProfile.role !== 'hospital') {
        return (
            <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>
                    You do not have permission to manage departments.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Your Departments</CardTitle>
                        <CardDescription>A list of all departments in your hospital.</CardDescription>
                    </div>
                     <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Department
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Add New Department</DialogTitle>
                                <DialogDescription>
                                    Enter the name and an optional description for the new department.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Department Name</FormLabel>
                                            <FormControl><Input placeholder="e.g., Intensive Care Unit" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="description" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description (Optional)</FormLabel>
                                            <FormControl><Textarea placeholder="Describe the department's purpose..." {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create Department
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
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
                                <h3 className="text-lg font-semibold">No Departments Found</h3>
                                <p>Click "Add Department" to get started.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </>
    )
}
