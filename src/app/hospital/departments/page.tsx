
import { DepartmentManagement } from "@/components/hospital/DepartmentManagement";

export default function DepartmentsPage() {
  return (
    <div className="space-y-6">
       <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Manage Departments & Beds</h1>
          <p className="text-muted-foreground max-w-2xl">
              Add new departments from a list of templates or manage beds for your existing departments.
          </p>
      </div>
      <DepartmentManagement />
    </div>
  );
}
