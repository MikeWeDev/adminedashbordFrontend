import React from 'react';

/**
 * Interface defining the structure of a single User document.
 * This should match your backend User schema.
 */
interface User {
  _id: string; // MongoDB document ID
  telegramId: number;
  username: string;
  accountNumber: number;
  phoneNumber: string;
  balance: number;
  registeredAt: string; // Date string from backend
}

/**
 * Props for the UserTable component.
 */
interface UserTableProps {
  users: User[]; // Array of user objects to display
  currentPage: number; // Current page number for pagination
  itemsPerPage: number; // Number of items displayed per page (kept in interface for prop consistency)
  totalUsers: number; // Total count of users in the database
  totalPages: number; // Total number of pages
  onPageChange: (page: number) => void; // Callback function for page change
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void; // Callback for sorting
  currentSortBy: string; // Currently active sort field
  currentSortOrder: 'asc' | 'desc'; // Currently active sort order
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  currentPage,
  // ⭐ FIX: Removed itemsPerPage from destructuring as it's not used in this component's logic/rendering.
  // It remains in the interface because the parent component passes it.
  totalUsers,
  totalPages,
  onPageChange,
  onSortChange,
  currentSortBy,
  currentSortOrder,
}) => {

  // Function to handle sort click
  const handleSortClick = (field: string) => {
    // If clicking on the same field, toggle sort order
    if (currentSortBy === field) {
      onSortChange(field, currentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking on a new field, default to ascending
      onSortChange(field, 'asc');
    }
  };

  // Helper to render sort icon
  const renderSortIcon = (field: string) => {
    if (currentSortBy === field) {
      return currentSortOrder === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8">
      <h3 className="text-xl font-semibold mb-4">All Registered Users</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSortClick('username')}>
                Username {renderSortIcon('username')}
              </th>
              <th className="py-3 px-6 text-left">Telegram ID</th>
              <th className="py-3 px-6 text-left">Account Number</th>
              <th className="py-3 px-6 text-left">Phone Number</th>
              <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSortClick('balance')}>
                Balance {renderSortIcon('balance')}
              </th>
              <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSortClick('registeredAt')}>
                Registered At {renderSortIcon('registeredAt')}
              </th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6 text-left whitespace-nowrap">{user.username}</td>
                  <td className="py-3 px-6 text-left">{user.telegramId}</td>
                  <td className="py-3 px-6 text-left">{user.accountNumber}</td>
                  <td className="py-3 px-6 text-left">{user.phoneNumber}</td>
                  <td className="py-3 px-6 text-left">{user.balance.toLocaleString()} Birr</td>
                  <td className="py-3 px-6 text-left whitespace-nowrap">
                    {new Date(user.registeredAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-500">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalUsers > 0 && (
        <div className="flex justify-between items-center mt-6 p-3 bg-gray-50 rounded-lg">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-gray-700">
            Page {currentPage} of {totalPages} ({totalUsers} users)
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};