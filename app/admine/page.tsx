'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { UserTable } from '../components/SuperUsertable';
import { FaMoneyBill, FaUsers, FaGamepad, FaChartLine } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';

/* ------------------- Session Check Hook ------------------- */
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

interface User {
  _id: string;
  telegramId: number;
  username: string;
  accountNumber: number;
  phoneNumber: string;
  balance: number;
  registeredAt: string;
  bonus_balance?: number;
}

interface SummaryData {
  profit: number;
  dailyProfit: number;
  users: number;
  gamesPlayed: { [key: number]: number };
  totalGamesToday: number;
  totalBonusBalance: number; 
}

interface GameHistoryEntry {
  _id: string;
  GameSessionId: string;
  gameId: string;
  playersCount: number;
  stakeAmount: number;
  winnerTelegramId: string;
  winnerUsername: string;
  createdAt: string;
  endedAt: string | null;
}

const DASHBOARD_API_URL = 'https://adminbackend.bingoogame.com/api/dashboard';
const PAYMENT_API_URL = 'https://adminbackend.bingoogame.com/api/payments';

const defaultSummary: SummaryData = {
  profit: 0,
  dailyProfit: 0,
  users: 0,
  gamesPlayed: { 10: 0, 20: 0, 30: 0 },
  totalGamesToday: 0,
  totalBonusBalance: 0, 
};

const icons = {
  profit: <FaChartLine />,
  users: <FaUsers />,
  games: <FaGamepad />,
  moneyBill: <FaMoneyBill />,
};

// Card component
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

export default function UserManagementPage() {
  useSessionCheck();

  const [summary, setSummary] = useState<SummaryData>(defaultSummary);
  const [games, setGames] = useState<GameHistoryEntry[]>([]);
  const [dailyDeposit, setDailyDeposit] = useState<number>(0);
  const [dailyWithdrawal, setDailyWithdrawal] = useState<number>(0);
  const [winnerAmount, setWinnerAmount] = useState<number>(0);
  const [totalBonusBalance, setTotalBonusBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table state (keep original logic)
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('registeredAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Calendar state
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const finishedGamesCount = useMemo(() => games.filter(game => game.endedAt && game.playersCount > 0).length, [games]);

  // Fetch summary, games, and payments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        setLoading(true);
        const dateParam = selectedDate ? moment(selectedDate).format('YYYY-MM-DD') : '';

        const [summaryRes, gamesRes, paymentRes] = await Promise.all([
          fetch(`${DASHBOARD_API_URL}/summary?date=${dateParam}`),
          fetch(`${DASHBOARD_API_URL}/games-by-date?date=${dateParam}`),
          fetch(`${PAYMENT_API_URL}/summary?date=${dateParam}`),
        ]);

        if (!summaryRes.ok) throw new Error(`Failed to fetch summary: ${summaryRes.status}`);
        if (!gamesRes.ok) throw new Error(`Failed to fetch games: ${gamesRes.status}`);
        if (!paymentRes.ok) throw new Error(`Failed to fetch payments: ${paymentRes.status}`);

        const summaryData = await summaryRes.json();
        const gamesData = await gamesRes.json();
        const paymentData = await paymentRes.json();
        
        // --- LOG 1: Check summary data for totalBonusBalance ---
        // -----------------------------------------------------

        setSummary({ ...defaultSummary, ...summaryData, gamesPlayed: { ...defaultSummary.gamesPlayed, ...summaryData.gamesPlayed } });
        setGames(gamesData);
        setDailyDeposit(paymentData.totalDeposits ?? 0);
        setDailyWithdrawal(paymentData.totalWithdrawals ?? 0);
        setTotalBonusBalance(summaryData.totalBonusBalance ?? 0); 


        const totalStakes = gamesData.reduce((acc: number, game: GameHistoryEntry) => {
          if (game.endedAt && game.playersCount > 0) return acc + game.stakeAmount * game.playersCount;
          return acc;
        }, 0);

        setWinnerAmount(totalStakes - (summaryData.dailyProfit ?? 0));
      } catch (err: unknown) {
        console.error(err);
        setError((err as Error).message);
        setSummary(defaultSummary);
        setGames([]);
        setDailyDeposit(0);
        setDailyWithdrawal(0);
        setWinnerAmount(0);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDate]);

  // Fetch users table (keep original logic)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const query = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          sortBy,
          sortOrder,
        }).toString();
        const res = await fetch(`${DASHBOARD_API_URL}/users?${query}`);
        if (!res.ok) throw new Error(`Failed to fetch users: ${res.statusText}`);
        const data = await res.json();
        
        // --- LOG 2: Check individual user bonus_balance here ---
        // -----------------------------------------------------

        setUsers(data.users || []);
        setTotalUsers(data.totalUsers || 0);
        setTotalPages(data.totalPages || 1);
      } catch (err: unknown) {
        console.error(err);
      }
    };
    fetchUsers();
  }, [currentPage, itemsPerPage, sortBy, sortOrder]);

  const handlePageChange = (page: number) => page >= 1 && page <= totalPages && setCurrentPage(page);
  const handleSortChange = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100">
        <div className="text-center text-lg font-semibold text-gray-700 bg-white p-6 rounded-xl shadow-lg animate-pulse">
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
          <p className="text-sm text-gray-500 mt-2">Displaying default values due to a data fetching issue.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 w-[80%] lg:w-full p-4 flex flex-col items-center justify-start bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100 min-h-screen transition-all">
      <div className="w-[clamp(250px,100%,900px)] lg:w-full lg:mt-8 flex flex-col gap-6">

        {/* Calendar Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl shadow-md bg-white hover:shadow-xl transition-shadow duration-300 md:w-full w-[80%]">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:w-full w-[80%]">
          <Card
            title="Daily Deposit"
            value={`${Number(dailyDeposit || 0).toLocaleString()} Birr`}
            icon="moneyBill"
          />
          <Card
            title="Daily Withdrawal"
            value={`${Number(dailyWithdrawal || 0).toLocaleString()} Birr`}
            icon="moneyBill"
          />
          <Card
            title="Winner Amount"
            value={`${Number(winnerAmount || 0).toLocaleString()} Birr`}
            icon="moneyBill"
          />
          
          <Card
            title="Daily Profit"
            value={`${Number(summary.dailyProfit || 0).toLocaleString()} Birr`}
            icon="profit"
          />
          <Card
            title="Total Profit"
            value={`${Number(summary.profit || 0).toLocaleString()} Birr`}
            icon="profit"
          />
          <Card
            title="Total Users"
            value={`${Number(summary.users || 0).toLocaleString()}`}
            icon="users"
          />
          <Card
            title="Games Played Today"
            value={`${Number(finishedGamesCount || 0)}`}
            icon="games"
          />
            <Card
            title="Total Bonus Balance"
            value={`${Number(totalBonusBalance || 0).toLocaleString()} Birr`}
            icon="moneyBill" // Use the money icon
          />
        </div>

        {/* Users Table (unchanged) */}
       <div className="max-w-full">
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
