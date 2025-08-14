'use client';

import { useState, useEffect } from 'react';
import { UserTable } from '../../components/SuperUsertable'; // New UserTable component

/**
 * Interface defining the summary data for the User Management dashboard.
 */
interface UserSummaryData {
  users: number; // Total registered users
  totalGamesOverall: number; // Total games played overall
  totalAccountBalance: number; // Total sum of all user balances
}

/**
 * Interface defining the structure of a single User document.
 * This should match your backend User schema.
 */
interface User {
  _id: string;
  telegramId: number;
  username: string;
  accountNumber: number;
  phoneNumber: string;
  balance: number;
  registeredAt: string;
}

const API_URL = 'https://adminedashbordbackend.onrender.com/api/dashboard'; // Backend API URL

/**
 * Default summary values for the User Management page.
 */
const defaultUserSummary: UserSummaryData = {
  users: 0,
  totalGamesOverall: 0,
  totalAccountBalance: 0,
};

export default function UserManagementPage() {
  // State for summary cards, initialized with default values
  const [summary, setSummary] = useState<UserSummaryData>(defaultUserSummary);
  // State for the user list and pagination, initialized as an empty array
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10; // ⭐ FIX: Changed from useState to a constant, as setItemsPerPage was unused
  const [totalPages, setTotalPages] = useState<number>(1);
  // State for sorting
  const [sortBy, setSortBy] = useState<string>('registeredAt'); // Default sort field
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Default sort order

  // Separate loading and error states for summary cards and user table
  const [loadingSummary, setLoadingSummary] = useState<boolean>(true);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [errorSummary, setErrorSummary] = useState<string | null>(null);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);

  /**
   * useEffect hook to fetch summary data (Total Users, Total Games Overall, Total Account Balance).
   * This runs once on component mount.
   */
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoadingSummary(true);
        setErrorSummary(null); // Clear previous errors
        const res = await fetch(`${API_URL}/summary`);
        if (!res.ok) {
          throw new Error(`Failed to fetch summary: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        setSummary({
          users: data.users || 0,
          totalGamesOverall: data.totalGamesOverall || 0,
          totalAccountBalance: data.totalAccountBalance || 0,
        });
      } catch (err: unknown) { // ⭐ FIX: Changed 'any' to 'unknown'
        console.error("Error fetching user summary data:", err);
        setErrorSummary((err as Error).message); // ⭐ FIX: Type assertion to safely access .message
        setSummary(defaultUserSummary); // Fallback to defaults on error
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummary();
  }, []);

  /**
   * useEffect hook to fetch paginated user data.
   * This runs on mount and whenever `currentPage`, `itemsPerPage`, `sortBy`, or `sortOrder` changes.
   */
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        setErrorUsers(null); // Clear previous errors
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          sortBy: sortBy,
          sortOrder: sortOrder,
        }).toString();

        const res = await fetch(`${API_URL}/users?${queryParams}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch users: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        setUsers(data.users || []); // Ensure users array is always present, even if empty
        setTotalUsers(data.totalUsers || 0);
        setTotalPages(data.totalPages || 1);
      } catch (err: unknown) { // ⭐ FIX: Changed 'any' to 'unknown'
        console.error("Error fetching user list:", err);
        setErrorUsers((err as Error).message); // ⭐ FIX: Type assertion to safely access .message
        setUsers([]); // Clear users on error to display "No users found"
        setTotalUsers(0);
        setTotalPages(1);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [currentPage, itemsPerPage, sortBy, sortOrder]);

  // Handler for page change in UserTable
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handler for sort change in UserTable
  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1); // Reset to first page on sort change
  };

  return (
    // The pl-64 class provides space for the fixed sidebar
    <main className="bg-gray-100 min-h-screen p-8 ml-64">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">User Management</h1>

      
      {/* User Table Section */}
      {loadingUsers ? (
        <div className="text-center text-gray-600 mt-8 p-4 rounded-lg bg-white shadow-sm">Loading user list...</div>
      ) : errorUsers ? (
        <div className="text-center text-red-600 mt-8 p-4 rounded-lg bg-white shadow-sm">
          Error fetching users: {errorUsers}.
        </div>
      ) : (
        <UserTable
          users={users}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalUsers={totalUsers}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onSortChange={handleSortChange}
          currentSortBy={sortBy}
          currentSortOrder={sortOrder}
        />
      )}
    </main>
  );
}