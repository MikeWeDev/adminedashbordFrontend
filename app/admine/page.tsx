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

// Interfaces and default data remain the same
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

// Icons are now defined within the file
const icons = {
  revenue: <FaMoneyBill className="text-3xl sm:text-4xl md:text-5xl text-green-500 flex-shrink-0" />,
  profit: <FaChartLine className="text-3xl sm:text-4xl md:text-5xl text-blue-500 flex-shrink-0" />,
  users: <FaUsers className="text-3xl sm:text-4xl md:text-5xl text-purple-500 flex-shrink-0" />,
  games: <FaGamepad className="text-3xl sm:text-4xl md:text-5xl text-yellow-500 flex-shrink-0" />,
};

// New internal Card component for simplicity
const Card = ({ title, value, icon }: { title: string; value: string | number; icon: keyof typeof icons }) => (
  <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-md flex flex-col sm:flex-row items-center sm:items-start min-w-0">
    <div className="flex-shrink-0 mb-2 sm:mb-0 sm:mr-3">
      {icons[icon]}
    </div>
    <div className="flex-1 min-w-0 text-center sm:text-left">
      <p className="text-gray-500 text-sm sm:text-base md:text-lg truncate">{title}</p>
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold truncate">{value}</h2>
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

        if (!summaryRes.ok) {
          throw new Error(`Failed to fetch summary data: ${summaryRes.status} ${summaryRes.statusText}`);
        }
        if (!gamesRes.ok) {
          throw new Error(`Failed to fetch games data: ${gamesRes.status} ${gamesRes.statusText}`);
        }
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
        console.error('Error fetching dashboard data:', err);
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
        <div className="text-center text-xl font-semibold text-gray-700 p-6 rounded-lg shadow-md bg-white">
          Loading dashboard data... Please wait.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center text-xl font-semibold text-red-600 p-6 rounded-lg shadow-md bg-white">
          <p>Error: {error}</p>
          <p className="text-sm text-gray-500 mt-2">
            Displaying default values due to a data fetching issue. Please check the backend server and network connection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-gray-100 min-h-screen p-4 md:p-6 lg:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Admin Dashboard Overview</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card title="Total Revenue" value={`${summary.revenue.toLocaleString()} Birr`} icon="revenue" />
          <Card title="Total Profit" value={`${summary.profit.toLocaleString()} Birr`} icon="profit" />
          <Card title="Total Users" value={summary.users.toLocaleString()} icon="users" />
          <Card title="Games Played Today" value={`${summary.totalGamesToday}`} icon="games" />
        </div>
        <div>
          <DashboardTable games={games} />
        </div>
      </div>
    </main>
  );
}