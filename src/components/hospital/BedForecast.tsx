"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { format, addDays } from 'date-fns';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { forecastBedDemandServer } from './actions';
import { Loader2, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';

const formSchema = z.object({
  historicalData: z.string().min(1, { message: 'Historical data is required.' })
    .refine(data => /^\d+(,\s*\d+)*$/.test(data), {
      message: 'Data must be a comma-separated list of numbers (e.g., 10, 20, 30).'
    }),
});

type ForecastData = {
    date: string;
    demand: number;
};

export function BedForecast() {
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<ForecastData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { historicalData: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setForecast(null);
    setError(null);
    try {
      const result = await forecastBedDemandServer(values);
      if (result && result.predictedDemand) {
        const today = new Date();
        const forecastData = result.predictedDemand.map((demand, i) => ({
            date: format(addDays(today, i + 1), 'EEE, MMM d'),
            demand: Math.round(demand),
        }));
        setForecast(forecastData);
        toast({
            title: 'Forecast Generated',
            description: 'The bed demand forecast for the next 7 days is ready.',
        });
      } else {
        throw new Error('Invalid forecast response from the server.');
      }
    } catch (err: any) {
        setError(err.message || 'An unexpected error occurred while generating the forecast.');
        toast({
            variant: 'destructive',
            title: 'Forecast Failed',
            description: err.message || 'Could not generate forecast.',
        });
    } finally {
      setLoading(false);
    }
  }

  const chartConfig = {
    demand: {
      label: "Predicted Demand",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Generate Forecast</CardTitle>
          <CardDescription>
            Enter comma-separated daily bed occupancy numbers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="historicalData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Historical Bed Occupancy</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 152, 160, 155, 168, 172"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                 {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Forecast
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>7-Day Bed Demand Forecast</CardTitle>
          <CardDescription>Predicted number of beds needed per day.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex h-[300px] w-full items-center justify-center">
                 <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && (
             <Alert variant="destructive" className="h-[300px]">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!loading && !forecast && !error && (
            <div className="flex h-[300px] flex-col items-center justify-center text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mb-4" />
                <p>Your forecast will appear here.</p>
                <p className="text-sm">Enter data and click "Generate Forecast" to begin.</p>
            </div>
          )}
          {forecast && (
             <div className="h-[300px]">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={forecast} margin={{ top: 20, right: 20, bottom: 20, left: -10 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
                            <YAxis tickLine={false} axisLine={false} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="demand" fill="var(--color-demand)" radius={4} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
