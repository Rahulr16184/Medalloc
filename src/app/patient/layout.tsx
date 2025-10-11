import { PatientHeader } from '@/components/headers/PatientHeader';
import { MainHeader } from '@/components/headers/MainHeader';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen w-full flex-col">
            <MainHeader />
            <PatientHeader />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                {children}
            </main>
        </div>
    );
}
