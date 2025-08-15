'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { DashboardTable } from '../components/DashboardTable';
import { FaMoneyBill, FaChartLine, FaUsers, FaGamepad } from 'react-icons/fa';

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
    const now = new Date().getTime();
    if (now > expiryTime) {
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      localStorage.removeItem('expiry');
      router.push('/auth/login');
    }
  }, [router]);
}

interface SummaryData {
  revenue: number;
  profit: number;
  users: number;
  gamesPlayed: { [key: number]: number };
  totalGamesToday: number;
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
const API_URL = 'https://adminedashbordbackend.onrender.com/api/dashboard';
const defaultSummary: SummaryData = {
  revenue: 0,
  profit: 0,
  users: 0,
  gamesPlayed: { 10: 0, 20: 0, 30: 0 },
  totalGamesToday: 0,
};

const icons = {
  revenue: <FaMoneyBill className="text-2xl sm:text-3xl text-green-500 flex-shrink-0" />,
  profit: <FaChartLine className="text-2xl sm:text-3xl text-blue-500 flex-shrink-0" />,
  users: <FaUsers className="text-2xl sm:text-3xl text-purple-500 flex-shrink-0" />,
  games: <FaGamepad className="text-2xl sm:text-3xl text-yellow-500 flex-shrink-0" />,
};

const Card = ({ title, value, icon }: { title: string; value: string | number; icon: keyof typeof icons }) => (
  <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center sm:flex-row sm:items-start w-1/2 ">
    <div className="mb-2 sm:mb-0 sm:mr-3">{icons[icon]}</div>
    <div className="text-center sm:text-left">
      <p className="text-gray-500 text-sm truncate">{title}</p>
      <h2 className="text-lg font-bold truncate">{value}</h2>
    </div>
  </div>
);

export default function Home() {
  useSessionCheck();
  const [summary, setSummary] = useState<SummaryData>(defaultSummary);
  const [games, setGames] = useState<GameHistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        setLoading(true);
        const [summaryRes, gamesRes] = await Promise.all([
          fetch(`${API_URL}/summary`),
          fetch(`${API_URL}/games-today`),
        ]);
        if (!summaryRes.ok) throw new Error(`Failed to fetch summary data`);
        if (!gamesRes.ok) throw new Error(`Failed to fetch games data`);

        const summaryData = await summaryRes.json();
        const gamesData = await gamesRes.json();

        setSummary({
          ...defaultSummary,
          ...summaryData,
          gamesPlayed: {
            ...defaultSummary.gamesPlayed,
            ...summaryData.gamesPlayed,
          },
        });
        setGames(gamesData);
      } catch (err: unknown) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center text-lg font-semibold text-gray-700 bg-white p-6 rounded-lg shadow-md">
          Loading dashboard data... Please wait.
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
    <main className="bg-gray-100 min-h-screen p-4 overflow-hidden">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4">
          <Card title="Total Revenue" value={`${summary.revenue.toLocaleString()} Birr`} icon="revenue" />
          <Card title="Total Profit" value={`${summary.profit.toLocaleString()} Birr`} icon="profit" />
          <Card title="Total Users" value={summary.users.toLocaleString()} icon="users" />
          <Card title="Games Played Today" value={`${summary.totalGamesToday}`} icon="games" />
        </div>

        {/* Games Table */}
        <div className="w-full">
          <DashboardTable games={games} />
        </div>
      </div>
    </main>
  );
}
