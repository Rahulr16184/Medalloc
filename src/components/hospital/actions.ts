"use server";

import { forecastBedDemand, ForecastBedDemandInput } from "@/ai/flows/forecast-bed-demand";

export async function forecastBedDemandServer(input: ForecastBedDemandInput) {
  try {
    const result = await forecastBedDemand(input);
    return result;
  } catch (error) {
    console.error("Error in forecastBedDemandServer action:", error);
    throw new Error("Failed to generate forecast.");
  }
}
