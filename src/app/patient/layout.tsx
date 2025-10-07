import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { LayoutDashboard, Search } from 'lucide-react';

const navItems = [
    { href: "/patient", label: "Find Hospitals", icon: <Search /> },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
    return <DashboardPage navItems={navItems}>{children}</DashboardPage>;
}
