'use client';

import { useState, useEffect } from 'react';
import { DashboardCard } from '../../components/DashboardCard'; // Reusing DashboardCard for summary
import { TransactionTable } from '../../components/TransactionTable'; // New TransactionTable component

/**
 * Interface defining the summary data for the Transaction History dashboard.
 * This aligns with the new metrics added to the backend's `/api/dashboard/summary`.
 */
interface TransactionSummaryData {
  totalDepositAmount: number; // Total successful deposit amount
  totalWithdrawalAmount: number; // Total successful withdrawal amount (paid/processing)
  totalPendingTransactions: number; // Count of pending deposits and withdrawals
}

/**
 * Interface defining the common structure for combined transaction data.
 * UPDATED: Added `username` to align with backend and TransactionTable.
 */
interface Transaction {
  _id: string;
  transactionId: string;
  type: 'Deposit' | 'Withdrawal';
  amount: number;
  status: string;
  telegramId: string;
  username: string;
  date: string; // Date of the transaction (createdAt field)
  currency: string;
  bank_code?: string;
  account_name?: string;
  account_number?: string;
}

const API_URL = 'http://localhost:5000/api/dashboard'; // For summary cards
const TRANSACTIONS_API_URL = 'http://localhost:5000/api/transactions'; // For combined transactions table

/**
 * Default summary values for the Transaction History page.
 */
const defaultTransactionSummary: TransactionSummaryData = {
  totalDepositAmount: 0,
  totalWithdrawalAmount: 0,
  totalPendingTransactions: 0,
};

export default function TransactionHistoryPage() {
  // State for summary cards
  const [summary, setSummary] = useState<TransactionSummaryData>(defaultTransactionSummary);
  // State for the transaction list and pagination
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10); // Default items per page
  const [totalPages, setTotalPages] = useState<number>(1);
  // State for sorting
  const [sortBy, setSortBy] = useState<string>('date'); // Default sort field for transactions (date)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Default sort order (descending for date)

  const [loadingSummary, setLoadingSummary] = useState<boolean>(true);
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(true);
  const [errorSummary, setErrorSummary] = useState<string | null>(null);
  const [errorTransactions, setErrorTransactions] = useState<string | null>(null);

  /**
   * useEffect to fetch transaction summary data.
   * This runs once on component mount.
   */
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoadingSummary(true);
        setErrorSummary(null);
        const res = await fetch(`${API_URL}/summary`);
        if (!res.ok) {
          throw new Error(`Failed to fetch summary: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        setSummary({
          totalDepositAmount: data.totalDepositAmount || 0,
          totalWithdrawalAmount: data.totalWithdrawalAmount || 0,
          totalPendingTransactions: data.totalPendingTransactions || 0,
        });
      } catch (err: any) {
        console.error("Error fetching transaction summary data:", err);
        setErrorSummary(err.message);
        setSummary(defaultTransactionSummary); // Fallback to defaults on error
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummary();
  }, []);

  /**
   * useEffect to fetch paginated transaction list data.
   * This runs on mount and whenever `currentPage`, `itemsPerPage`, `sortBy`, or `sortOrder` changes.
   */
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

        const res = await fetch(`${TRANSACTIONS_API_URL}?${queryParams}`); // Use TRANSACTIONS_API_URL
        if (!res.ok) {
          throw new Error(`Failed to fetch transactions: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        setTransactions(data.transactions || []);
        setTotalTransactions(data.totalTransactions || 0);
        setTotalPages(data.totalPages || 1);
      } catch (err: any) {
        console.error("Error fetching transaction list:", err);
        setErrorTransactions(err.message);
        setTransactions([]); // Clear transactions on error
        setTotalTransactions(0); // ⭐ FIX: Changed setTotalUsers to setTotalTransactions
        setTotalPages(1);
      } finally {
        setLoadingTransactions(false);
      }
    };
    fetchTransactions();
  }, [currentPage, itemsPerPage, sortBy, sortOrder]);

  // Handle page change for TransactionTable
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle sort change for TransactionTable
  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1); // Reset to first page on sort change
  };

  return (
    // The pl-64 class provides space for the fixed sidebar
    <main className="bg-gray-100 min-h-screen p-8 ml-64">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Transaction History</h1>

      {/* Summary Cards Section */}
      {/* This section's content is conditionally rendered based on its loading/error state. */}
      {/* The cards will display default values (0, N/A) when loading or on error,
          as `summary` is always initialized and falls back to `defaultTransactionSummary`. */}
      {loadingSummary ? (
        <div className="text-center text-gray-600 p-4 rounded-lg bg-white shadow-sm">Loading transaction summary...</div>
      ) : errorSummary ? (
        <div className="text-center text-red-600 p-4 rounded-lg bg-white shadow-sm">
          Error fetching transaction summary: {errorSummary}. Displaying defaults.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <DashboardCard
            title="Total Deposits"
            value={`${summary.totalDepositAmount.toLocaleString()} Birr`}
            icon="revenue"
          />
          <DashboardCard
            title="Total Withdrawals"
            value={`${summary.totalWithdrawalAmount.toLocaleString()} Birr`}
            icon="revenue" // ⭐ FIX: Changed "money" to "revenue" (a valid icon type)
          />
          <DashboardCard
            title="Pending Transactions"
            value={`${summary.totalPendingTransactions.toLocaleString()} Items`}
            icon="profit"
          />
        </div>
      )}

      {/* Transactions Table Section */}
      {loadingTransactions ? (
        <div className="text-center text-gray-600 mt-8 p-4 rounded-lg bg-white shadow-sm">Loading transactions list...</div>
      ) : errorTransactions ? (
        <div className="text-center text-red-600 mt-8 p-4 rounded-lg bg-white shadow-sm">
          Error fetching transactions: {errorTransactions}.
        </div>
      ) : (
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
      )}
    </main>
  );
}
