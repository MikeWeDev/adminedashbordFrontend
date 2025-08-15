"use client";
import { useState } from "react";
import { FaBars } from "react-icons/fa";
import Sidebar from "./Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
          <h1 className="ml-4 font-bold text-lg">Admin Dashboard</h1>
        </div>

        {/* Main content */}
        <main className="flex-1 flex justify-start overflow-x-hidden ">
          {/* Inner wrapper controlling width */}
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
