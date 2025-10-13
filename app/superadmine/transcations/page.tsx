'use client';

import { useState, useEffect } from 'react';
import { PaymentTable } from '../../components/PaymentTable';
import { FaMoneyBill, FaUsers, FaGamepad, FaSpinner } from 'react-icons/fa';

/* ------------------- Icons & Card ------------------- */
const icons = {
    revenue: <FaMoneyBill />,
    users: <FaUsers />,
    games: <FaGamepad />,
    moneyBill: <FaMoneyBill />,
};

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

interface PaymentSummaryData {
    totalAmountProcessed: number;
    totalTransactions: number;
    pendingTransactions: number;
}

interface Transaction {
    _id: string;
    tx_ref: string;
    telegramId: string;
    username?: string;
    amount: number;
    status: 'pending' | 'success' | 'failed' | 'processing' | 'paid' | 'rejected' | 'approved' | 'completed';
    createdAt: string;
    type: 'Payment' | 'Withdrawal';
    bank_code?: string;
    account_number?: string;
    method?: 'CBE' | 'Telebirr' | 'Other';
}
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_URL = `${BASE_URL}/api/payments`;
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

    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [dailyDeposits, setDailyDeposits] = useState<number | null>(null);
    const [dailyWithdrawals, setDailyWithdrawals] = useState<number | null>(null);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                setLoadingSummary(true);
                setErrorSummary(null);
                const res = await fetch(`${API_URL}/summary?date=${selectedDate}`);
                if (!res.ok) throw new Error(`Failed to fetch summary: ${res.status}`);
                const data = await res.json();
                setDailyDeposits(data.totalDeposits || 0);
                setDailyWithdrawals(data.totalWithdrawals || 0);

                const totalRes = await fetch(`${API_URL}/total-summary`);
                const totalData = await totalRes.json();
                setSummary({
                    totalAmountProcessed: totalData.totalAmountProcessed || 0,
                    totalTransactions: totalData.totalTransactions || 0,
                    pendingTransactions: totalData.pendingTransactions || 0,
                });

            } catch (err: unknown) {
                console.error('Error fetching payment summary:', err);
                setErrorSummary((err as Error).message);
                setDailyDeposits(null);
                setDailyWithdrawals(null);
                setSummary(defaultPaymentSummary);
            } finally {
                setLoadingSummary(false);
            }
        };
        fetchSummary();
    }, [selectedDate]);

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

    if (loadingSummary || loadingTransactions) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100">
                <div className="text-center text-lg font-semibold text-gray-700 bg-white p-6 rounded-xl shadow-lg animate-pulse">
                    <FaSpinner className="animate-spin mr-2 inline-block" />
                    Loading dashboard data... Please wait.
                </div>
            </div>
        );
    }

    if (errorSummary || errorTransactions) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center text-lg font-semibold text-red-600 bg-white p-6 rounded-xl shadow-lg">
                    <p>Error: {errorSummary || errorTransactions}</p>
                    <p className="text-sm text-gray-500 mt-2">
                        Displaying default values due to a data fetching issue.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <main className="flex-1 w-[100%] md:w-[90%] lg:w-full p-4 flex flex-col items-start justify-start bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100 min-h-screen transition-all">
            <div className="w-[55%] md:w-[90%] lg:mt-8 flex flex-col gap-6 ">

                {/* Date Picker */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl shadow-md bg-white hover:shadow-xl transition-shadow duration-300 w-full ">
                    <h3 className="text-lg font-semibold text-gray-700 tracking-wide">Filter by Date</h3>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="cursor-pointer p-3 sm:px-5 sm:py-3 text-gray-900 font-semibold shadow-lg rounded-full
                                   bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
                                   hover:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-300"
                    />
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 w-full">
                    <Card title="Daily Deposit" value={`${dailyDeposits?.toLocaleString()} Birr`} icon="moneyBill" />
                    <Card title="Daily Withdrawal" value={`${dailyWithdrawals?.toLocaleString()} Birr`} icon="users" />
                    <Card title="Total Transactions" value={summary.totalTransactions.toLocaleString()} icon="games" />
                    <Card title="Pending Transactions" value={summary.pendingTransactions.toLocaleString()} icon="users" />
                    <Card title="Total Amount Processed" value={`${summary.totalAmountProcessed.toLocaleString()} Birr`} icon="revenue" />
                </div>

                {/* Transactions Table */}
                <div className="max-w-full mt-6 bg-white rounded-xl shadow-md p-4 hover:shadow-xl transition-shadow duration-300 ">
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
        </main>
    );
}
