'use server';

/**
 * @fileOverview A bed demand forecasting ML model.
 *
 * - forecastBedDemand - A function that handles the bed demand forecasting process.
 * - ForecastBedDemandInput - The input type for the forecastBedDemand function.
 * - ForecastBedDemandOutput - The return type for the forecastBedDemand function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ForecastBedDemandInputSchema = z.object({
  historicalData: z
    .string()
    .describe(
      'Historical data of bed occupancy, as a comma-separated list of numbers. Each number represents the number of occupied beds for a specific day.'
    ),
});
export type ForecastBedDemandInput = z.infer<typeof ForecastBedDemandInputSchema>;

const ForecastBedDemandOutputSchema = z.object({
  predictedDemand: z
    .array(z.number())
    .length(7)
    .describe('An array of 7 numbers representing the predicted bed demand for the next 7 days.'),
});
export type ForecastBedDemandOutput = z.infer<typeof ForecastBedDemandOutputSchema>;

export async function forecastBedDemand(input: ForecastBedDemandInput): Promise<ForecastBedDemandOutput> {
  return forecastBedDemandFlow(input);
}

const prompt = ai.definePrompt({
  name: 'forecastBedDemandPrompt',
  input: {schema: ForecastBedDemandInputSchema},
  output: {schema: ForecastBedDemandOutputSchema},
  prompt: `You are a machine learning model for time series forecasting. Your task is to predict hospital bed demand.

You will be provided with historical data of bed occupancy. Using this data, you will forecast the bed demand for the next 7 days using a linear regression model.

Historical Data: {{{historicalData}}}

Output the predicted demand as a JSON array of 7 numbers.`,
});

const forecastBedDemandFlow = ai.defineFlow(
  {
    name: 'forecastBedDemandFlow',
    inputSchema: ForecastBedDemandInputSchema,
    outputSchema: ForecastBedDemandOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
