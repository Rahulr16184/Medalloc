import { BedForecast } from "@/components/hospital/BedForecast";

export default function ForecastingPage() {
  return (
    <div className="space-y-6">
       <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Bed Demand Forecasting</h1>
          <p className="text-muted-foreground max-w-2xl">
              Use our AI-powered tool to predict bed demand for the next 7 days. Input your historical daily occupancy data to generate a forecast.
          </p>
      </div>
      <BedForecast />
    </div>
  );
}
