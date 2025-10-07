import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Hospital } from 'lucide-react';

export function LandingHeader() {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <Link href="#" className="flex items-center justify-center" prefetch={false}>
        <Hospital className="h-6 w-6 text-primary" />
        <span className="ml-2 text-xl font-bold">MEDALLOC</span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6">
        <Button asChild variant="ghost">
          <Link href="/login" prefetch={false}>
            Login
          </Link>
        </Button>
        <Button asChild>
          <Link href="/signup" prefetch={false}>
            Sign Up
          </Link>
        </Button>
      </nav>
    </header>
  );
}
