
"use client"

import Link from "next/link"
import { Hospital } from 'lucide-react';
import { UserNav } from "../dashboard/UserNav";
import { ModeToggle } from "../ModeToggle";

export function MainHeader() {
    return (
        <header className="sticky top-0 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6 z-40">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
                <Hospital className="h-6 w-6 text-primary" />
                <span className="font-bold">MEDALLOC</span>
            </Link>
            <div className="flex items-center gap-2">
                <ModeToggle />
                <UserNav />
            </div>
        </header>
    )
}
