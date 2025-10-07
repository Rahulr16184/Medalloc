import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { LayoutDashboard, BarChart3, BedDouble } from 'lucide-react';

const navItems = [
    { href: "/hospital", label: "My Hospital", icon: <LayoutDashboard /> },
    { href: "/hospital/beds", label: "Bed Management", icon: <BedDouble /> },
    { href: "/hospital/forecasting", label: "Demand Forecasting", icon: <BarChart3 /> },
];

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
    return <DashboardPage navItems={navItems}>{children}</DashboardPage>;
}
