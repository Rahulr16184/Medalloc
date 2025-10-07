import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Clock, Users } from 'lucide-react';

const features = [
  {
    icon: <Clock className="h-10 w-10 text-primary" />,
    title: 'Real-Time Availability',
    description: 'Instantly view and update bed status across all registered hospitals. No more phone calls, no more delays.',
  },
  {
    icon: <BarChart className="h-10 w-10 text-primary" />,
    title: 'AI-Powered Forecasting',
    description: 'Leverage our GenAI model to predict future bed demand, helping you optimize resource allocation and planning.',
  },
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    title: 'Role-Based Dashboards',
    description: 'Customized views for administrators, hospital staff, and patients, ensuring everyone sees what they need.',
  },
];

export function Features() {
  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-card">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Key Features</div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
              Everything You Need to Manage Hospital Beds
            </h2>
            <p className="max-w-[900px] text-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Our platform is designed to be powerful yet intuitive, providing a comprehensive solution for a critical healthcare challenge.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
          {features.map((feature, index) => (
            <Card key={index} className="text-center">
              <CardHeader>
                <div className="mx-auto flex items-center justify-center">{feature.icon}</div>
                <CardTitle className="mt-4">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
