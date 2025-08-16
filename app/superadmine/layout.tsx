/*'use client';
import { useState } from 'react';
import Sidebar from './Sidebar'
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
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <div className="flex-1 flex flex-col">
        <div className="lg:hidden flex items-center justify-between p-4 bg-gray-100 border-b border-gray-200">
          <button
            onClick={toggleSidebar}
            className="text-gray-800 text-2xl p-2 rounded-md hover:bg-gray-200 transition"
          >
            <FaBars />
          </button>
          <span className="font-semibold text-lg">SuperAdmin Panel</span>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 lg:ml-64">
          {children}
        </main>
      </div>
    </div>
  );
}*/
//tommrow if we do the super admine responsivness the stes will be
//1.make the layout.tsx like the admine one perefctley match the styele
//2.make make teh main tag on the main page like the admine one
//3.create new layout structure to match like the transaction page
//4.make the card widht small for the phone
//apply every ui code to it finally

"use client";
import { useState } from "react";
import { FaBars } from "react-icons/fa";
import Sidebar from './Sidebar'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full relative  overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col ">
        {/* Mobile top bar */}
        <div className="p-4 bg-blue-300 shadow-md lg:hidden flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="text-gray-700 text-2xl"
          >
            <FaBars />
          </button>
          <h1 className="ml-4 font-bold text-lg">Super Admin Dashboard</h1>
        </div>

        {/* Main content */}
        <main className="flex-1 flex justify-start overflow-x-hidden bg-gray-100 ">
          {/* Inner wrapper controlling width */}
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
