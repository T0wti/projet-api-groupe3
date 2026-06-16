import Sidebar from '@/components/layout/Sidebar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import RightSidebar from '@/components/layout/RightSidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto flex min-h-screen justify-center relative">
      <Sidebar />

      <main className="flex-1 w-full sm:max-w-150 pb-20 md:pb-0">
        {children}
      </main>

      <RightSidebar />
      <MobileBottomNav />
    </div>
  );
}