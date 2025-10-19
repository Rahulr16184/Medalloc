
import { BedManagement } from "@/components/hospital/BedManagement";

export default function BedManagementPage() {
  return (
    <div className="space-y-6">
       <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Overall Bed Status</h1>
          <p className="text-muted-foreground max-w-2xl">
              Get a real-time visual overview of bed status across all your departments. Click a bed to quickly update its status.
          </p>
      </div>
      <BedManagement />
    </div>
  );
}
