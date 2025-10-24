import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Hospital } from 'lucide-react';
import { ModeToggle } from '../ModeToggle';

export function LandingHeader() {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <Link href="#" className="flex items-center justify-center" prefetch={false}>
        <Hospital className="h-6 w-6 text-primary" />
        <span className="ml-2 text-xl font-bold">MEDALLOC</span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
        <Button asChild>
          <Link href="/hospital" prefetch={false}>
            Dashboard
          </Link>
        </Button>
        <ModeToggle />
      </nav>
    </header>
  );
}
