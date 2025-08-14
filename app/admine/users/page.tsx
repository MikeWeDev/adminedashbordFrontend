'use client';

import { useState, useEffect } from 'react';
import SuperAdminLayout from '../layout'; // Make sure this exists
import { DashboardCard } from '../../components/DashboardCard';
import { UserTable } from '../../components/UserTable';

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

/* -------------------- Main Component -------------------- */
export default function UserManagementPage() {
  /* --------- State --------- */
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

  /* --------- Fetch Summary Data --------- */
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoadingSummary(true);
        setErrorSummary(null);
        const res = await fetch(`${API_URL}/summary`);
        if (!res.ok) throw new Error(`Failed to fetch summary: ${res.status} ${res.statusText}`);
        const data = await res.json();
        setSummary({
          users: data.users || 0,
          totalGamesOverall: data.totalGamesOverall || 0,
          totalAccountBalance: data.totalAccountBalance || 0,
        });
      } catch (err: unknown) {
        console.error('Error fetching summary:', err);
        setErrorSummary((err as Error).message);
        setSummary(defaultUserSummary);
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummary();
  }, []);

  /* --------- Fetch User Table --------- */
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
        if (!res.ok) throw new Error(`Failed to fetch users: ${res.status} ${res.statusText}`);

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
  return (
    <SuperAdminLayout>
      {/* Using vh unit trick to avoid mobile black space */}
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-[calc(var(--vh,1vh)*100)]">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">User Management</h1>

        {/* Summary Cards */}
        {loadingSummary ? (
          <div className="text-center text-gray-600 p-4 rounded-lg bg-white shadow-sm">
            Loading summary data...
          </div>
        ) : errorSummary ? (
          <div className="text-center text-red-600 p-4 rounded-lg bg-white shadow-sm">
            Error fetching summary: {errorSummary}. Displaying defaults.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <DashboardCard title="Total Registered Users" value={summary.users.toLocaleString()} icon="users" />
            <DashboardCard
              title="Total Games (Overall)"
              value={`${summary.totalGamesOverall.toLocaleString()} Games`}
              icon="games"
            />
            <DashboardCard
              title="Total Account Balance"
              value={`${summary.totalAccountBalance.toLocaleString()} Birr`}
              icon="revenue"
            />
          </div>
        )}

        {/* User Table */}
        {loadingUsers ? (
          <div className="text-center text-gray-600 mt-8 p-4 rounded-lg bg-white shadow-sm">
            Loading user list...
          </div>
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
      </div>
    </SuperAdminLayout>
  );
}
