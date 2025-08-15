'use client';

import { useState, useEffect } from 'react';
import { UserTable } from '../../components/UserTable';
import { FaMoneyBill, FaGamepad, FaUsers } from 'react-icons/fa';

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
  <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-start w-1/3 sm:w-full">
    <div className="flex items-center gap-3 mb-2">
      {icons[icon]}
      <p className="text-gray-500 text-sm">{title}</p>
    </div>
    <h2 className="text-lg font-bold">{value}</h2>
  </div>
);

/* -------------------- Main Component -------------------- */
export default function UserManagementPage() {
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

  /* --------- Fetch Data --------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch summary
        const summaryRes = await fetch(`${API_URL}/summary`);
        if (!summaryRes.ok) throw new Error(`Failed to fetch summary: ${summaryRes.statusText}`);
        const summaryData = await summaryRes.json();

        // Fetch users
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

  /* --------- Handlers --------- */
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };
  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  /* --------- Render --------- */
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
  <main className="bg-gray-100 min-h-screen p-4  ">
  <div className="flex flex-col gap-4  justify-center items-start overflow-hidden ">

    {/* Summary Cards */}
    <div className="flex flex-col gap-4 w-full sm:w-3/4 md:w-2/3 lg:w-1/2 mx-auto  ">
      <Card title="Total Registered Users" value={summary.users.toLocaleString()} icon="users" />
      <Card
        title="Total Games (Overall)"
        value={`${summary.totalGamesOverall.toLocaleString()} Games`}
        icon="games"
      />
      <Card
        title="Total Account Balance"
        value={`${summary.totalAccountBalance.toLocaleString()} Birr`}
        icon="revenue"
      />
    </div>

    {/* User Table */}
    <div className="w-full overflow-x-auto">
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
