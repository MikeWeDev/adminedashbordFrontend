'use client';

import { useState, useEffect } from 'react';
import { TransactionTable } from '../../components/TransactionTable';
import { FaMoneyBill, FaChartLine, FaUsers, FaGamepad } from 'react-icons/fa';

interface TransactionSummaryData {
  totalDepositAmount: number;
  totalWithdrawalAmount: number;
  totalPendingTransactions: number;
}

interface Transaction {
  _id: string;
  transactionId: string;
  type: 'Deposit' | 'Withdrawal';
  amount: number;
  status: string;
  telegramId: string;
  username: string;
  date: string;
  currency: string;
  bank_code?: string;
  account_name?: string;
  account_number?: string;
}

const API_URL = 'https://adminedashbordbackend.onrender.com/api/dashboard';
const TRANSACTIONS_API_URL = 'https://adminedashbordbackend.onrender.com/api/transactions';

const defaultTransactionSummary: TransactionSummaryData = {
  totalDepositAmount: 0,
  totalWithdrawalAmount: 0,
  totalPendingTransactions: 0,
};

const icons = {
  revenue: <FaMoneyBill className="text-2xl sm:text-3xl text-green-500 flex-shrink-0" />,
  profit: <FaChartLine className="text-2xl sm:text-3xl text-blue-500 flex-shrink-0" />,
  users: <FaUsers className="text-2xl sm:text-3xl text-purple-500 flex-shrink-0" />,
  games: <FaGamepad className="text-2xl sm:text-3xl text-yellow-500 flex-shrink-0" />,
};

const Card = ({ title, value, icon }: { title: string; value: string | number; icon: keyof typeof icons }) => (
  <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center sm:flex-row sm:items-start w-[80%] lg:w-full">
    <div className="mb-2 sm:mb-0 sm:mr-3">{icons[icon]}</div>
    <div className="text-center sm:text-left">
      <p className="text-gray-500 text-sm truncate">{title}</p>
      <h2 className="text-lg font-bold truncate text-black">{value}</h2>
    </div>
  </div>
);

export default function TransactionHistoryPage() {
  const [summary, setSummary] = useState<TransactionSummaryData>(defaultTransactionSummary);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;
  const [totalPages, setTotalPages] = useState<number>(1);

  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [loadingSummary, setLoadingSummary] = useState<boolean>(true);
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(true);
  const [errorSummary, setErrorSummary] = useState<string | null>(null);
  const [errorTransactions, setErrorTransactions] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoadingSummary(true);
        setErrorSummary(null);
        const res = await fetch(`${API_URL}/summary`);
        if (!res.ok) throw new Error(`Failed to fetch summary: ${res.status} ${res.statusText}`);
        const data = await res.json();
        setSummary({
          totalDepositAmount: data.totalDepositAmount || 0,
          totalWithdrawalAmount: data.totalWithdrawalAmount || 0,
          totalPendingTransactions: data.totalPendingTransactions || 0,
        });
      } catch (err: unknown) {
        console.error('Error fetching summary:', err);
        setErrorSummary((err as Error).message);
        setSummary(defaultTransactionSummary);
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummary();
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoadingTransactions(true);
        setErrorTransactions(null);
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          sortBy,
          sortOrder,
        }).toString();

        const res = await fetch(`${TRANSACTIONS_API_URL}?${queryParams}`);
        if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status} ${res.statusText}`);
        const data = await res.json();
        setTransactions(data.transactions || []);
        setTotalTransactions(data.totalTransactions || 0);
        setTotalPages(data.totalPages || 1);
      } catch (err: unknown) {
        console.error('Error fetching transactions:', err);
        setErrorTransactions((err as Error).message);
        setTransactions([]);
        setTotalTransactions(0);
        setTotalPages(1);
      } finally {
        setLoadingTransactions(false);
      }
    };
    fetchTransactions();
  }, [currentPage, itemsPerPage, sortBy, sortOrder]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  /** ---------- EARLY RETURN FORMAT ---------- **/

  if (loadingSummary || loadingTransactions) {
    return (
      <main className="p-6">
        <div className="bg-white p-6 rounded-lg shadow text-gray-700">Loading transactions…</div>
      </main>
    );
  }

  if (errorSummary || errorTransactions) {
    return (
      <main className="p-6">
        <div className="bg-white p-6 rounded-lg shadow text-red-600">
          <p className="font-semibold">Error</p>
          <p className="text-sm text-gray-600 mt-1">
            {errorSummary || errorTransactions}
          </p>
        </div>
      </main>
    );
  }

  /** ---------- SUCCESS VIEW ---------- **/

  return (
    <main className="flex-1 w-[80%] lg:w-full p-4 flex items-start justify-start">
      <div className="w-[clamp(250px,100%,800px)] lg:w-full lg:mt-8">
        <div className="mx-auto flex flex-col gap-6">
          <h1 className="text-3xl font-bold mb-8 text-gray-800">Transaction History</h1>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card
              title="Total Deposits"
              value={`${summary.totalDepositAmount.toLocaleString()} Birr`}
              icon="revenue"
            />
            <Card
              title="Total Withdrawals"
              value={`${summary.totalWithdrawalAmount.toLocaleString()} Birr`}
              icon="profit"
            />
            <Card
              title="Pending Transactions"
              value={`${summary.totalPendingTransactions.toLocaleString()} Items`}
              icon="games"
            />
          </div>

          {/* Transactions Table */}
          <div className="max-w-full">
            <TransactionTable
              transactions={transactions}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalTransactions={totalTransactions}
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
