
"use server";

import { db } from "@/lib/firebase/firebase";
import { Hospital } from "@/types";
import { doc, updateDoc } from "firebase/firestore";

// The input type no longer needs uid, as it will be passed separately for security.
type UpdateHospitalProfileInput = Partial<Omit<Hospital, 'uid'>>;

export async function updateHospitalProfile(uid: string, data: UpdateHospitalProfileInput) {
    if (!uid) {
        throw new Error("A user ID is required to update the profile.");
    }
    const hospitalRef = doc(db, "hospitals", uid);
    
    try {
        // Data is already what we want to update, no need to destructure uid from it.
        await updateDoc(hospitalRef, data);
        return { success: true, message: "Profile updated successfully." };
    } catch (error: any) {
        console.error("Error updating hospital profile:", error);
        throw new Error("A server error occurred while updating the profile.");
    }
}
