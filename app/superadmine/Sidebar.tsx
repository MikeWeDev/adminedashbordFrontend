import Link from 'next/link';
import { FaUser, FaMoneyBillWave, FaGamepad, FaSignOutAlt, FaThLarge, FaTimes } from 'react-icons/fa';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const sidebarLinks = [
  { category: "Dashboard", icon: <FaThLarge />, href: "/superadmine" },
  { category: "User & Account Management", icon: <FaUser />, href: "/superadmine/userMangment" },
  { category: "Transaction & Financial Management", icon: <FaMoneyBillWave />, href: "/superadmine/transcations" },
  { category: "Game Monitoring & Control", icon: <FaGamepad />, href: "/superadmine" },
  { category: "Logout", icon: <FaSignOutAlt />, href: "/auth/login" },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-gradient-to-br from-gray-900 to-gray-700 text-gray-100 flex flex-col shadow-2xl z-40 transform transition-transform duration-300
          w-3/4 lg:w-64
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0  lg:flex`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-20 bg-gray-950 border-b border-gray-700 px-4">
          <span className="text-3xl font-extrabold text-indigo-400 drop-shadow-lg tracking-wide">
            SuperAdmin Panel
          </span>
          {/* Close button for mobile */}
          <button className="lg:hidden text-gray-300 text-xl" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <ul>
            {sidebarLinks.map((section, index) => (
              <li key={index} className="mb-2">
                <Link
                  href={section.href}
                  onClick={onClose} // closes sidebar when a link is clicked (mobile)
                  className="flex items-center p-3 rounded-lg transition-all duration-300 ease-in-out hover:bg-indigo-700 hover:text-white hover:shadow-lg hover:translate-x-1 text-gray-300"
                >
                  <span className="text-xl mr-3 text-indigo-300">{section.icon}</span>
                  <span className="text-base font-semibold">{section.category}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
