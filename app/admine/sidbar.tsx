import Link from 'next/link';
// Make sure you have react-icons installed: npm install react-icons
import { FaUser, FaMoneyBillWave, FaGamepad, FaChartBar, FaThLarge } from 'react-icons/fa';
import { useRouter } from 'next/router'; // For dynamic active state (not fully implemented here, but good practice)

const sidebarLinks = [
  {
    category: "Dashboard",
    icon: <FaThLarge />,
    items: [
      { name: "Overview", href: "/" }, // Link to the dashboard home
    ],
  },
  {
    category: "User & Account Management",
    icon: <FaUser />,
    items: [
      { name: "User Profiles", href: "/users" },
      // Other user-related features could go here later
    ],
  },
  {
    category: "Transaction & Financial Management",
    icon: <FaMoneyBillWave />,
    items: [
      { name: "Revenue Reporting", href: "/transactions/revenue" },
      { name: "Transaction History", href: "/transactions/history" },
      { name: "Withdrawal Approval", href: "/transactions/withdrawals" },
    ],
  },
  {
    category: "Game Monitoring & Control",
    icon: <FaGamepad />,
    items: [
      { name: "Live Game Monitoring", href: "/games/live" },
    ],
  },
  {
    category: "Analytics & Dispute Resolution",
    icon: <FaChartBar />,
    items: [
      { name: "Player Analytics", href: "/analytics/players" },
      { name: "Disputes & Support", href: "/analytics/disputes" },
    ],
  },
];

const Sidebar = () => {
  // const router = useRouter(); // Uncomment this line if you implement active state logic

  return (
    <aside className="h-screen w-64 bg-gray-800 text-gray-100 flex flex-col shadow-lg">
      {/* Dashboard Header */}
      <div className="flex items-center justify-center h-20 bg-gray-900 border-b border-gray-700">
        <span className="text-2xl font-extrabold text-indigo-400">Admin Panel</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <ul>
          {sidebarLinks.map((section, sectionIndex) => (
            <li key={sectionIndex} className="mb-6 last:mb-0">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                {section.icon}
                {section.category}
              </h3>
              <ul>
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="mb-1">
                    <Link
                      href={item.href}
                      // You'd typically use router.pathname === item.href for active state
                      className={`flex items-center p-2 rounded-lg transition-all duration-200 
                                  hover:bg-indigo-600 hover:text-white 
                                  ${false /* router.pathname === item.href ? 'bg-indigo-700 text-white shadow-md' : 'text-gray-300' */}
                                  group`}
                    >
                      <span className="ml-0 text-sm font-medium">{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer or User Info */}
      <div className="p-4 border-t border-gray-700 flex items-center justify-between text-sm text-gray-400">
        <span>© 2024 Admin Panel</span>
        {/* Add user menu or logout here later */}
      </div>
    </aside>
  );
};

export default Sidebar;