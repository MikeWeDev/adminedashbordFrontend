'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaUser, FaMoneyBillWave, FaGamepad, FaSignOutAlt, FaThLarge, FaTimes, FaCaretDown, FaCaretUp,FaUserShield } from 'react-icons/fa';
import { FaMoneyBillTransfer } from 'react-icons/fa6';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const sidebarLinks = [
  { category: "Dashboard", icon: <FaThLarge />, href: "/superadmine" },
  { category: "User & Account Management", icon: <FaUser />, href: "/superadmine/userMangment" },
  { category: "Transaction & Financial Management", icon: <FaMoneyBillWave />, href: "/superadmine/transcations" },
  { category: "Admin", icon: <FaUserShield />, href: "/superadmine/admine" },
  { category: "withdraw", icon: <FaMoneyBillTransfer />, href: "/superadmine/withdraw" },
  {
    category: "Game Monitoring",
    icon: <FaGamepad />,
    href: "#",
    dropdown: [
      { subCategory: "Financial Change", href: "/superadmine/gameControl/finance" },
      { subCategory: "Game", href: "/superadmine/gameControl/game" },
    ],
  },
  { category: "Logout", icon: <FaSignOutAlt />, href: "/auth/login" }

];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleDropdownToggle = (category: string) => {
    setOpenDropdown(openDropdown === category ? null : category);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-gradient-to-br from-gray-900 to-gray-700 text-gray-100 flex flex-col shadow-2xl z-40 transform transition-transform duration-300
          w-3/4 lg:w-64
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:flex`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-20 bg-gray-950 border-b border-gray-700 px-4">
          <span className="text-3xl font-extrabold text-indigo-400 drop-shadow-lg tracking-wide">
            SuperAdmin
          </span>
          <button className="lg:hidden text-gray-300 text-xl" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <ul>
            {sidebarLinks.map((section, index) => (
              <li key={index} className="mb-2">
                {section.dropdown ? (
                  <>
                    {/* Dropdown button */}
                    <button
                      onClick={() => handleDropdownToggle(section.category)}
                      className="flex items-center justify-between w-full p-3 rounded-lg transition-all duration-300 ease-in-out hover:bg-indigo-700 hover:text-white hover:shadow-lg text-gray-300"
                    >
                      <div className="flex items-center">
                        <span className="text-xl mr-3 text-indigo-300">{section.icon}</span>
                        <span className="text-base font-semibold">{section.category}</span>
                      </div>
                      <span className="ml-2 text-sm transition-transform duration-300">
                        {openDropdown === section.category ? <FaCaretUp /> : <FaCaretDown />}
                      </span>
                    </button>

                    {/* Dropdown content */}
                    <div
                      className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
                        openDropdown === section.category ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <ul className="pl-8 mt-2 flex flex-col gap-2">
                        {section.dropdown.map((item, subIndex) => (
                          <li key={subIndex}>
                            <Link
                              href={item.href}
                              onClick={onClose}
                              className="flex items-center px-4 py-2 rounded-full bg-gray-800 hover:bg-indigo-600 hover:text-white text-gray-300 text-sm font-medium shadow-sm transform transition-all duration-200 hover:scale-105"
                            >
                              <span>{item.subCategory}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <Link
                    href={section.href}
                    onClick={onClose}
                    className="flex items-center p-3 rounded-lg transition-all duration-300 ease-in-out hover:bg-indigo-700 hover:text-white hover:shadow-lg hover:translate-x-1 text-gray-300"
                  >
                    <span className="text-xl mr-3 text-indigo-300">{section.icon}</span>
                    <span className="text-base font-semibold">{section.category}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
