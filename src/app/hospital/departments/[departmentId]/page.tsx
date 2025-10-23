
import { BedsManagement } from "@/components/hospital/BedsManagement";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function Page({ params }: { params: { departmentId: string } }) {
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
