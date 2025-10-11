
"use client";

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search } from 'lucide-react';
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/patient", label: "Find Hospitals", icon: <Search className="h-4 w-4" /> },
];

export function PatientHeader() {
    const pathname = usePathname();
    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <ScrollArea className="w-full whitespace-nowrap">
                <nav className="flex items-center gap-2 text-sm font-medium">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-2 rounded-lg px-3 py-2 transition-all hover:bg-muted hover:text-foreground",
                                pathname === item.href ? "bg-accent text-accent-foreground" : "text-foreground"
                            )}
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </header>
    )
}
