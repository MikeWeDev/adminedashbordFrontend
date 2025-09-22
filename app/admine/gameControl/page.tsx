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
    games: <FaGamepad className="text-2xl sm:text-3xl text-purple-500" />,
    active: <FaCheckCircle className="text-2xl sm:text-3xl text-green-600" />,
    inactive: <FaTimesCircle className="text-2xl sm:text-3xl text-red-600" />,
    players: <FaUsers className="text-2xl sm:text-3xl text-blue-600" />,
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
        <div className="bg-white p-4 rounded-lg shadow-md flex items-center gap-3 w-3/4 md:full ">
            {icons[icon]}
            <div>
                <p className="text-gray-500 text-sm">{title}</p>
                <h2 className="text-lg font-bold text-black">{value}</h2>
            </div>
        </div>
    );
}

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
        <main className="flex-1 w-[70%] lg:w-[90%] p-4 flex items-start justify-start">
            <div className="w-[clamp(250px,100%,1000px)] lg:w-full lg:mt-8">
                <div className="mx-auto flex flex-col gap-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card title="Total Games" value={summary.totalGames} icon="games" />
                        <Card title="Active Games" value={summary.activeGames} icon="active" />
                        <Card title="Inactive Games" value={summary.inactiveGames} icon="inactive" />
                        <Card title="Players in Active" value={summary.activePlayers} icon="players" />
                    </div>

                    {/* Game Table */}
                    <div className=" mt-4 overflow-x-auto bg-white rounded-lg shadow">
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
            </div>
        </main>
    );
}