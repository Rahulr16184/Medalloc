
"use server";

import { db } from "@/lib/firebase/firebase";
import { doc, writeBatch, increment } from "firebase/firestore";

interface BookBedInput {
    hospitalId: string;
    departmentId: string;
    bedId: string;
    patientId: string;
}

export async function bookBed({ hospitalId, departmentId, bedId, patientId }: BookBedInput) {
    if (!hospitalId || !departmentId || !bedId || !patientId) {
        throw new Error("Invalid booking information. All fields are required.");
    }
    
    const batch = writeBatch(db);

    const bedRef = doc(db, "hospitals", hospitalId, "departments", departmentId, "beds", bedId);
    batch.update(bedRef, {
        status: 'Occupied',
        patientId: patientId,
    });

    const hospitalRef = doc(db, "hospitals", hospitalId);
    batch.update(hospitalRef, {
        occupiedBeds: increment(1)
    });
    
    try {
        await batch.commit();
        return { success: true, message: "Bed booked successfully." };
    } catch (error: any) {
        console.error("Error booking bed:", error);
        throw new Error("A server error occurred while trying to book the bed.");
    }
}
