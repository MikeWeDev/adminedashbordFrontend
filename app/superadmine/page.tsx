'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserTable } from '../components/SuperUsertable';
import { FaMoneyBill, FaUsers, FaGamepad } from 'react-icons/fa';

function useSessionCheck() {
  const router = useRouter();
  useEffect(() => {
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const expiry = localStorage.getItem('expiry');

    if (!username || !role || !expiry) router.push('/auth/login');

    const expiryTime = parseInt(expiry || '0', 10);
    if (new Date().getTime() > expiryTime) {
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      localStorage.removeItem('expiry');
      router.push('/auth/login');
    }
  }, [router]);
}

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
const defaultSummary: UserSummaryData = { users: 0, totalGamesOverall: 0, totalAccountBalance: 0 };

const icons = {
  revenue: <FaMoneyBill className="text-2xl sm:text-3xl text-green-500 flex-shrink-0" />,
  users: <FaUsers className="text-2xl sm:text-3xl text-purple-500 flex-shrink-0" />,
  games: <FaGamepad className="text-2xl sm:text-3xl text-yellow-500 flex-shrink-0" />,
};

const Card = ({ title, value, icon }: { title: string; value: string | number; icon: keyof typeof icons }) => (
  <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center sm:flex-row sm:items-start w-[100%] md:w-full">
    <div className="mb-2 sm:mb-0 sm:mr-3">{icons[icon]}</div>
    <div className="text-center sm:text-left">
      <p className="text-gray-500 text-sm truncate">{title}</p>
      <h2 className="text-lg font-bold truncate text-black">{value}</h2>
    </div>
  </div>
);

export default function UserManagementPage() {
  useSessionCheck();

  const [summary, setSummary] = useState<UserSummaryData>(defaultSummary);
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('registeredAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorSummary, setErrorSummary] = useState<string | null>(null);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);

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
        setErrorSummary((err as Error).message);
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummary();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        setErrorUsers(null);
        const query = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          sortBy,
          sortOrder,
        }).toString();
        const res = await fetch(`${API_URL}/users?${query}`);
        if (!res.ok) throw new Error(`Failed to fetch users: ${res.statusText}`);
        const data = await res.json();
        setUsers(data.users || []);
        setTotalUsers(data.totalUsers || 0);
        setTotalPages(data.totalPages || 1);
      } catch (err: unknown) {
        setErrorUsers((err as Error).message);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [currentPage, itemsPerPage, sortBy, sortOrder]);

  const handlePageChange = (page: number) => page >= 1 && page <= totalPages && setCurrentPage(page);
  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  // Full-page loading
  if (loadingSummary || loadingUsers) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center text-lg font-semibold text-gray-700 bg-white p-6 rounded-lg shadow-md">
          Loading dashboard data... Please wait.
        </div>
      </div>
    );
  }

  // Full-page error
  if (errorSummary || errorUsers) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center text-lg font-semibold text-red-600 bg-white p-6 rounded-lg shadow-md">
          <p>Error: {errorSummary || errorUsers}</p>
          <p className="text-sm text-gray-500 mt-2">
            Displaying default values due to a data fetching issue.
          </p>
        </div>
      </div>
    );
  }

  // Page content
  return (
<main className="flex-1 w-[70%] lg:w-full p-4 flex items-start justify-start">
  <div className="w-[clamp(250px,100%,800px)] lg:w-full lg:mt-8">
    <div className="mx-auto flex flex-col gap-6 ">


      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 ">
          <Card title="Total Registered Users" value={summary.users.toLocaleString()} icon="users" />
          <Card title="Total Games (Overall)" value={`${summary.totalGamesOverall.toLocaleString()} Games`} icon="games" />
          <Card title="Total Account Balance" value={`${summary.totalAccountBalance.toLocaleString()} Birr`} icon="revenue" />
        </div>

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
