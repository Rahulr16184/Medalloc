
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Hospital as HospitalIcon, User } from "lucide-react";
import type { UserRole } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import indianStates from "@/lib/india-states-districts.json";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  role: z.enum(["patient", "hospital"]),
  hospitalName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  district: z.string().optional(),
}).refine(data => {
  if (data.role === 'hospital') {
    return !!data.hospitalName && data.hospitalName.length > 0;
  }
  return true;
}, {
  message: "Hospital name is required.",
  path: ["hospitalName"],
}).refine(data => {
    if (data.role === 'hospital') {
        return !!data.address && data.address.length > 0;
    }
    return true;
}, {
    message: "Address is required.",
    path: ["address"],
}).refine(data => {
    if (data.role === 'hospital') {
        return !!data.city && data.city.length > 0;
    }
    return true;
}, {
    message: "City is required.",
    path: ["city"],
}).refine(data => {
    if (data.role === 'hospital') {
        return !!data.state && data.state.length > 0;
    }
    return true;
}, {
    message: "State is required.",
    path: ["state"],
}).refine(data => {
    if (data.role === 'hospital') {
        return !!data.postalCode && data.postalCode.length > 0;
    }
    return true;
}, {
    message: "Postal code is required.",
    path: ["postalCode"],
}).refine(data => {
    if (data.role === 'hospital') {
        return !!data.district && data.district.length > 0;
    }
    return true;
}, {
    message: "District is required.",
    path: ["district"],
});


export function SignupForm() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "", role: "patient" },
  });

  const role = form.watch("role");
  const selectedState = form.watch("state");

  const districts = useMemo(() => {
    if (!selectedState) return [];
    const stateData = indianStates.states.find(s => s.state === selectedState);
    return stateData ? stateData.districts : [];
  }, [selectedState]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Create user profile in Firestore
      const userProfile = {
        uid: user.uid,
        name: values.name,
        email: values.email,
        role: values.role as UserRole,
      };
      await setDoc(doc(db, "users", user.uid), userProfile);

      // If hospital, create hospital document
      if (values.role === 'hospital') {
        const hospitalData = {
          uid: user.uid,
          name: values.hospitalName,
          adminName: values.name,
          adminEmail: values.email,
          status: 'pending',
          totalBeds: 0,
          occupiedBeds: 0,
          address: values.address,
          city: values.city,
          state: values.state,
          postalCode: values.postalCode,
          district: values.district,
        };
        await setDoc(doc(db, "hospitals", user.uid), hospitalData);
      }
      
      toast({
        title: "Account Created",
        description: "Redirecting you to your dashboard...",
      });
      // AuthContext will handle redirection
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create an Account</CardTitle>
        <CardDescription>Join MEDALLOC to streamline bed management.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Tabs
                    value={role}
                    onValueChange={(value) => form.setValue('role', value as 'patient' | 'hospital')}
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="patient">
                            <User className="mr-2 h-4 w-4" />
                            Patient
                        </TabsTrigger>
                        <TabsTrigger value="hospital">
                            <HospitalIcon className="mr-2 h-4 w-4" />
                            Hospital
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input placeholder="name@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl><Input type="password" placeholder="••••••••" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {role === 'hospital' && (
                  <div className="space-y-4 transition-all duration-300">
                    <FormField control={form.control} name="hospitalName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hospital Name</FormLabel>
                          <FormControl><Input placeholder="General Hospital" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl><Input placeholder="123 Main St" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <div className="grid grid-cols-2 gap-4">
                       <FormField control={form.control} name="city" render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl><Input placeholder="Anytown" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField control={form.control} name="postalCode" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl><Input placeholder="12345" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                       <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>State</FormLabel>
                              <Select onValueChange={(value) => {
                                  field.onChange(value);
                                  form.resetField('district');
                              }} defaultValue={field.value}>
                                  <FormControl>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Select a state" />
                                  </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                  {indianStates.states.map(s => (
                                      <SelectItem key={s.state} value={s.state}>{s.state}</SelectItem>
                                  ))}
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
                                  <FormControl>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Select a district" />
                                  </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                  {districts.map(d => (
                                      <SelectItem key={d} value={d}>{d}</SelectItem>
                                  ))}
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
                    </div>
                  </div>
                )}
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
            </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <p>
          Already have an account?&nbsp;
          <Link href="/login" className="underline font-medium">
            Login
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
