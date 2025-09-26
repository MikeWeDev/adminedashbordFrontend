"use client";
import { useState } from "react";
import { FaBars } from "react-icons/fa";
import Sidebar from "./Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full relative overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile top bar */}
        <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg lg:hidden flex items-center rounded-b-2xl">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="text-white text-2xl hover:scale-110 transition-transform"
          >
            <FaBars />
          </button>
          <h1 className="ml-4 font-extrabold text-lg text-white tracking-wide">
            Admin Dashboard
          </h1>
        </div>

        {/* Main content */}
        <main className="flex-1 flex justify-start overflow-x-hidden bg-gray-100 lg:ml-64">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
