'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserTable } from '../components/SuperUsertable';
import { FaMoneyBill, FaChartLine, FaUsers, FaGamepad } from 'react-icons/fa';


/* ------------------- Session Check Hook ------------------- */
function useSessionCheck() {
  const router = useRouter();

  useEffect(() => {
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const expiry = localStorage.getItem('expiry');

    if (!username || !role || !expiry) {
      router.push('/auth/login');
      return;
    }

    const expiryTime = parseInt(expiry, 10);
    const now = new Date().getTime();

    if (now > expiryTime) {
      // Session expired → clear storage and redirect
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      localStorage.removeItem('expiry');
      router.push('/auth/login');
    }
  }, [router]);
}
/* ----------------------------------------------------------- */

interface UserSummaryData {
  users: number;
  totalGamesOverall: number;
  totalAccountBalance: number;
}

interface User {
  _id: string;
  telegramId: number;
  username: string;
  accountNumber: number;
  phoneNumber: string;
  balance: number;
  registeredAt: string;
}

const API_URL = 'https://adminedashbordbackend.onrender.com/api/dashboard';
const defaultUserSummary: UserSummaryData = { users: 0, totalGamesOverall: 0, totalAccountBalance: 0 };

const icons = {
  revenue: <FaMoneyBill className="text-2xl sm:text-3xl text-green-500 flex-shrink-0" />,
  profit: <FaChartLine className="text-2xl sm:text-3xl text-blue-500 flex-shrink-0" />,
  users: <FaUsers className="text-2xl sm:text-3xl text-purple-500 flex-shrink-0" />,
  games: <FaGamepad className="text-2xl sm:text-3xl text-yellow-500 flex-shrink-0" />,
};

const Card = ({ title, value, icon }: { title: string; value: string | number; icon: keyof typeof icons }) => (
  <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center sm:flex-row sm:items-start w-[60%] lg:w-full">
    <div className="mb-2 sm:mb-0 sm:mr-3">{icons[icon]}</div>
    <div className="text-center sm:text-left">
      <p className="text-gray-500 text-sm truncate">{title}</p>
      <h2 className="text-lg font-bold truncate text-black">{value}</h2>
    </div>
  </div>
);





export default function UserManagementPage() {
  useSessionCheck(); // ✅ Check session immediately

  const [summary, setSummary] = useState<UserSummaryData>(defaultUserSummary);
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;
  const [totalPages, setTotalPages] = useState<number>(1);
  const [sortBy, setSortBy] = useState<string>('registeredAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [loadingSummary, setLoadingSummary] = useState<boolean>(true);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [errorSummary, setErrorSummary] = useState<string | null>(null);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);

  /* ---------------- Fetch Summary Data ---------------- */
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoadingSummary(true);
        setErrorSummary(null);
        const res = await fetch(`${API_URL}/summary`);
        if (!res.ok) throw new Error(`Failed to fetch summary: ${res.statusText}`);
        const data = await res.json();
        setSummary({
          users: data.users || 0,
          totalGamesOverall: data.totalGamesOverall || 0,
          totalAccountBalance: data.totalAccountBalance || 0,
        });
      } catch (err: unknown) {
        console.error('Error fetching summary data:', err);
        setErrorSummary((err as Error).message);
        setSummary(defaultUserSummary);
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummary();
  }, []);

  /* ---------------- Fetch Users Data ---------------- */
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        setErrorUsers(null);
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          sortBy,
          sortOrder,
        }).toString();

        const res = await fetch(`${API_URL}/users?${queryParams}`);
        if (!res.ok) throw new Error(`Failed to fetch users: ${res.statusText}`);
        const data = await res.json();
        setUsers(data.users || []);
        setTotalUsers(data.totalUsers || 0);
        setTotalPages(data.totalPages || 1);
      } catch (err: unknown) {
        console.error('Error fetching users:', err);
        setErrorUsers((err as Error).message);
        setUsers([]);
        setTotalUsers(0);
        setTotalPages(1);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [currentPage, itemsPerPage, sortBy, sortOrder]);

  /* ---------------- Handlers ---------------- */
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  return (
    <main className="flex-1 w-[70%] lg:w-full p-4 flex items-start justify-start">
            <div className="w-[clamp(250px,100%,800px)] lg:w-full lg:mt-8 mx-auto flex flex-col gap-6">

      <h1 className="text-3xl font-bold mb-8 text-gray-800">User Management</h1>

      {/* Summary Cards */}
      {loadingSummary ? (
        <div className="text-center text-gray-600 p-4 rounded-lg bg-white shadow-sm">Loading summary data...</div>
      ) : errorSummary ? (
        <div className="text-center text-red-600 p-4 rounded-lg bg-white shadow-sm">
          Error fetching summary: {errorSummary}. Showing defaults.
        </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ">
          <Card title="Total Registered Users" value={summary.users.toLocaleString()} icon="users" />
          <Card title="Total Games (Overall)" value={`${summary.totalGamesOverall.toLocaleString()} Games`} icon="games" />
          <Card title="Total Account Balance" value={`${summary.totalAccountBalance.toLocaleString()} Birr`} icon="revenue" />
        </div>
      )}

      {/* Users Table */}
      {loadingUsers ? (
        <div className="text-center text-gray-600 mt-8 p-4 rounded-lg bg-white shadow-sm">Loading user list...</div>
      ) : errorUsers ? (
        <div className="text-center text-red-600 mt-8 p-4 rounded-lg bg-white shadow-sm">Error fetching users: {errorUsers}.</div>
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
            </div>

    </main>
  );
}
