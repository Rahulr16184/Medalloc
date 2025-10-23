
"use server";

import { db } from "@/lib/firebase/firebase";
import { defaultDepartments } from "@/types";
import { collection, doc, writeBatch, increment, query, orderBy, limit, getDocs } from "firebase/firestore";

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

        const departmentRef = doc(collection(db, "hospitals", hospitalId, "departments"));
        batch.set(departmentRef, {
            name: departmentData.name,
            description: departmentData.description,
            defaultBedType: departmentData.defaultBedType,
            hospitalId: hospitalId,
        });

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
        
        const hospitalRef = doc(db, "hospitals", hospitalId);
        batch.update(hospitalRef, { totalBeds: increment(numberOfBeds) });

        await batch.commit();

        return { success: true, message: `${departmentName} with ${numberOfBeds} beds added successfully.` };

    } catch (error: any) {
        console.error("Error in addDepartmentWithBeds action:", error);
        throw new Error(error.message || "Failed to add department and beds.");
    }
}


interface AddMultipleBedsInput {
    hospitalId: string;
    departmentId: string;
    departmentName: string;
    defaultBedType: string;
    numberOfBeds: number;
}

export async function addMultipleBeds({ hospitalId, departmentId, departmentName, defaultBedType, numberOfBeds }: AddMultipleBedsInput) {
     if (!hospitalId || !departmentId || !departmentName || numberOfBeds <= 0) {
        throw new Error("Invalid input for adding multiple beds.");
    }

    try {
        const batch = writeBatch(db);
        const bedsRef = collection(db, "hospitals", hospitalId, "departments", departmentId, "beds");
        
        // Find the last bed number to continue sequencing
        const lastBedQuery = query(bedsRef, orderBy("bedId", "desc"), limit(1));
        const lastBedSnapshot = await getDocs(lastBedQuery);
        let lastBedNumber = 0;
        if (!lastBedSnapshot.empty) {
            const lastBedId = lastBedSnapshot.docs[0].data().bedId as string;
            const match = lastBedId.match(/-(\d+)$/);
            if (match) {
                lastBedNumber = parseInt(match[1], 10);
            }
        }
        
        const bedPrefix = departmentName.replace(/[^A-Z]/gi, '').substring(0, 3).toUpperCase();

        for (let i = 1; i <= numberOfBeds; i++) {
            const newBedNumber = (lastBedNumber + i).toString().padStart(2, '0');
            const bedDocRef = doc(bedsRef);
            batch.set(bedDocRef, {
                bedId: `${bedPrefix}-${newBedNumber}`,
                type: defaultBedType,
                status: 'Available',
                departmentId: departmentId,
                hospitalId: hospitalId,
                notes: 'Bulk generated bed'
            });
        }

        const hospitalRef = doc(db, "hospitals", hospitalId);
        batch.update(hospitalRef, { totalBeds: increment(numberOfBeds) });

        await batch.commit();
        
        return { success: true, message: `${numberOfBeds} beds added to ${departmentName} successfully.` };

    } catch (error: any) {
        console.error("Error in addMultipleBeds action:", error);
        throw new Error(error.message || "Failed to add beds in bulk.");
    }
}
