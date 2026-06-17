import Sidebar from '@/components/layout/Sidebar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import RightSidebar from '@/components/layout/RightSidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto flex min-h-screen">
      <Sidebar />

      <main className="flex-1 min-w-0 border-x border-gray-200 pb-20 md:pb-0">
        {children}
      </main>

      <RightSidebar />
      <MobileBottomNav />
    </div>
  );
}