import Link from 'next/link';
import { FaUser, FaMoneyBillWave, FaGamepad, FaSignOutAlt, FaThLarge } from 'react-icons/fa';
// If you need to implement active link states based on the current path,
// uncomment the line below and the relevant 'className' logic inside the Link component.
// import { useRouter } from 'next/router'; // For Next.js App Router, use 'next/navigation' for `usePathname`

// Defines the structure and content for each main category in the sidebar.
// Each category now directly acts as a link, as per your updated requirement.
const sidebarLinks = [
  {
    category: "Dashboard",
    icon: <FaThLarge />,
    href: "/superadmine" // Direct link for the category
  },
  {
    category: "User & Account Management",
    icon: <FaUser />,
    href: "/superadmine/userMangment" // Example href
  },
  {
    category: "Transaction & Financial Management",
    icon: <FaMoneyBillWave />,
    href: "/superadmine/transcations" // Example href
  },
  {
    category: "Game Monitoring & Control",
    icon: <FaGamepad />,
    href: "/superadmine" // Example href
  },
  /* {
    category: "Game Monitoring & Control",
    icon: <FaGamepad />,
    href: "/" // Example href
  }
*/
 {
    category: "Logout",
    icon: <FaSignOutAlt />, // ⭐ Used FaSignOutAlt icon
    href: "/auth/login" // ⭐ Changed href to a logout specific path
  }

];

const Sidebar = () => {
  // If implementing active state (e.g., highlighting the current page's link):
  // const router = useRouter(); // For Pages Router
  // const pathname = usePathname(); // For App Router

  return (
    // The `fixed` class makes the sidebar sticky.
    // `h-screen` makes it take up the full viewport height.
    // `overflow-y-auto` enables scrolling within the sidebar if content exceeds height.
    // The `bg-gradient-to-br from-gray-900 to-gray-700` provides a modern dark gradient.
    <aside className="fixed top-0 left-0 h-screen w-64 bg-gradient-to-br from-gray-900 to-gray-700 text-gray-100 flex flex-col shadow-2xl z-40">
      {/* Dashboard Header/Logo Section */}
      <div className="flex items-center justify-center h-20 bg-gray-950 border-b border-gray-700 px-4">
        {/* The 'Admin Panel' text serving as the primary identifier */}
        <span className="text-3xl font-extrabold text-indigo-400 drop-shadow-lg tracking-wide">
          SuperAdmin Panel
        </span>
      </div>

      {/* Navigation Links Section */}
      {/* flex-1 ensures this section takes up available space, allowing scrolling if needed */}
      <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <ul>
          {sidebarLinks.map((section, index) => (
            // Each list item is now a direct link to the category.
            // Using Link for navigation, with dynamic styling for hover and (optional) active states.
            <li key={index} className="mb-2">
              <Link
                href={section.href}
                // Tailwind classes for styling:
                // - flex items-center: Aligns icon and text horizontally
                // - p-3 rounded-lg: Padding and rounded corners for a button-like feel
                // - transition-all duration-300: Smooth transitions for hover effects
                // - hover:bg-indigo-700 hover:shadow-lg hover:translate-x-1: Interactive hover effects
                // - active class (commented): For dynamic highlighting of the current page
                className={`flex items-center p-3 rounded-lg transition-all duration-300 ease-in-out
                            hover:bg-indigo-700 hover:text-white hover:shadow-lg hover:translate-x-1
                            ${
                              // Example for active link (requires uncommenting useRouter/usePathname above)
                              // pathname === section.href
                              //   ? 'bg-indigo-700 text-white shadow-md'
                              //   : 'text-gray-300'
                              'text-gray-300' // Default state if active logic is not used
                            }`}
              >
                {/* Icon for the category */}
                <span className="text-xl mr-3 text-indigo-300 transition-colors duration-300 group-hover:text-white">
                  {section.icon}
                </span>
                {/* Category name */}
                <span className="text-base font-semibold">{section.category}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* No Footer: Removed as per your request. */}
    </aside>
  );
};

export default Sidebar;