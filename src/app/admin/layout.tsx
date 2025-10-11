import { AdminHeader } from '@/components/headers/AdminHeader';
import { MainHeader } from '@/components/headers/MainHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen w-full flex-col">
            <MainHeader />
            <AdminHeader />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                {children}
            </main>
        </div>
    );
}
