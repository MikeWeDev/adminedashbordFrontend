'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { DashboardCard } from '../components/DashboardCard';
import { DashboardTable } from '../components/DashboardTable';

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
/* ----------------------------------------------------------- */

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

        if (!summaryRes.ok)
          throw new Error(`Failed to fetch summary data: ${summaryRes.status}`);
        if (!gamesRes.ok)
          throw new Error(`Failed to fetch games data: ${gamesRes.status}`);

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

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center text-xl font-semibold text-gray-700 p-6 rounded-lg shadow-md bg-white">
          Loading dashboard data... Please wait.
        </div>
      </div>
    );

  if (error)
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

  return (
    <main className="bg-gray-100 min-h-[100vh] sm:min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Page Title */}
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-800">
        Admin Dashboard Overview
      </h1>

      {/* Cards Section: centered and responsive */}
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          <DashboardCard
            title="Total Revenue"
            value={`${summary.revenue.toLocaleString()} Birr`}
            icon="revenue"
          />
          <DashboardCard
            title="Total Profit"
            value={`${summary.profit.toLocaleString()} Birr`}
            icon="profit"
          />
          <DashboardCard
            title="Total Users"
            value={summary.users.toLocaleString()}
            icon="users"
          />
          <DashboardCard
            title="Games Played Today"
            value={`${summary.totalGamesToday}`}
            icon="games"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 overflow-x-auto mt-8">
        <DashboardTable games={games} />
      </div>
    </main>
  );
}
