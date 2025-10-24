
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, AlertTriangle } from "lucide-react";
import { app } from "@/lib/firebase/firebase";
import { UserRole } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Link from "next/link";
import { Alert, AlertTitle } from "@/components/ui/alert";


const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(1, "Password is required."),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address."),
});

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showUnverifiedAlert, setShowUnverifiedAlert] = useState(false);
  const [emailForVerification, setEmailForVerification] = useState("");
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
  
  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    setShowUnverifiedAlert(false);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      if (!user.emailVerified) {
          setEmailForVerification(values.email);
          setShowUnverifiedAlert(true);
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
                router.push('/'); // Fallback to home
        }
      } else {
        throw new Error("User profile not found. Please contact support.");
      }
    } catch (error: any) {
      const errorCode = error.code;
      let errorMessage = "An unexpected error occurred. Please try again.";
       if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
          errorMessage = 'Invalid email or password. Please try again.';
      }
      toast({ variant: "destructive", title: "Login Failed", description: errorMessage });
    } finally {
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
      // This will automatically switch the tab to 'login' in the UI
      // Find a way to trigger tab change if needed, or instruct user.
      loginForm.reset({ email: values.email, password: "" });
      registerForm.reset();

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

  const onForgotPassword = async (values: z.infer<typeof forgotPasswordSchema>) => {
      setIsLoading(true);
      try {
          await sendPasswordResetEmail(auth, values.email);
          toast({
              title: "Password Reset Email Sent",
              description: "Please check your inbox for instructions to reset your password.",
          });
          // Optionally close the dialog here. The AlertDialog closes on action by default.
      } catch (error: any) {
          toast({
              variant: "destructive",
              title: "Failed to Send Email",
              description: "Could not send password reset email. Please ensure the email address is correct.",
          });
      } finally {
          setIsLoading(false);
      }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) {
        // This can happen if the user logs out in another tab.
        // We need to sign them in again briefly to get the user object.
        try {
            const userCredential = await signInWithEmailAndPassword(auth, emailForVerification, loginForm.getValues("password"));
            if (userCredential.user) {
                await sendEmailVerification(userCredential.user);
                toast({ title: "Verification Email Resent", description: "A new verification link has been sent to your email." });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not resend verification email. Please try logging in again." });
        }
    } else {
        try {
            await sendEmailVerification(auth.currentUser);
            toast({ title: "Verification Email Resent", description: "A new verification link has been sent to your email." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not resend verification email." });
        }
    }
  };


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="mb-8 flex flex-col items-center text-center">
            <h1 className="text-4xl font-bold">MEDALLOC</h1>
            <p className="text-muted-foreground">Intelligent Bed Management, Simplified.</p>
        </div>
      <Card className="w-full max-w-sm">
         <Tabs defaultValue="login" className="w-full">
            <CardHeader>
               <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
            </CardHeader>
            <CardContent>
                <TabsContent value="login">
                     <CardDescription className="text-center mb-4">Log in to access your dashboard.</CardDescription>
                     
                     {showUnverifiedAlert && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Email Not Verified</AlertTitle>
                            <FormDescription>
                                Please verify your email before logging in.
                                <Button variant="link" className="p-0 h-auto ml-1" onClick={handleResendVerification}>
                                    Resend verification link.
                                </Button>
                            </FormDescription>
                        </Alert>
                     )}

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
                             <div className="text-sm text-right">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="link" className="p-0 h-auto font-normal">Forgot password?</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Forgot Password</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Enter your email address and we'll send you a link to reset your password.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <Form {...forgotPasswordForm}>
                                            <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPassword)} className="space-y-4">
                                                <FormField
                                                    control={forgotPasswordForm.control}
                                                    name="email"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Email</FormLabel>
                                                            <FormControl>
                                                                <Input type="email" placeholder="name@example.com" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <Button type="submit" disabled={isLoading}>
                                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        Send Reset Link
                                                    </Button>
                                                </AlertDialogFooter>
                                            </form>
                                        </Form>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Login
                            </Button>
                        </form>
                    </Form>
                </TabsContent>
                <TabsContent value="register">
                    <CardDescription className="text-center mb-4">Create a patient account. A verification link will be sent to your email.</CardDescription>
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
                </TabsContent>
            </CardContent>
         </Tabs>
      </Card>
    </div>
  );
}
