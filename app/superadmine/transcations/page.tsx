'use client';

import { useState, useEffect } from 'react';
import { PaymentTable } from '../../components/PaymentTable';
import { FaMoneyBill, FaUsers, FaGamepad , FaSpinner} from 'react-icons/fa';

interface PaymentSummaryData {
  totalAmountProcessed: number;
  totalTransactions: number;
  pendingTransactions: number;
}

interface Transaction {
  _id: string;
  tx_ref: string;
  telegramId: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'processing' | 'paid' | 'rejected';
  createdAt: string;
  type: 'Payment' | 'Withdrawal';
  bank_code?: string;
  account_number?: string;
}

const API_URL = 'https://adminbackend.bingoogame.com/api/payments';
const defaultPaymentSummary: PaymentSummaryData = {
  totalAmountProcessed: 0,
  totalTransactions: 0,
  pendingTransactions: 0,
};
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

export default function PaymentManagementPage() {
  const [summary, setSummary] = useState<PaymentSummaryData>(defaultPaymentSummary);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;
  const [totalPages, setTotalPages] = useState<number>(1);
  const [sortBy, setSortBy] = useState<string>('createdAt');
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
        if (!res.ok) throw new Error(`Failed to fetch summary: ${res.status}`);
        const data = await res.json();
        setSummary({
          totalAmountProcessed: data.totalAmountProcessed || 0,
          totalTransactions: data.totalTransactions || 0,
          pendingTransactions: data.pendingTransactions || 0,
        });
      } catch (err: unknown) {
        console.error('Error fetching payment summary:', err);
        setErrorSummary((err as Error).message);
        setSummary(defaultPaymentSummary);
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

        const res = await fetch(`${API_URL}/all?${queryParams}`);
        if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status}`);
        const data = await res.json();
        setTransactions(data.transactions || []);
        setTotalTransactions(data.totalTransactions || 0);
        setTotalPages(data.totalPages || 1);
      } catch (err: unknown) {
        console.error('Error fetching transaction list:', err);
        setErrorTransactions((err as Error).message);
        setTransactions([]);
        setTotalTransactions(0);
        setTotalPages(1);
      } finally {
        setLoadingTransactions(false);
      }
    };
    fetchTransactions();
  }, [currentPage, sortBy, sortOrder]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  // Full-page loading
  if (loadingSummary || loadingTransactions) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center text-lg font-semibold text-gray-700 bg-white p-6 rounded-lg shadow-md">
          <FaSpinner className="animate-spin mr-2 inline-block" />
          Loading dashboard data... Please wait.
        </div>
      </div>
    );
  }

  // Full-page error
  if (errorSummary || errorTransactions) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center text-lg font-semibold text-red-600 bg-white p-6 rounded-lg shadow-md">
          <p>Error: {errorSummary || errorTransactions}</p>
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
    <div className="mx-auto flex flex-col gap-6 ">
  
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Payment & Withdrawal Management</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 ">
        <Card
          title="Total Amount Processed"
          value={`${summary.totalAmountProcessed.toLocaleString()} Birr`}
          icon="revenue"
        />
        <Card
          title="Total Transactions"
          value={summary.totalTransactions.toLocaleString()}
          icon="games"
        />
        <Card
          title="Pending Transactions"
          value={summary.pendingTransactions.toLocaleString()}
          icon="users"
        />
      </div>

      <div className="max-w-full">
      <PaymentTable
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
