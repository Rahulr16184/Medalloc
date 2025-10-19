"use server";

import { forecastBedDemand, ForecastBedDemandInput } from "@/ai/flows/forecast-bed-demand";
import { db } from "@/lib/firebase/firebase";
import { Department, defaultDepartments } from "@/types";
import { collection, doc, writeBatch, increment } from "firebase/firestore";

export async function forecastBedDemandServer(input: ForecastBedDemandInput) {
  try {
    const result = await forecastBedDemand(input);
    return result;
  } catch (error) {
    console.error("Error in forecastBedDemandServer action:", error);
    throw new Error("Failed to generate forecast.");
  }
}

interface AddDepartmentWithBedsInput {
    hospitalId: string;
    departmentName: string;
    numberOfBeds: number;
}

export async function addDepartmentWithBeds({ hospitalId, departmentName, numberOfBeds}: AddDepartmentWithBedsInput) {
    if (!hospitalId || !departmentName || numberOfBeds <= 0) {
        throw new Error("Invalid input. Please provide all required fields.");
    }

    try {
        const batch = writeBatch(db);

        const departmentData = defaultDepartments.find(d => d.name === departmentName);
        if (!departmentData) {
            throw new Error("Department details not found.");
        }

        // 1. Create department document
        const departmentRef = doc(collection(db, "hospitals", hospitalId, "departments"));
        batch.set(departmentRef, {
            name: departmentData.name,
            description: departmentData.description,
            defaultBedType: departmentData.defaultBedType,
            hospitalId: hospitalId,
        });

        // 2. Create bed documents
        const bedsRef = collection(db, "hospitals", hospitalId, "departments", departmentRef.id, "beds");
        const bedPrefix = departmentData.name.replace(/[^A-Z]/gi, '').substring(0, 3).toUpperCase();
        
        for (let i = 1; i <= numberOfBeds; i++) {
            const bedDocRef = doc(bedsRef);
            const bedNumber = i.toString().padStart(2, '0');
            batch.set(bedDocRef, {
                bedId: `${bedPrefix}-${bedNumber}`,
                type: departmentData.defaultBedType,
                status: 'Available',
                departmentId: departmentRef.id,
                hospitalId: hospitalId,
                notes: 'Default generated bed'
            });
        }
        
        // 3. Update hospital's total bed count
        const hospitalRef = doc(db, "hospitals", hospitalId);
        batch.update(hospitalRef, { totalBeds: increment(numberOfBeds) });

        // 4. Commit batch
        await batch.commit();

        return { success: true, message: `${departmentName} with ${numberOfBeds} beds added successfully.` };

    } catch (error: any) {
        console.error("Error in addDepartmentWithBeds action:", error);
        throw new Error(error.message || "Failed to add department and beds.");
    }
}
