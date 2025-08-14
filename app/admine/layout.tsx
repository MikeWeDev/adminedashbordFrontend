"use client";
import { useState } from "react";
import { FaBars } from "react-icons/fa";
import Sidebar from "./sidbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile top bar */}
        <div className="p-4 bg-white shadow-md lg:hidden flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="text-gray-700 text-2xl"
          >
            <FaBars />
          </button>
          <h1 className="ml-4 font-bold text-lg">Admin Dashboard</h1>
        </div>

        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
