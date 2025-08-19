import Link from 'next/link';
import { FaUser, FaMoneyBillWave, FaGamepad, FaSignOutAlt, FaThLarge, FaTimes } from 'react-icons/fa';

const sidebarLinks = [
  { category: "Dashboard", icon: <FaThLarge />, href: "/admine" },
  { category: "User & Account Management", icon: <FaUser />, href: "/admine/users" },
  { category: "Transaction & Financial Management", icon: <FaMoneyBillWave />, href: "/admine/transaction" },
  { category: "Game Monitoring & Control", icon: <FaGamepad />, href: "/admine/gameControl/game" },
  { category: "Logout", icon: <FaSignOutAlt />, href: "/auth/login" }
];

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <>
      {/* Overlay for mobile */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      ></div>

      {/* Sidebar container */}
  <aside
  className={`fixed top-0 left-0 h-screen bg-gradient-to-br from-gray-900 to-gray-700 text-gray-100 flex flex-col shadow-2xl z-40 transform transition-transform duration-300
    ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
    w-2/3 sm:w-1/2 md:w-1/3 lg:w-64 lg:translate-x-0 lg:static lg:flex`}
>


        {/* Header */}
        <div className="flex items-center justify-between h-20 bg-gray-950 border-b border-gray-700 px-4">
          <span className="text-2xl font-extrabold text-indigo-400">Admin Panel</span>
          {/* Close button for mobile */}
          <button onClick={onClose} className="lg:hidden text-gray-300 text-xl">
            <FaTimes />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <ul>
            {sidebarLinks.map((section, index) => (
              <li key={index} className="mb-2">
                <Link
                  href={section.href}
                  className="flex items-center p-3 rounded-lg transition-all duration-300 ease-in-out hover:bg-indigo-700 hover:text-white hover:shadow-lg hover:translate-x-1 text-gray-300"
                  onClick={onClose} // closes sidebar when a link is clicked (mobile)
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
