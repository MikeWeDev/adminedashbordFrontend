'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaGamepad, FaCheckCircle, FaTimesCircle, FaUsers } from 'react-icons/fa';
import GameTable, { GameRow, SortOrder } from '../../components/GameTableAdmine';

// 👉 Set your backend base once here:
const API_BASE = 'https://adminbackend.bingoogame.com/api/admin';

type Summary = {
  totalGames: number;
  activeGames: number;
  inactiveGames: number;
  activePlayers: number;
};

type GamesResponse = {
  data: GameRow[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  summary: Summary;
};

const icons = {
  games: <FaGamepad />,
  active: <FaCheckCircle />,
  inactive: <FaTimesCircle />,
  players: <FaUsers />,
};

// 🔹 Attractive Card (same style as dashboard)
const Card = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: keyof typeof icons;
}) => (
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

export default function GameManagementPage() {
  const router = useRouter();

  // table state
  const [games, setGames] = useState<GameRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // sorting (default: createdAt desc)
  const [sortBy, setSortBy] = useState<keyof GameRow>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // cards
  const [summary, setSummary] = useState<Summary>({
    totalGames: 0,
    activeGames: 0,
    inactiveGames: 0,
    activePlayers: 0,
  });

  // load games
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set('page', String(page));
    p.set('limit', String(limit));
    p.set('sortBy', String(sortBy));
    p.set('sortOrder', sortOrder);
    return p.toString();
  }, [page, limit, sortBy, sortOrder]);

  async function fetchGames() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/games?${query}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to fetch games: ${res.statusText}`);
      const data: GamesResponse = await res.json();

      setGames(data.data);
      setSummary(data.summary);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(String(e) || 'Unknown error');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGames();
  }, [query]);

  // Table handlers
  const onPageChange = (next: number) => {
    if (next >= 1 && next <= totalPages) setPage(next);
  };

  const onSortChange = (field: keyof GameRow) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  if (loading) {
    return (
      <main className="p-6">
        <div className="bg-white p-6 rounded-lg shadow text-gray-700">Loading games…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6">
        <div className="bg-white p-6 rounded-lg shadow text-red-600">
          <p className="font-semibold">Error</p>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full p-6 bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 w-[70%] md:w-full">
          <Card title="Total Games" value={summary.totalGames} icon="games" />
          <Card title="Active Games" value={summary.activeGames} icon="active" />
          <Card title="Inactive Games" value={summary.inactiveGames} icon="inactive" />
          <Card title="Players in Active" value={summary.activePlayers} icon="players" />
        </div>

        {/* Game Table */}
        <div className="mt-4 overflow-x-auto bg-white rounded-xl shadow-md p-4 hover:shadow-xl transition-shadow duration-300">
          <GameTable
            rows={games}
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={onPageChange}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={onSortChange}
          />
        </div>
      </div>
    </main>
  );
}
