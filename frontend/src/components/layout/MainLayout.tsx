import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomDrawer } from '@/components/drawer/BottomDrawer';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <Header onMenuClick={() => setIsSidebarOpen(true)} />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Content + Drawer */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Main content */}
          <main className="flex-1 overflow-hidden">{children}</main>

          {/* Bottom Drawer for technical details */}
          <BottomDrawer />
        </div>
      </div>
    </div>
  );
}
