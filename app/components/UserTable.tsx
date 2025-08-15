import React from 'react';

interface User {
  _id: string;
  telegramId: number;
  username: string;
  accountNumber: number;
  phoneNumber: string;
  balance: number;
  registeredAt: string;
}

interface UserTableProps {
  users: User[];
  currentPage: number;
  itemsPerPage: number;
  totalUsers: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  currentSortBy: string;
  currentSortOrder: 'asc' | 'desc';
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  currentPage,
  totalUsers,
  totalPages,
  onPageChange,
  onSortChange,
  currentSortBy,
  currentSortOrder,
}) => {
  const handleSortClick = (field: string) => {
    if (currentSortBy === field) {
      onSortChange(field, currentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(field, 'asc');
    }
  };

  const renderSortIcon = (field: string) => {
    if (currentSortBy === field) {
      return currentSortOrder === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mt-4">
      <h3 className="text-lg font-semibold mb-3">All Registered Users</h3>

      {/* Scrollable table wrapper */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase leading-normal">
              <th
                className="py-3 px-4 text-left cursor-pointer whitespace-nowrap"
                onClick={() => handleSortClick('username')}
              >
                Username {renderSortIcon('username')}
              </th>
              <th className="py-3 px-4 text-left whitespace-nowrap">Telegram ID</th>
              <th className="py-3 px-4 text-left whitespace-nowrap">Account #</th>
              <th className="py-3 px-4 text-left whitespace-nowrap">Phone</th>
              <th
                className="py-3 px-4 text-left cursor-pointer whitespace-nowrap"
                onClick={() => handleSortClick('balance')}
              >
                Balance {renderSortIcon('balance')}
              </th>
              <th
                className="py-3 px-4 text-left cursor-pointer whitespace-nowrap"
                onClick={() => handleSortClick('registeredAt')}
              >
                Registered {renderSortIcon('registeredAt')}
              </th>
            </tr>
          </thead>
          <tbody className="text-gray-600 font-light">
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 truncate max-w-[150px]">{user.username}</td>
                  <td className="py-3 px-4">{user.telegramId}</td>
                  <td className="py-3 px-4">{user.accountNumber}</td>
                  <td className="py-3 px-4">{user.phoneNumber}</td>
                  <td className="py-3 px-4">{user.balance.toLocaleString()} Birr</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {new Date(user.registeredAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalUsers > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 p-3 bg-gray-50 rounded-lg">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-gray-700 text-sm sm:text-base">
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
