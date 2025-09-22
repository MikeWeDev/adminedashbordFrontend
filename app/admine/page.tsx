'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { DashboardTable } from '../components/DashboardTable';
import { FaMoneyBill, FaChartLine, FaUsers, FaGamepad } from 'react-icons/fa';
import moment from 'moment';

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
    profit: number;
    dailyProfit: number;
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
const API_URL = 'https://adminbackend.bingoogame.com/api/dashboard';

const defaultSummary: SummaryData = {
    profit: 0,
    dailyProfit: 0,
    users: 0,
    gamesPlayed: { 10: 0, 20: 0, 30: 0 },
    totalGamesToday: 0,
};

const icons = {
    profit: <FaChartLine className="text-2xl sm:text-3xl text-blue-500 flex-shrink-0" />,
    users: <FaUsers className="text-2xl sm:text-3xl text-purple-500 flex-shrink-0" />,
    games: <FaGamepad className="text-2xl sm:text-3xl text-yellow-500 flex-shrink-0" />,
};

const Card = ({ title, value, icon }: { title: string; value: string | number; icon: keyof typeof icons }) => (
    <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center sm:flex-row sm:items-start w-[80%] md:w-full">
        <div className="mb-2 sm:mb-0 sm:mr-3">{icons[icon]}</div>
        <div className="text-center sm:text-left">
            <p className="text-gray-500 text-sm truncate">{title}</p>
            <h2 className="text-lg font-bold truncate text-black">{value}</h2>
        </div>
    </div>
);

export default function Home() {
    useSessionCheck();
    const [summary, setSummary] = useState<SummaryData>(defaultSummary);
    const [games, setGames] = useState<GameHistoryEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

    useEffect(() => {
        const fetchData = async () => {
            try {
                setError(null);
                setLoading(true);

                const dateParam = selectedDate ? moment(selectedDate).format('YYYY-MM-DD') : '';

                const [summaryRes, gamesRes] = await Promise.all([
                    // Pass the date as a query parameter for both endpoints
                    fetch(`${API_URL}/summary?date=${dateParam}`),
                    fetch(`${API_URL}/games-by-date?date=${dateParam}`),
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
    }, [selectedDate]); // Re-fetch data when the selected date changes

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
        <main className="flex-1 w-[90%] lg:w-full p-4 flex items-start justify-start">
            <div className="w-[clamp(250px,100%,800px)] lg:w-full lg:mt-8">
                <div className="mx-auto flex flex-col gap-6 ">
                    {/* Calendar Filter */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg shadow-md bg-white">
                        <h3 className="text-lg font-semibold text-gray-700">Filter by Date</h3>
                        <DatePicker
                            selected={selectedDate}
                            onChange={(date: Date | null) => setSelectedDate(date)}
                            dateFormat="yyyy/MM/dd"
                            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto text-black"
                            placeholderText="Select a date"
                        />
                    </div>
                    
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 ">
                        <Card title="Daily Profit" value={`${summary.dailyProfit.toLocaleString()} Birr`} icon="profit" />
                        <Card title="Total Profit" value={`${summary.profit.toLocaleString()} Birr`} icon="profit" />
                        <Card title="Total Users" value={summary.users.toLocaleString()} icon="users" />
                        <Card title="Games Played Today" value={`${summary.totalGamesToday}`} icon="games" />
                    </div>

                    {/* Games Table */}
                    <div className="max-w-full">
                        <DashboardTable games={games} />
                    </div>
                </div>
            </div>
        </main>
    );
}