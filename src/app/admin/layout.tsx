import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { LayoutDashboard, CheckCheck, Building2 } from 'lucide-react';

const navItems = [
    { href: "/admin", label: "Dashboard", icon: <LayoutDashboard /> },
    { href: "/admin/approvals", label: "Approvals", icon: <CheckCheck /> },
    { href: "/admin/hospitals", label: "All Hospitals", icon: <Building2 /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <DashboardPage navItems={navItems}>{children}</DashboardPage>;
}
