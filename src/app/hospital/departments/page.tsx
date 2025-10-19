
import { DepartmentManagement } from "@/components/hospital/DepartmentManagement";

export default function DepartmentsPage() {
  return (
    <div className="space-y-6">
       <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Manage Departments</h1>
          <p className="text-muted-foreground max-w-2xl">
              Add, view, and manage your hospital's medical departments and wards.
          </p>
      </div>
      <DepartmentManagement />
    </div>
  );
}
