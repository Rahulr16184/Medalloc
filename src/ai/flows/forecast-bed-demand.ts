
'use server';
/**
 * @fileOverview A Genkit flow for forecasting hospital bed demand.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the input schema for the forecast flow
export const ForecastBedDemandInputSchema = z.object({
  historicalData: z.string().describe("A comma-separated string of historical daily bed occupancy numbers."),
});
export type ForecastBedDemandInput = z.infer<typeof ForecastBedDemandInputSchema>;

// Define the output schema for the forecast flow
const ForecastBedDemandOutputSchema = z.object({
  predictedDemand: z.array(z.number()).describe("The list of predicted bed demands for the next 7 days."),
  confidenceInterval: z.object({
    lowerBound: z.array(z.number()),
    upperBound: z.array(z.number()),
  }).describe("The lower and upper bounds of the confidence interval for the prediction.")
});
export type ForecastBedDemandOutput = z.infer<typeof ForecastBedDemandOutputSchema>;

// Define the prompt for the AI model
const forecastPrompt = ai.definePrompt({
  name: 'bedDemandForecastPrompt',
  input: { schema: ForecastBedDemandInputSchema },
  output: { schema: ForecastBedDemandOutputSchema },
  prompt: `You are a data scientist specializing in time series forecasting for healthcare.
  Your task is to predict hospital bed demand for the next 7 days based on the provided historical data.
  The historical data represents daily bed occupancy.
  Analyze the trend and seasonality from the data: {{{historicalData}}}.
  Provide the 7-day forecast and a 95% confidence interval for your prediction.
  The output must be in the specified JSON format.
  `,
});

// Define the main flow
export const forecastBedDemand = ai.defineFlow(
  {
    name: 'forecastBedDemand',
    inputSchema: ForecastBedDemandInputSchema,
    outputSchema: ForecastBedDemandOutputSchema,
  },
  async (input) => {
    const { output } = await forecastPrompt(input);
    if (!output) {
      throw new Error('The model did not return a valid forecast.');
    }
    return output;
  }
);
