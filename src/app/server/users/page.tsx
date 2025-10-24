
"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import type { UserProfile } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { UsersTable } from "@/components/server/UsersTable";
import { Skeleton } from "@/components/ui/skeleton";
import { updateUserRole } from "./actions";

export default function ManageUsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const q = query(collection(db, "users"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const usersData: UserProfile[] = [];
            querySnapshot.forEach((doc) => {
                usersData.push({ uid: doc.id, ...doc.data() } as UserProfile);
            });
            setUsers(usersData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching users:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not fetch users data.",
            });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);

    const handleRoleUpdate = async (userId: string, role: UserProfile['role'], password: string): Promise<{ success: boolean; message: string }> => {
        try {
            const result = await updateUserRole({ userId, role, password });
            toast({
                title: result.success ? "Role Updated" : "Update Failed",
                description: result.message,
                variant: result.success ? "default" : "destructive",
            });
            return result;
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.message || "An unexpected error occurred.",
            });
            return { success: false, message: error.message || "An unexpected error occurred." };
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
                <p className="text-muted-foreground">
                    View and manage roles for all registered users.
                </p>
            </div>
            {loading ? (
                 <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : (
                <UsersTable users={users} onRoleUpdate={handleRoleUpdate} />
            )}
        </div>
    );
}
