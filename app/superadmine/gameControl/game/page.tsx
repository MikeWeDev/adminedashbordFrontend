'use client';

import { useEffect, useMemo, useState,useCallback } from 'react';
import { 
  FaGamepad, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaUsers, 
  FaPowerOff, 
  FaTimes, 
  FaCircleNotch 
} from 'react-icons/fa';
import GameTable, { GameRow, SortOrder } from '../../../components/GameTable';

// 👉 Backend configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_BASE = `${BASE_URL}/api/admin`;

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

function Card({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: keyof typeof icons;
}) {
  return (
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
}

export default function GameManagementPage() {

  // --- 1. Table & Summary State ---
  const [games, setGames] = useState<GameRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState<keyof GameRow>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [summary, setSummary] = useState<Summary>({
    totalGames: 0,
    activeGames: 0,
    inactiveGames: 0,
    activePlayers: 0,
  });


// Replace your current state definition with this:
const [selectedGamePlayers, setSelectedGamePlayers] = useState<{ 
  id: string, 
  isLive?: boolean,
  totalPlayers?: number, // ⭐ Added
  paidCount?: number,    // ⭐ Added
 list: Array<{ 
  telegramId: string; 
  username?: string; 
  status?: string; 
  paid: boolean;
  paidAmount?: number;
  cards?: any[];
}>

} | null>(null);
const [viewLoading, setViewLoading] = useState(false);

  // --- 3. System Control State ---
  const [allowNewGames, setAllowNewGames] = useState<boolean | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
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

  // --- 4. API Actions ---

const fetchGames = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    const res = await fetch(`${API_BASE}/games?${query}`, { cache: 'no-store' });
    const data: GamesResponse = await res.json();
setGames(data.data);
setSummary(data.summary);
setTotalPages(data.totalPages);
setTotalItems(data.totalItems);
  } catch (e: unknown) {
    setError(e instanceof Error ? e.message : 'Unknown err');
  } finally {
    setLoading(false);
  }
}, [query]); // query is a dependency because fetchGames use

const fetchToggleState = useCallback(async () => {
  try {
    const res = await fetch(`${API_BASE}/system/rounds`, { cache: 'no-store' });
    if (res.ok) {
      const j = await res.json();
      setAllowNewGames(!!j.allowNewGames);
    }
  } catch { /* Silent fail */ }
}, []);




  const viewPlayers = async (id: string) => {
    setViewLoading(true);

    try {
      const res = await fetch(`${API_BASE}/games/${id}/players`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const data = await res.json();

      // ⭐ Map backend → frontend structure
     const mappedPlayers = (data.players || []).map((p: any) => ({
        telegramId: String(p.telegramId),
        username: p.username,
        status: p.status,
        cards: p.cards || [],
        paid: !!p.paid,
        paidAmount: p.paidAmount || 0
      }));

       console.log("✅ MAPPED PLAYERS:", mappedPlayers);
       console.log("DEBUG DATA:", data.debug);


      setSelectedGamePlayers({
        id: data.sessionId || data.gameId,
        isLive: data.isLive,
        totalPlayers: data.totalPlayers || mappedPlayers.length,
        paidCount:
          data.paidCount ??
          mappedPlayers.filter((p: any) => p.hasPaid).length,
        list: mappedPlayers
      });
      console.log('Fetched Players:', mappedPlayers);


    } catch (err) {
      console.error("Frontend Fetch Error:", err);
    } finally {
      setViewLoading(false);
    }
  };


  const endGame = async (id: string) => {
    const confirmEnd = confirm('End this game session now?');
    if (!confirmEnd) return;
    const res = await fetch(`${API_BASE}/games/${id}/end`, { method: 'PUT' });
    if (!res.ok) {
      const msg = await res.text();
      alert(`Failed: ${msg}`);
      return;
    }
    await fetchGames();
  };

  const toggleFutureRounds = async () => {
    if (allowNewGames === null) return;
    setToggleLoading(true);
    try {
      const path = allowNewGames ? 'disable' : 'enable';
      const res = await fetch(`${API_BASE}/system/rounds/${path}`, { method: 'PUT' });
      if (!res.ok) throw new Error("Toggle failed");
      await fetchToggleState();
      await fetchGames();
    } catch (e) {
      alert("System control update failed.");
    } finally {
      setToggleLoading(false);
    }
  };

 // --- 5. Lifecycle ---
useEffect(() => { 
  fetchGames(); 
}, [fetchGames]); // Now safe to include

useEffect(() => { 
  fetchToggleState(); 
}, [fetchToggleState]); // Now safe to include

  // --- 6. Handlers ---
  const onPageChange = (next: number) => { if (next >= 1 && next <= totalPages) setPage(next); };
  const onSortChange = (field: keyof GameRow) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  if (loading && games.length === 0) {
    return (
      <main className="p-6 flex items-center justify-center min-h-screen">
        <FaCircleNotch className="animate-spin text-indigo-600 text-4xl" />
      </main>
    );
  }

  return (
    <main className="flex-1 w-full p-6 bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100 min-h-screen relative">
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <Card title="Total Games" value={summary.totalGames} icon="games" />
          <Card title="Active Games" value={summary.activeGames} icon="active" />
          <Card title="Inactive Games" value={summary.inactiveGames} icon="inactive" />
          <Card title="Players in Active" value={summary.activePlayers} icon="players" />
        </div>

        {/* Global Toggle */}
        <div className="bg-white rounded-xl shadow-md p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full transform transition-all hover:shadow-xl">
          <div>
            <p className="text-gray-700 font-semibold text-lg uppercase tracking-tight">System Status</p>
            <p className={`text-sm font-medium ${allowNewGames ? "text-green-600" : "text-red-500"}`}>
              {allowNewGames === null ? "Checking..." : allowNewGames ? "● New rounds are enabled" : "○ New rounds are currently blocked"}
            </p>
          </div>
          <button
            disabled={allowNewGames === null || toggleLoading}
            onClick={toggleFutureRounds}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-white font-bold transition shadow-md active:scale-95 ${
              allowNewGames ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700"
            } disabled:opacity-50`}
          >
            {toggleLoading ? <FaCircleNotch className="animate-spin" /> : <FaPowerOff />}
            {allowNewGames ? "Shutdown Future Rounds" : "Resume Future Rounds"}
          </button>
        </div>

        {/* Game Table */}
        <div className="mt-4 bg-white rounded-xl shadow-md overflow-hidden transition-shadow hover:shadow-xl">
          <GameTable
            rows={games}
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={onPageChange}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={onSortChange}
            onEndGame={endGame}
            onViewPlayers={viewPlayers}
          />
        </div>
      </div>

      {/* --- PLAYER LIST MODAL --- */}
    {selectedGamePlayers && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="p-5 border-b flex justify-between items-center bg-gray-50">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xl text-gray-800">Session Players</h3>
                {/* Added Live Indicator */}
                {selectedGamePlayers.isLive && (
                  <span className="flex items-center gap-1 bg-green-100 text-green-600 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                    ● LIVE
                  </span>
                )}
              </div>
              <div className="flex gap-2 mt-2">
      <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded">
        TOTAL: {selectedGamePlayers.totalPlayers || 0}
      </span>
      <span className="text-[10px] font-bold px-2 py-0.5 bg-green-50 text-green-600 border border-green-100 rounded">
        PAID: {selectedGamePlayers.paidCount || 0}
      </span>
      <span className="text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded">
        UNPAID: {(selectedGamePlayers.totalPlayers || 0) - (selectedGamePlayers.paidCount || 0)}
      </span>
              </div>  
            <p className="text-xs text-indigo-600 font-mono mt-1">ID: {selectedGamePlayers.id}</p>
            </div>
            <button onClick={() => setSelectedGamePlayers(null)} className="p-2 hover:bg-gray-200 rounded-full text-gray-400">
              <FaTimes className="text-xl" />
            </button>
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto">
            {selectedGamePlayers.list.length > 0 ? (
              <table className="w-full text-left">
                <thead className="bg-gray-100 text-[10px] uppercase text-gray-500 sticky top-0">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Telegram ID</th>
                    <th className="px-6 py-3">Cards</th>
                    <th className='px-6 py-3'>Paid</th>
                    <th className="px-6 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedGamePlayers.list.map((player, index) => (
                    <tr key={index} className="hover:bg-indigo-50/30 transition">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900">{player.username || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        {player.telegramId}
                      </td>
                      <td className="px-6 py-4">
                        {/* Render cards as a comma-separated list */}
                        <div className="flex flex-wrap gap-1">
                          {player.cards && player.cards.length > 0 ? (
                            player.cards.map((c, i) => (
                              <span key={i} className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded border">
                                {c}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-300 text-xs">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {player.paid ? (
                              <div className="flex flex-col gap-1">
                                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-bold px-2 py-1 rounded border border-green-200">
                                  <FaCheckCircle className="text-[8px]" /> PAID
                                </span>
                                <span className="text-[10px] text-green-600 font-mono">
                                  {player.paidAmount} ETB
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-[10px] font-bold px-2 py-1 rounded border border-red-200">
                                <FaTimesCircle className="text-[8px]" /> UNPAID
                              </span>
                            )}
                        </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          player.status === 'Winner' || player.status === 'winner' 
                            ? 'bg-yellow-100 text-yellow-700' 
                            : player.status === 'connected' || player.status === 'Live'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {player.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-20 text-center text-gray-400">
                <FaUsers className="mx-auto text-5xl mb-3 opacity-10" />
                <p className="text-sm">No players found for this session.</p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t bg-gray-50 text-right">
            <button onClick={() => setSelectedGamePlayers(null)} className="bg-indigo-600 text-white px-8 py-2 rounded-lg font-semibold">
              Close
            </button>
          </div>
        </div>
      </div>
    )}

      {/* Loading overlay for fetching players */}
      {viewLoading && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-[1px] flex items-center justify-center z-[1000]">
           <FaCircleNotch className="animate-spin text-indigo-600 text-4xl" />
        </div>
      )}
    </main>
  );
}