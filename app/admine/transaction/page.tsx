'use client';

import { useState, useEffect } from 'react';
import { TransactionTable } from '../../components/TransactionTable'; // Table stays external

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

// Self-contained Card component
const Card = ({ title, value }: { title: string; value: string | number }) => (
  <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center sm:flex-row sm:items-start w-2/3">
    <div className="text-center sm:text-left">
      <p className="text-gray-500 text-sm truncate">{title}</p>
      <h2 className="text-lg font-bold truncate">{value}</h2>
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

  return (
    <main className="flex-1 w-[70%] p-4 flex items-start justify-start">
      <div className="w-[clamp(250px,100%,800px)] mx-auto flex flex-col gap-6">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Transaction History</h1>

        {/* Summary Cards */}
        {loadingSummary ? (
          <div className="text-center text-gray-600 p-4 rounded-lg bg-white shadow-sm">
            Loading transaction summary...
          </div>
        ) : errorSummary ? (
          <div className="text-center text-red-600 p-4 rounded-lg bg-white shadow-sm">
            Error fetching transaction summary: {errorSummary}. Displaying defaults.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card title="Total Deposits" value={`${summary.totalDepositAmount.toLocaleString()} Birr`} />
            <Card title="Total Withdrawals" value={`${summary.totalWithdrawalAmount.toLocaleString()} Birr`} />
            <Card title="Pending Transactions" value={`${summary.totalPendingTransactions.toLocaleString()} Items`} />
          </div>
        )}

        {/* Transactions Table */}
        {loadingTransactions ? (
          <div className="text-center text-gray-600 mt-8 p-4 rounded-lg bg-white shadow-sm">
            Loading transactions list...
          </div>
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
      </div>
    </main>
  );
}
