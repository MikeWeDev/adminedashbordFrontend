'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { TransactionTable } from '../../components/TransactionTable';
import { FaMoneyBill, FaUsers, FaGamepad, FaSpinner } from 'react-icons/fa';
import moment from 'moment';

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
    if (new Date().getTime() > expiryTime) {
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      localStorage.removeItem('expiry');
      router.push('/auth/login');
    }
  }, [router]);
}

interface PaymentSummaryData {
  totalAmountProcessed: number;
  totalTransactions: number;
  pendingTransactions: number;
}

interface RawTransaction {
  _id?: string;
  tx_ref?: string;
  telegramId?: string;
  username?: string;
  amount?: number | string;
  status?: string;
  createdAt?: string;
  type?: 'Payment' | 'Withdrawal';
  bank_code?: string;
  account_number?: string;
  method?: 'CBE' | 'Telebirr' | 'Other';
}

interface Transaction {
  _id: string;
  transactionId: string;
  telegramId: string;
  username: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'processing' | 'paid' | 'rejected' | 'approved' | 'completed';
  date: string;
  currency: string;
  type: 'Deposit' | 'Withdrawal';
  bank_code?: string;
  account_number?: string;
  method?: 'CBE' | 'Telebirr' | 'Other';
}
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_URL = `${BASE_URL}/api/payments`;

const defaultSummary: PaymentSummaryData = {
  totalAmountProcessed: 0,
  totalTransactions: 0,
  pendingTransactions: 0,
};

const icons = {
  revenue: <FaMoneyBill />,
  users: <FaUsers />,
  games: <FaGamepad />,
  moneyBill: <FaMoneyBill />,
};

// Modern Card component
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

export default function TransactionHistoryPage() {
  useSessionCheck();

  const [summary, setSummary] = useState<PaymentSummaryData>(defaultSummary);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [dailyDeposit, setDailyDeposit] = useState<number>(0);
  const [dailyWithdrawal, setDailyWithdrawal] = useState<number>(0);

  // Pagination & Sorting states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Sorting handler
  const handleSortChange = (field: string, order: "asc" | "desc") => {
    setSortBy(field);
    setSortOrder(order);
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const dateParam = selectedDate ? moment(selectedDate).format('YYYY-MM-DD') : '';

        const [summaryRes, paymentRes, transactionsRes] = await Promise.all([
          fetch(`${API_URL}/total-summary`),
          fetch(`${API_URL}/summary?date=${dateParam}`),
          fetch(`${API_URL}/all?limit=${itemsPerPage}&page=${currentPage}&sortBy=${sortBy}&sortOrder=${sortOrder}`),
        ]);

        if (!summaryRes.ok) throw new Error('Failed to fetch total summary');
        if (!paymentRes.ok) throw new Error('Failed to fetch daily payment summary');
        if (!transactionsRes.ok) throw new Error('Failed to fetch transactions');

        const summaryData = await summaryRes.json();
        const paymentData = await paymentRes.json();
        const transactionsData = await transactionsRes.json();

        setSummary({
          totalAmountProcessed: summaryData.totalAmountProcessed ?? 0,
          totalTransactions: summaryData.totalTransactions ?? 0,
          pendingTransactions: summaryData.pendingTransactions ?? 0,
        });

        setDailyDeposit(paymentData.totalDeposits ?? 0);
        setDailyWithdrawal(paymentData.totalWithdrawals ?? 0);

        const mappedTransactions: Transaction[] = (transactionsData.transactions || []).map((t: RawTransaction) => ({
          _id: t._id?.toString() || '',
          transactionId: t.tx_ref?.toString() || '',
          telegramId: t.telegramId?.toString() || '',
          username: t.username?.toString() || 'Unknown',
          amount: Number(t.amount) || 0,
          status: t.status as Transaction['status'] || 'pending',
          date: t.createdAt?.toString() || '',
          currency: 'ETB',
          type: t.type === 'Payment' ? 'Deposit' : 'Withdrawal',
          bank_code: t.bank_code?.toString(),
          account_number: t.account_number?.toString(),
          method: t.method,
        }));

        setTransactions(mappedTransactions);
      } catch (err: unknown) {
        console.error(err);
        setError((err as Error).message);
        setSummary(defaultSummary);
        setTransactions([]);
        setDailyDeposit(0);
        setDailyWithdrawal(0);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDate, currentPage, itemsPerPage, sortBy, sortOrder]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100">
        <div className="text-center text-lg font-semibold text-gray-700 bg-white p-6 rounded-xl shadow-lg animate-pulse">
          <FaSpinner className="animate-spin mr-2 inline-block" />
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
    <main className="flex-1 w-full p-4 flex flex-col md:items-center items-start justify-start bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100 min-h-screen transition-all">
      <div className="w-[60%] md:w-full lg:mt-8 flex flex-col gap-6">

        {/* Calendar Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl shadow-md bg-white hover:shadow-xl transition-shadow duration-300 w-full">
          <h3 className="text-lg font-semibold text-gray-700 tracking-wide">Filter by Date</h3>
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => setSelectedDate(date)}
            dateFormat="yyyy/MM/dd"
            placeholderText="Select a date"
            className="cursor-pointer p-3 sm:px-5 sm:py-3 text-gray-900 font-semibold shadow-lg rounded-full
                       bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
                       hover:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-300"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 w-full">
          <Card title="Daily Deposit" value={`${dailyDeposit.toLocaleString()} Birr`} icon="moneyBill" />
          <Card title="Daily Withdrawal" value={`${dailyWithdrawal.toLocaleString()} Birr`} icon="users" />
          <Card title="Total Transactions" value={summary.totalTransactions.toLocaleString()} icon="games" />
          <Card title="Pending Transactions" value={summary.pendingTransactions.toLocaleString()} icon="users" />
          <Card title="Total Amount Processed" value={`${summary.totalAmountProcessed.toLocaleString()} Birr`} icon="revenue" />
        </div>

        {/* Transactions Table */}
        <div className="max-w-full mt-6 bg-white rounded-xl shadow-md p-4 hover:shadow-xl transition-shadow duration-300 overflow-x-auto">
          <TransactionTable
            transactions={transactions}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalTransactions={summary.totalTransactions}
            totalPages={Math.ceil(summary.totalTransactions / itemsPerPage)}
            onPageChange={setCurrentPage}
            onSortChange={handleSortChange}
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
          />
        </div>

      </div>
    </main>
  );
}
