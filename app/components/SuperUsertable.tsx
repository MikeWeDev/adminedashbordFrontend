import Link from 'next/link';
import { useState, useMemo } from 'react';
import { FaEdit, FaSortAlphaDown, FaSortAlphaUp } from 'react-icons/fa';

interface User {
  _id: string;
  telegramId?: number;
  username: string;
  phoneNumber?: string;
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
  onSortChange: (field: string, order: 'asc' | 'desc') => void;
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
  const [usernameQuery, setUsernameQuery] = useState('');
  const [contactQuery, setContactQuery] = useState('');

  // Filter users by both username and phone/telegram ID
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesUsername = user.username
        .toLowerCase()
        .includes(usernameQuery.toLowerCase());
      const matchesContact =
        user.phoneNumber?.includes(contactQuery) ||
        user.telegramId?.toString().includes(contactQuery);
      return matchesUsername && (contactQuery ? matchesContact : true);
    });
  }, [users, usernameQuery, contactQuery]);

  const handleSortClick = (field: string) => {
    if (currentSortBy === field) {
      onSortChange(field, currentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(field, 'asc');
    }
  };

  const renderSortIcon = (field: string) => {
    if (currentSortBy === field) {
      return currentSortOrder === 'asc' ? (
        <FaSortAlphaUp className="inline ml-1" />
      ) : (
        <FaSortAlphaDown className="inline ml-1" />
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8 ">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">
        All Registered Users
      </h3>

      {/* Search Boxes */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by username..."
          value={usernameQuery}
          onChange={(e) => setUsernameQuery(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="text"
          placeholder="Search by phone number or Telegram ID..."
          value={contactQuery}
          onChange={(e) => setContactQuery(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="table-auto border-collapse max-w-[1500px]">
          <thead>
            <tr className="bg-gray-200 text-gray-700 uppercase text-xs leading-normal">
              <th
                className="py-3 px-6 text-left cursor-pointer hover:bg-gray-300 transition-colors duration-150 rounded-tl-lg"
                onClick={() => handleSortClick('username')}
              >
                Username {renderSortIcon('username')}
              </th>
              <th
                className="py-3 px-6 text-left cursor-pointer hover:bg-gray-300 transition-colors duration-150"
                onClick={() => handleSortClick('telegramId')}
              >
                Telegram ID {renderSortIcon('telegramId')}
              </th>
              <th className="py-3 px-6 text-left">Phone Number</th>
              <th
                className="py-3 px-6 text-left cursor-pointer hover:bg-gray-300 transition-colors duration-150"
                onClick={() => handleSortClick('balance')}
              >
                Balance {renderSortIcon('balance')}
              </th>
              {/* Registered At hidden on small screens */}
              <th
                className="py-3 px-6 text-left cursor-pointer hover:bg-gray-300 transition-colors duration-150 hidden md:table-cell"
                onClick={() => handleSortClick('registeredAt')}
              >
                Registered At {renderSortIcon('registeredAt')}
              </th>
              <th className="py-3 px-6 text-left rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm font-light">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr
                  key={user._id}
                  className="border-b border-gray-200 hover:bg-gray-100 transition-colors duration-150"
                >
                  <td className="py-3 px-6 text-left whitespace-nowrap">
                    {user.username}
                  </td>
                  <td className="py-3 px-6 text-left">
                    {user.telegramId || 'N/A'}
                  </td>
                  <td className="py-3 px-6 text-left">
                    {user.phoneNumber || 'N/A'}
                  </td>
                  <td className="py-3 px-6 text-left">
                    {user.balance.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    Birr
                  </td>
                  {/* Registered At hidden on small screens */}
                  <td className="py-3 px-6 text-left whitespace-nowrap hidden md:table-cell">
                    {new Date(user.registeredAt).toLocaleDateString()}
                    <span className="block text-xs text-gray-500">
                      {new Date(user.registeredAt).toLocaleTimeString()}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-left">
                    <Link
                      href={`/superadmine/user/${user._id}`}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center gap-1 transition-colors duration-200 text-sm"
                    >
                      <FaEdit /> Edit
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="py-4 text-center text-gray-500"
                >
                  No users found.
                </td>
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
