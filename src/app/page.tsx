
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Hospital } from "lucide-react";
import { app } from "@/lib/firebase/firebase";
import { UserRole } from "@/types";

const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      if (!user.emailVerified) {
          toast({
              variant: "destructive",
              title: "Email Not Verified",
              description: "Please check your inbox and verify your email address before logging in.",
          });
          setIsLoading(false);
          return;
      }

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role: UserRole = userData.role;
        toast({ title: "Login Successful", description: "Redirecting to your dashboard..." });

        switch(role) {
            case 'patient':
                router.push('/patient');
                break;
            case 'hospital':
                router.push('/hospital');
                break;
            case 'server':
                router.push('/server');
                break;
            default:
                throw new Error("Unknown user role.");
        }
      } else {
        throw new Error("User profile not found. Please contact support.");
      }
    } catch (error: any) {
      const errorCode = error.code;
      let errorMessage = error.message;
       if (errorCode === 'auth/invalid-credential') {
          errorMessage = 'Invalid email or password. Please try again.';
      }
      toast({ variant: "destructive", title: "Login Failed", description: errorMessage });
      setIsLoading(false);
    }
  };

  const onRegister = async (values: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        name: values.name,
        email: values.email,
        role: 'patient'
      });

      await sendEmailVerification(user);

      toast({
        title: "Registration Successful",
        description: "A verification email has been sent to your inbox. Please verify your email to log in.",
      });
      setIsRegister(false); // Switch back to login view
      loginForm.reset({ email: values.email }); // Pre-fill login email
    } catch (error: any) {
       const errorCode = error.code;
      let errorMessage = error.message;
       if (errorCode === 'auth/email-already-in-use') {
          errorMessage = 'This email is already registered. Please log in.';
      }
      toast({ variant: "destructive", title: "Registration Failed", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="mb-8 flex flex-col items-center text-center">
            <Hospital className="h-12 w-12 text-primary mb-4" />
            <h1 className="text-4xl font-bold">MEDALLOC</h1>
            <p className="text-muted-foreground">Intelligent Bed Management, Simplified.</p>
        </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{isRegister ? "Create a Patient Account" : "Welcome Back"}</CardTitle>
          <CardDescription>{isRegister ? "Fill in your details to create an account." : "Log in to access your dashboard."}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Label htmlFor="auth-mode" className={!isRegister ? 'font-bold' : ''}>Login</Label>
            <Switch
              id="auth-mode"
              checked={isRegister}
              onCheckedChange={setIsRegister}
              aria-label="Switch between login and register"
            />
            <Label htmlFor="auth-mode" className={isRegister ? 'font-bold' : ''}>Register</Label>
          </div>

          {isRegister ? (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl><Input type="email" placeholder="name@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Register
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl><Input type="email" placeholder="name@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Login
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
