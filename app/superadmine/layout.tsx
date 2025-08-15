'use client';
import { useState } from 'react';
import Sidebar from './Sidbar'
import { FaBars } from 'react-icons/fa';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Hamburger */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-gray-100 border-b border-gray-200">
          <button
            onClick={toggleSidebar}
            className="text-gray-800 text-2xl p-2 rounded-md hover:bg-gray-200 transition"
          >
            <FaBars />
          </button>
          <span className="font-semibold text-lg">SuperAdmin Panel</span>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 lg:ml-64">
          {children}
        </main>
      </div>
    </div>
  );
}
