'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FaUser,
  FaMoneyBillWave,
  FaGamepad,
  FaSignOutAlt,
  FaThLarge,
  FaTimes,
  FaUserShield,
  FaGift,
  FaBullhorn
} from 'react-icons/fa';
import { FaMoneyBillTransfer } from 'react-icons/fa6';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const sidebarLinks = [
  {
    category: 'Main',
    links: [
      { name: 'Dashboard', icon: <FaThLarge />, href: '/superadmine' },
      { name: 'Announcements', icon: <FaBullhorn />, href: '/superadmine/anounce' },
      { name: 'Bonus system', icon: <FaGift />, href: '/superadmine/bonus' }

    ]
  },
  {
    category: 'Management',
    links: [
      { name: 'User & Accounts', icon: <FaUser />, href: '/superadmine/userMangment' },
      { name: 'Admins', icon: <FaUserShield />, href: '/superadmine/admine' }
    ]
  },
  {
    category: 'Financials',
    links: [
      { name: 'Transactions', icon: <FaMoneyBillWave />, href: '/superadmine/transcations' },
      { name: 'Withdrawals', icon: <FaMoneyBillTransfer />, href: '/superadmine/withdraw' }
    ]
  },
  {
    category: 'Game Control',
    links: [
    //  { name: 'Financial Settings', icon: <FaCog />, href: '/superadmine/gameControl/finance' },
      { name: 'Game Management', icon: <FaGamepad />, href: '/superadmine/gameControl/game' }
    ]
  },
  {
    category: 'Other',
    links: [{ name: 'Logout', icon: <FaSignOutAlt />, href: '/auth/login' }]
  }
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      ></div>

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 flex flex-col shadow-2xl z-40 transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          w-2/3 sm:w-1/2 md:w-1/3 lg:w-64 lg:translate-x-0 lg:flex`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-20 px-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-950 shadow-md">
          <span className="text-xl md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 tracking-wider">
            SuperAdmin
          </span>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-300 text-xl md:text-2xl p-2 rounded-full hover:text-indigo-400 hover:bg-gray-800 transition-colors duration-300 shadow-sm"
            aria-label="Close sidebar"
          >
            <FaTimes />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {sidebarLinks.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-6 last:mb-0">
              <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2 ml-3 tracking-wider">
                {group.category}
              </h3>
              <ul>
                {group.links.map((link, linkIndex) => {
                  const isActive = pathname === link.href;
                  return (
                    <li key={linkIndex} className="mb-2">
                      <Link
                        href={link.href}
                        onClick={onClose}
                        className={`flex items-center p-3 rounded-xl transition-all duration-300 ease-in-out 
                          ${isActive ? 'bg-indigo-700 text-white shadow-lg' : 'text-gray-300 hover:bg-indigo-700 hover:text-white hover:shadow-md hover:translate-x-1'}
                        `}
                      >
                        <span className={`text-xl mr-3 transition-colors ${isActive ? 'text-white' : 'text-indigo-300'}`}>
                          {link.icon}
                        </span>
                        <span className="text-base font-semibold truncate">{link.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 text-gray-400 text-sm text-center">
          &copy; {new Date().getFullYear()} Bingo Game Admin
        </div>
      </aside>

      {/* Custom scrollbar */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </>
  );
}
