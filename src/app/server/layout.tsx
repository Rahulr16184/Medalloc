import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { LayoutDashboard, Server as ServerIcon } from 'lucide-react';

const navItems = [
    { href: "/server", label: "Dashboard", icon: <LayoutDashboard /> },
];

export default function ServerLayout({ children }: { children: React.ReactNode }) {
    return <DashboardPage navItems={navItems}>{children}</DashboardPage>;
}
