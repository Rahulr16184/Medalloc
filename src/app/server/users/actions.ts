
"use server";

import { db } from "@/lib/firebase/firebase";
import { UserRole } from "@/types";
import { doc, updateDoc } from "firebase/firestore";

interface UpdateUserRoleInput {
    userId: string;
    role: UserRole;
    password: string;
}

const rolePasswords: Record<UserRole, string> = {
    patient: "pa642531",
    hospital: "ho642531",
    server: "ad642531",
};

export async function updateUserRole({ userId, role, password }: UpdateUserRoleInput): Promise<{ success: boolean, message: string }> {
    if (!userId || !role || !password) {
        throw new Error("Invalid input. All fields are required.");
    }

    if (password !== rolePasswords[role]) {
        return { success: false, message: "Incorrect password for the selected role." };
    }

    const userRef = doc(db, "users", userId);
    
    try {
        await updateDoc(userRef, { role: role });
        return { success: true, message: `User role successfully updated to ${role}.` };
    } catch (error: any) {
        console.error("Error updating user role:", error);
        throw new Error("A server error occurred while trying to update the user role.");
    }
}
