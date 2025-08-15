"use client";
import { useState } from "react";
import { FaBars } from "react-icons/fa";
import Sidebar from "./Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full relative bg-red-500">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        // Debug background for sidebar container (optional)
        // style={{ backgroundColor: 'rgba(0,255,0,0.3)' }}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col bg-yellow-200">
        {/* Mobile top bar */}
        <div className="p-4 bg-blue-300 shadow-md lg:hidden flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="text-gray-700 text-2xl"
          >
            <FaBars />
          </button>
          <h1 className="ml-4 font-bold text-lg">Admin Dashboard</h1>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden  bg-red-200">{children}</main>
      </div>
    </div>
  );
}
