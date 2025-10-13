import { MainHeader } from '@/components/headers/MainHeader';
import { ServerHeader } from '@/components/headers/ServerHeader';

export default function ServerLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen w-full flex-col">
            <MainHeader />
             <div className="flex flex-1">
                <div className="flex flex-col w-full">
                    <ServerHeader />
                    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
