
import { BedManagement } from "@/components/hospital/BedManagement";

export default function BedManagementPage() {
  return (
    <div className="space-y-6">
       <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Bed Management</h1>
          <p className="text-muted-foreground max-w-2xl">
              Update your hospital's total and occupied bed counts in real-time.
          </p>
      </div>
      <BedManagement />
    </div>
  );
}
