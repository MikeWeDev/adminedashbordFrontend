'use client';

import { useState, useEffect } from 'react';
import { UserTable } from '../../components/UserTable';
import { FaMoneyBill, FaGamepad, FaUsers } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';

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
const API_URL = 'https://adminbackend.bingoogame.com/api/dashboard';
const defaultUserSummary: UserSummaryData = {
  users: 0,
  totalGamesOverall: 0,
  totalAccountBalance: 0,
};

/* -------------------- Icons & Card -------------------- */
const icons = {
  revenue: <FaMoneyBill className="text-3xl sm:text-4xl text-white flex-shrink-0 drop-shadow-lg" />,
  games: <FaGamepad className="text-3xl sm:text-4xl text-white flex-shrink-0 drop-shadow-lg" />,
  users: <FaUsers className="text-3xl sm:text-4xl text-white flex-shrink-0 drop-shadow-lg" />,
};

// Attractive Card component
const Card = ({ title, value, icon }: { title: string; value: string | number; icon: keyof typeof icons }) => (
  <div className="bg-white rounded-xl shadow-md p-4 flex items-center gap-4 w-full transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
    <div className="w-14 h-14 flex items-center justify-center rounded-full bg-indigo-500 text-white text-2xl shadow-md">
      {icons[icon]}
    </div>
    <div className="flex flex-col">
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <h2 className="text-lg sm:text-xl font-bold text-gray-900">{value}</h2>
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  /* -------- Fetch Summary & Users -------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const dateParam = selectedDate ? moment(selectedDate).format('YYYY-MM-DD') : '';

        // Fetch summary
        const summaryRes = await fetch(`${API_URL}/summary?date=${dateParam}`);
        if (!summaryRes.ok) throw new Error(`Failed to fetch summary: ${summaryRes.statusText}`);
        const summaryData = await summaryRes.json();

        // Fetch users with pagination & sorting
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          sortBy,
          sortOrder,
        }).toString();
        const usersRes = await fetch(`${API_URL}/users?${queryParams}&date=${dateParam}`);
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
  }, [currentPage, itemsPerPage, sortBy, sortOrder, selectedDate]);

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100">
        <div className="text-center text-lg font-semibold text-gray-700 bg-white p-6 rounded-xl shadow-lg animate-pulse">
          Loading dashboard data... Please wait.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center text-lg font-semibold text-red-600 bg-white p-6 rounded-xl shadow-lg">
          <p>Error: {error}</p>
          <p className="text-sm text-gray-500 mt-2">
            Displaying default values due to a data fetching issue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 w-[90%] lg:w-full p-4 flex flex-col items-center justify-start bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100 min-h-screen transition-all">
      <div className="w-[clamp(250px,100%,900px)] lg:w-full lg:mt-8 flex flex-col gap-6">

        {/* Calendar Filter */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl shadow-md bg-white hover:shadow-xl transition-shadow duration-300 w-[80%] md:w-full">
  <h3 className="text-xl font-semibold text-gray-700 tracking-wide">User Management</h3>
</div>


        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 w-full">
          <Card title="Total Registered Users" value={summary.users.toLocaleString()} icon="users" />
          <Card title="Total Games (Overall)" value={`${summary.totalGamesOverall.toLocaleString()} Games`} icon="games" />
          <Card title="Total User Balance" value={`${summary.totalAccountBalance.toLocaleString()} Birr`} icon="revenue" />
        </div>

        {/* Users Table */}
        <div className="max-w-full mt-6 bg-white rounded-xl shadow-md p-4 hover:shadow-xl transition-shadow duration-300">
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
    </main>
  );
}
