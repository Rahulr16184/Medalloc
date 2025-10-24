
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

import type { Hospital } from "@/types";
import indianStates from "@/lib/india-states-districts.json";
import { updateHospitalProfile } from "./actions";

// Assume the logged-in hospital user's ID is this mock ID
const MOCK_HOSPITAL_ID = "mock-hospital-id";

const profileFormSchema = z.object({
  name: z.string().min(2, "Hospital name must be at least 2 characters."),
  address: z.string().min(5, "Address is required."),
  city: z.string().min(2, "City is required."),
  state: z.string().min(1, "State is required."),
  district: z.string().min(1, "District is required."),
  postalCode: z.string().regex(/^\d{6}$/, "Must be a 6-digit postal code."),
});

export default function HospitalProfilePage() {
    const { toast } = useToast();
    const [hospital, setHospital] = useState<Hospital | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            name: "",
            address: "",
            city: "",
            state: "",
            district: "",
            postalCode: "",
        }
    });

    const selectedState = form.watch("state");
    const districtsForState = indianStates.states.find(s => s.state === selectedState)?.districts || [];

    useEffect(() => {
        const hospitalRef = doc(db, "hospitals", MOCK_HOSPITAL_ID);
        const unsubscribe = onSnapshot(hospitalRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = { uid: docSnap.id, ...docSnap.data() } as Hospital;
                setHospital(data);
                form.reset({
                    name: data.name || "",
                    address: data.address || "",
                    city: data.city || "",
                    state: data.state || "",
                    district: data.district || "",
                    postalCode: data.postalCode || "",
                });
            } else {
                // Handle case where hospital doc doesn't exist
                toast({ variant: "destructive", title: "Error", description: "Hospital profile not found." });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [form, toast]);


    const onSubmit = async (values: z.infer<typeof profileFormSchema>) => {
        setIsSubmitting(true);
        try {
            await updateHospitalProfile({ uid: MOCK_HOSPITAL_ID, ...values });
            toast({
                title: "Profile Updated",
                description: "Your hospital details have been saved successfully.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loading) {
        return <Skeleton className="h-96 w-full" />
    }

    return (
         <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">My Hospital Profile</h1>
                <p className="text-muted-foreground max-w-2xl">
                    Update your hospital's public information. This will be visible to patients searching for beds.
                </p>
            </div>
            <Card>
            <CardHeader>
                <CardTitle>Hospital Details</CardTitle>
                <CardDescription>Keep your hospital's information up to date.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Hospital Name</FormLabel>
                                    <FormControl><Input placeholder="e.g., Apollo Hospital" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Street Address</FormLabel>
                                        <FormControl><Input placeholder="123 Main St" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>City</FormLabel>
                                        <FormControl><Input placeholder="e.g., Delhi" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField
                                control={form.control}
                                name="state"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>State</FormLabel>
                                        <Select onValueChange={(value) => { field.onChange(value); form.setValue('district', ''); }} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select a state" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {indianStates.states.map(s => <SelectItem key={s.state} value={s.state}>{s.state}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="district"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>District</FormLabel>
                                         <Select onValueChange={field.onChange} value={field.value} disabled={!selectedState}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select a district" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {districtsForState.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="postalCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Postal Code</FormLabel>
                                        <FormControl><Input placeholder="e.g., 110001" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
        </div>
    );
}
