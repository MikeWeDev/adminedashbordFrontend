'use client';
import Link from 'next/link';
import { FaUser, FaMoneyBillWave, FaGamepad, FaSignOutAlt, FaThLarge, FaTimes, FaUserShield, FaCog, FaBullhorn } from 'react-icons/fa';
import { FaMoneyBillTransfer } from 'react-icons/fa6';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const sidebarLinks = [
  {
    category: "Main",
    links: [
      { name: "Dashboard", icon: <FaThLarge />, href: "/superadmine" },
      { name: "Announcements", icon: <FaBullhorn />, href: "/superadmine/anounce" },
    ]
  },
  {
    category: "Management",
    links: [
      { name: "User & Accounts", icon: <FaUser />, href: "/superadmine/userMangment" },
      { name: "Admins", icon: <FaUserShield />, href: "/superadmine/admine" },
    ]
  },
  {
    category: "Financials",
    links: [
      { name: "Transactions", icon: <FaMoneyBillWave />, href: "/superadmine/transcations" },
      { name: "Withdrawals", icon: <FaMoneyBillTransfer />, href: "/superadmine/withdraw" },
    ]
  },
  {
    category: "Game Control",
    links: [
      { name: "Financial Settings", icon: <FaCog />, href: "/superadmine/gameControl/finance" },
      { name: "Game Management", icon: <FaGamepad />, href: "/superadmine/gameControl/game" },
    ]
  },
  {
    category: "Other",
    links: [
      { name: "Logout", icon: <FaSignOutAlt />, href: "/auth/login" },
    ]
  }
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-gradient-to-br from-gray-900 to-gray-700 text-gray-100 flex flex-col shadow-2xl z-40 transform transition-transform duration-300 w-3/4 lg:w-64 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:flex`}
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
          {sidebarLinks.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-6 last:mb-0">
              <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2 ml-3 tracking-wider">
                {group.category}
              </h3>
              <ul>
                {group.links.map((link, linkIndex) => (
                  <li key={linkIndex} className="mb-2">
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className="flex items-center p-3 rounded-lg transition-all duration-300 ease-in-out hover:bg-indigo-700 hover:text-white hover:shadow-lg hover:translate-x-1 text-gray-300"
                    >
                      <span className="text-xl mr-3 text-indigo-300">{link.icon}</span>
                      <span className="text-base font-semibold">{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}