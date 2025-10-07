"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Hospital } from 'lucide-react';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { UserNav } from './UserNav';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface DashboardPageProps {
  children: React.ReactNode;
  navItems: NavItem[];
}

export function DashboardPage({ children, navItems }: DashboardPageProps) {
  const pathname = usePathname();
  const { userProfile, logout, loading } = useAuth();

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
            <Link href="/" className="flex items-center gap-2">
                <Hospital className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold group-data-[collapsible=icon]:hidden">MEDALLOC</span>
            </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton isActive={pathname === item.href} tooltip={item.label}>
                    {item.icon}
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            {loading ? (
               <Skeleton className="h-10 w-10 rounded-full" />
            ) : (
                <Avatar>
                    <AvatarImage src={`https://avatar.vercel.sh/${userProfile?.email}.png`} alt={userProfile?.name || 'User'} />
                    <AvatarFallback>{getInitials(userProfile?.name)}</AvatarFallback>
                </Avatar>
            )}
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="font-medium text-sm truncate">{userProfile?.name}</span>
                <span className="text-xs text-muted-foreground truncate">{userProfile?.email}</span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 items-center justify-between border-b px-6">
          <div className="flex items-center gap-4">
             <SidebarTrigger className="md:hidden"/>
             <h1 className="text-lg font-semibold">{navItems.find(item => item.href === pathname)?.label || 'Dashboard'}</h1>
          </div>
          <UserNav />
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
