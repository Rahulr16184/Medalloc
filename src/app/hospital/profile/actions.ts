
"use server";

import { db } from "@/lib/firebase/firebase";
import { Hospital } from "@/types";
import { doc, updateDoc } from "firebase/firestore";

type UpdateHospitalProfileInput = Partial<Hospital> & {
    uid: string;
};

export async function updateHospitalProfile(data: UpdateHospitalProfileInput) {
    if (!data.uid) {
        throw new Error("Hospital ID is required.");
    }
    const hospitalRef = doc(db, "hospitals", data.uid);
    
    try {
        const { uid, ...updateData } = data;
        await updateDoc(hospitalRef, updateData);
        return { success: true, message: "Profile updated successfully." };
    } catch (error: any) {
        console.error("Error updating hospital profile:", error);
        throw new Error("A server error occurred while updating the profile.");
    }
}
