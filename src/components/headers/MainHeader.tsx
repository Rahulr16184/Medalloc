
"use client"

import Link from "next/link"
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Hospital, LogOut } from 'lucide-react';
import { ModeToggle } from "../ModeToggle";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";

export function MainHeader() {
    const router = useRouter();
    const auth = getAuth();
    const { toast } = useToast();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            toast({ title: "Signed Out", description: "You have been successfully signed out." });
            router.push('/');
        } catch (error) {
            toast({ variant: "destructive", title: "Sign Out Failed", description: "An error occurred while signing out." });
        }
    };

    return (
        <header className="sticky top-0 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6 z-40">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
                <Hospital className="h-6 w-6 text-primary" />
                <span className="font-bold">MEDALLOC</span>
            </Link>
            <div className="flex items-center gap-2">
                <ModeToggle />
                 <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
                    <LogOut className="h-5 w-5" />
                </Button>
            </div>
        </header>
    )
}
