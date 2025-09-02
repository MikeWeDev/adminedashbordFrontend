'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowUp, FaArrowDown, FaUsers } from 'react-icons/fa';
import { AuditTable } from '../../../components/AuditTable'; // new table component

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

// ---------------- Types ----------------
interface AuditEntry {
  type: 'Balance Change' | 'Transaction Change';
  target: string; // username for balance, tx_ref for transaction
  oldValue: string | number;
  newValue: string | number;
  reason: string;
  timestamp: string;
}

interface FinanceSummary {
  totalChanges: number;
  totalDeposits24h: number;
  totalWithdrawals24h: number;
}
const API_URL = 'https://adminbackend.bingoogame.com/api/finance';
const defaultSummary: FinanceSummary = { totalChanges: 0, totalDeposits24h: 0, totalWithdrawals24h: 0 };

// ---------------- Card Icons ----------------
const icons = {
  changes: <FaUsers className="text-2xl sm:text-3xl text-purple-500 flex-shrink-0" />,
  deposits: <FaArrowUp className="text-2xl sm:text-3xl text-green-500 flex-shrink-0" />,
  withdrawals: <FaArrowDown className="text-2xl sm:text-3xl text-red-500 flex-shrink-0" />,
};

// ---------------- Card Component ----------------
const Card = ({ title, value, icon }: { title: string; value: string | number; icon: keyof typeof icons }) => (
  <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center sm:flex-row sm:items-start w-1/2 md:w-full">
    <div className="mb-2 sm:mb-0 sm:mr-3">{icons[icon]}</div>
    <div className="text-center sm:text-left">
      <p className="text-gray-500 text-sm truncate">{title}</p>
      <h2 className="text-lg font-bold truncate text-black">{value}</h2>
    </div>
  </div>
);

// ---------------- Page Component ----------------
export default function FinanceManagementPage() {
  useSessionCheck();

  const [summary, setSummary] = useState<FinanceSummary>(defaultSummary);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const query = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          sortBy,
          sortOrder,
        }).toString();

        const res = await fetch(`${API_URL}/changes?${query}`);
        if (!res.ok) throw new Error(`Failed to fetch finance data: ${res.statusText}`);
        const data = await res.json();

        setSummary(data.summary || defaultSummary);
        setAuditEntries(data.data || []);
        setTotalItems(data.totalItems || 0);
        setTotalPages(Math.ceil((data.totalItems || 0) / itemsPerPage));
      } catch (err: unknown) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, itemsPerPage, sortBy, sortOrder]);

  const handlePageChange = (page: number) => page >= 1 && page <= totalPages && setCurrentPage(page);
  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center text-lg font-semibold text-gray-700 bg-white p-6 rounded-lg shadow-md">
          Loading finance data... Please wait.
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
      <div className="w-[clamp(250px,100%,1000px)] lg:w-full lg:mt-8">
        <div className="mx-auto flex flex-col gap-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card title="Total Changes" value={summary.totalChanges.toLocaleString()} icon="changes" />
            <Card title="Deposits (24h)" value={`${summary.totalDeposits24h.toLocaleString()} Birr`} icon="deposits" />
            <Card title="Withdrawals (24h)" value={`${summary.totalWithdrawals24h.toLocaleString()} Birr`} icon="withdrawals" />
          </div>

          {/* Audit Table */}
          <div className="max-w-full mt-4">
            <AuditTable
              entries={auditEntries}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
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
