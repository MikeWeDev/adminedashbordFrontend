'use client';

import { useState, useEffect } from 'react';
import { DashboardCard } from '../../components/DashboardCard'; // Reusing your component
import { PaymentTable } from '../../components/PaymentTable'; // New component for the table
import { FaMoneyBillWave, FaExchangeAlt, FaHourglassHalf, FaSpinner } from 'react-icons/fa'; // Icons

// Interface defining the summary data for the Payments dashboard.
interface PaymentSummaryData {
  totalAmountProcessed: number;
  totalTransactions: number;
  pendingTransactions: number;
}

// Interface defining the structure of a single Payment or Withdrawal document.
// This matches your backend schemas.
interface Transaction {
  _id: string;
  tx_ref: string;
  telegramId: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'processing' | 'paid' | 'rejected';
  createdAt: string;
  type: 'Payment' | 'Withdrawal';
  // Additional fields for withdrawals
  bank_code?: string;
  account_number?: string;
}

const API_URL = 'http://localhost:5000/api/payments'; // New backend API URL

const defaultPaymentSummary: PaymentSummaryData = {
  totalAmountProcessed: 0,
  totalTransactions: 0,
  pendingTransactions: 0,
};

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

  // Fetch summary data
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
        console.error("Error fetching payment summary:", err);
        setErrorSummary((err as Error).message);
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummary();
  }, []);

  // Fetch paginated transactions data
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoadingTransactions(true);
        setErrorTransactions(null);
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          sortBy: sortBy,
          sortOrder: sortOrder,
        }).toString();

        const res = await fetch(`${API_URL}/all?${queryParams}`);
        if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status}`);
        const data = await res.json();
        setTransactions(data.transactions || []);
        setTotalTransactions(data.totalTransactions || 0);
        setTotalPages(data.totalPages || 1);
      } catch (err: unknown) {
        console.error("Error fetching transaction list:", err);
        setErrorTransactions((err as Error).message);
      } finally {
        setLoadingTransactions(false);
      }
    };
    fetchTransactions();
  }, [currentPage, sortBy, sortOrder]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  return (
    <main className="bg-gray-100 min-h-screen p-8 ml-64">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Payment & Withdrawal Management</h1>

      {loadingSummary ? (
        <div className="text-center text-gray-600 p-4 rounded-lg bg-white shadow-sm">Loading summary data...</div>
      ) : errorSummary ? (
        <div className="text-center text-red-600 p-4 rounded-lg bg-white shadow-sm">
          Error fetching summary: {errorSummary}.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <DashboardCard
            title="Total Amount Processed"
            value={`${summary.totalAmountProcessed.toLocaleString()} Birr`}
            icon="revenue"
          />
          <DashboardCard
            title="Total Transactions"
            value={summary.totalTransactions.toLocaleString()}
            icon="games" // Using a generic icon, you might have a payment-specific one
          />
          <DashboardCard
            title="Pending Transactions"
            value={summary.pendingTransactions.toLocaleString()}
            icon="users" // Using a generic icon
          />
        </div>
      )}

      {loadingTransactions ? (
        <div className="text-center text-gray-600 mt-8 p-4 rounded-lg bg-white shadow-sm">
          <FaSpinner className="animate-spin inline-block mr-2" /> Loading transaction list...
        </div>
      ) : errorTransactions ? (
        <div className="text-center text-red-600 mt-8 p-4 rounded-lg bg-white shadow-sm">
          Error fetching transactions: {errorTransactions}.
        </div>
      ) : (
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
      )}
    </main>
  );
}