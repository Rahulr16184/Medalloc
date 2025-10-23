
"use server";

import { auth, db } from "@/lib/firebase/server";
import { defaultDepartments, type UserProfile, type Hospital, type UserRole } from "@/types";
import { collection, doc, writeBatch, increment } from "firebase/firestore";

interface CreateUserInput {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    hospitalName?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    district?: string;
}

export async function createUser(userData: CreateUserInput) {
    try {
        const userRecord = await auth.createUser({
            email: userData.email,
            password: userData.password,
            displayName: userData.name,
            emailVerified: true, // Auto-verify for simplicity in this context
        });

        const batch = writeBatch(db);

        const userProfile: UserProfile = {
            uid: userRecord.uid,
            name: userData.name,
            email: userData.email,
            role: userData.role,
        };
        const userDocRef = doc(db, "users", userRecord.uid);
        batch.set(userDocRef, userProfile);

        if (userData.role === 'hospital') {
            const hospitalData: Omit<Hospital, 'uid'> = {
                name: userData.hospitalName!,
                adminName: userData.name,
                adminEmail: userData.email,
                status: 'pending',
                totalBeds: 0,
                occupiedBeds: 0,
                address: userData.address!,
                city: userData.city!,
                state: userData.state!,
                postalCode: userData.postalCode!,
                district: userData.district!,
            };
            const hospitalDocRef = doc(db, "hospitals", userRecord.uid);
            batch.set(hospitalDocRef, hospitalData);

            let initialTotalBeds = 0;
            for (const dept of defaultDepartments) {
                const departmentsRef = collection(db, "hospitals", userRecord.uid, "departments");
                const deptDocRef = doc(departmentsRef);
                batch.set(deptDocRef, {
                    name: dept.name,
                    description: dept.description,
                    defaultBedType: dept.defaultBedType,
                    hospitalId: userRecord.uid,
                });

                const bedsRef = collection(db, "hospitals", userRecord.uid, "departments", deptDocRef.id, "beds");
                
                const bed1Ref = doc(bedsRef);
                batch.set(bed1Ref, { bedId: `${dept.name.substring(0, 3).toUpperCase()}-01`, type: dept.defaultBedType, status: 'Available', departmentId: deptDocRef.id, hospitalId: userRecord.uid, notes: 'Default bed' });
                
                const bed2Ref = doc(bedsRef);
                batch.set(bed2Ref, { bedId: `${dept.name.substring(0, 3).toUpperCase()}-02`, type: dept.defaultBedType, status: 'Available', departmentId: deptDocRef.id, hospitalId: userRecord.uid, notes: 'Default bed' });
                
                initialTotalBeds += 2;
            }
            batch.update(hospitalDocRef, { totalBeds: initialTotalBeds });
        }

        await batch.commit();

        return { success: true, message: "Account created successfully. You can now log in." };
    } catch (error: any) {
        console.error("Error creating user:", error);
        throw new Error(error.message || "An unexpected error occurred during signup.");
    }
}
