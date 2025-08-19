'use client';

import { useState, useEffect } from 'react';
import { UserTable } from '../../components/UserTable';
import { FaMoneyBill, FaGamepad, FaUsers } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

/* -------------------- Interfaces -------------------- */
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

/* -------------------- Constants -------------------- */
const API_URL = 'https://adminedashbordbackend.onrender.com/api/dashboard';
const defaultUserSummary: UserSummaryData = {
  users: 0,
  totalGamesOverall: 0,
  totalAccountBalance: 0,
};

/* -------------------- Icons & Card -------------------- */
const icons = {
  revenue: <FaMoneyBill className="text-2xl sm:text-3xl text-green-500 flex-shrink-0" />,
  games: <FaGamepad className="text-2xl sm:text-3xl text-yellow-500 flex-shrink-0" />,
  users: <FaUsers className="text-2xl sm:text-3xl text-purple-500 flex-shrink-0" />,
};


const Card = ({ title, value, icon }: { title: string; value: string | number; icon: keyof typeof icons }) => (
  <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center sm:flex-row sm:items-start w-2/3">
    <div className="mb-2 sm:mb-0 sm:mr-3">{icons[icon]}</div>
    <div className="text-center sm:text-left">
      <p className="text-gray-500 text-sm truncate">{title}</p>
      <h2 className="text-lg font-bold truncate text-black">{value}</h2>
    </div>
  </div>
);

/* -------------------- Session Check Hook -------------------- */
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
    if (Date.now() > expiryTime) {
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      localStorage.removeItem('expiry');
      router.push('/auth/login');
    }
  }, [router]);
}

/* -------------------- Main Component -------------------- */
export default function UserManagementPage() {
  useSessionCheck();

  const [summary, setSummary] = useState<UserSummaryData>(defaultUserSummary);
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;
  const [totalPages, setTotalPages] = useState<number>(1);
  const [sortBy, setSortBy] = useState<string>('registeredAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /* -------- Fetch Summary & Users -------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch summary
        const summaryRes = await fetch(`${API_URL}/summary`);
        if (!summaryRes.ok) throw new Error(`Failed to fetch summary: ${summaryRes.statusText}`);
        const summaryData = await summaryRes.json();

        // Fetch users with pagination & sorting
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          sortBy,
          sortOrder,
        }).toString();
        const usersRes = await fetch(`${API_URL}/users?${queryParams}`);
        if (!usersRes.ok) throw new Error(`Failed to fetch users: ${usersRes.statusText}`);
        const usersData = await usersRes.json();

        setSummary({
          users: summaryData.users || 0,
          totalGamesOverall: summaryData.totalGamesOverall || 0,
          totalAccountBalance: summaryData.totalAccountBalance || 0,
        });
        setUsers(usersData.users || []);
        setTotalUsers(usersData.totalUsers || 0);
        setTotalPages(usersData.totalPages || 1);
      } catch (err: unknown) {
        setError((err as Error).message);
        setSummary(defaultUserSummary);
        setUsers([]);
        setTotalUsers(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, itemsPerPage, sortBy, sortOrder]);

  /* -------- Handlers -------- */
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };
  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  /* -------- Render -------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center text-lg font-semibold text-gray-700 bg-white p-6 rounded-lg shadow-md">
          Loading dashboard data... Please wait.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center text-lg font-semibold text-red-600 bg-white p-6 rounded-lg shadow-md">
          <p>Error: {error}</p>
          <p className="text-sm text-gray-500 mt-2">
            Displaying default values due to a data fetching issue.
          </p>
        </div>
      </div>
    );
  }

  return (
<main className="flex-1 w-[70%] lg:w-full p-4 flex items-start justify-start">
  <div className="w-[clamp(250px,100%,800px)] lg:w-full lg:mt-8">
  
    <div className=" mx-auto flex flex-col gap-6">
        {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ">
          <Card title="Total Registered Users" value={summary.users.toLocaleString()} icon="users" />
          <Card title="Total Games (Overall)" value={`${summary.totalGamesOverall.toLocaleString()} Games`} icon="games" />
          <Card title="Total User Balance" value={`${summary.totalAccountBalance.toLocaleString()} Birr`} icon="revenue" />
        </div>

        {/* Users Table */}
      <div className="max-w-full">
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
        </div>


        </div>

      </div>
    </main>
  );
}
