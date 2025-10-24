import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import placeholderData from '@/lib/placeholder-images.json';

export function Hero() {
  const heroImage = placeholderData.placeholderImages.find(img => img.id === 'hero-image');

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 relative">
       {heroImage && (
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          data-ai-hint={heroImage.imageHint}
          fill
          className="object-cover object-center opacity-20"
        />
      )}
      <div className="container px-4 md:px-6 text-center relative">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none font-headline">
            Intelligent Bed Management, Simplified
          </h1>
          <p className="mx-auto max-w-[700px] text-foreground/80 md:text-xl">
            MEDALLOC provides real-time bed availability, AI-powered demand forecasting, and streamlined allocation for healthcare facilities.
          </p>
        </div>
        <div className="mt-6">
          <Button asChild size="lg">
            <Link href="/hospital" prefetch={false}>
              Go to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
