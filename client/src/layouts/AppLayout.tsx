import { ReactNode, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNavbar } from "@/components/dashboard/MobileNavbar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Mobile Navigation */}
      <MobileNavbar />
      
      {/* Main Content */}
      <main className="flex-1 md:ml-64 relative pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}
