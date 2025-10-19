
import { BedsManagement } from "@/components/hospital/BedsManagement";
import { db } from "@/lib/firebase/firebase";
import { Department } from "@/types";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

async function getDepartment(hospitalId: string, departmentId: string) {
    const departmentRef = doc(db, "hospitals", hospitalId, "departments", departmentId);
    const departmentSnap = await getDoc(departmentRef);

    if (departmentSnap.exists()) {
        return { id: departmentSnap.id, ...departmentSnap.data() } as Department;
    }
    return null;
}

// This is a server component, so we can fetch the department name on the server
export default async function BedManagementPage({ params }: { params: { departmentId: string } }) {
    // Note: In a real multi-tenant app, you'd get hospitalId from the authenticated user session.
    // For this example, we assume a single hospital or pass it differently.
    // Let's assume we can get it from the context or a server-side helper.
    // For now, this part of the logic is simplified.
    // const hospitalId = "some-hardcoded-hospital-id"; 
    // const department = await getDepartment(hospitalId, params.departmentId);

    return (
        <div className="space-y-6">
            <Link href="/hospital/departments" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Departments
            </Link>
            <BedsManagement departmentId={params.departmentId} />
        </div>
    );
}

