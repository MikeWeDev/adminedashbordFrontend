'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Zap, Trophy, DollarSign, Loader2, AlertTriangle } from 'lucide-react';

// --- Type Definitions for the Data 
interface DailyPayout {
    _id: string;
    telegramId: string;
    amount: number;
    createdAt: string;
    details: {
        winsIn24h: number;
    };
}

interface WeeklyWinner {
    telegramId: string;
    amount?: number; // Optional in history
    rank: number;
    username: string;
    totalWins: number;
    payoutDate?: string; 
    rewardAmount: number;
}

interface WeeklyHistoryGroup {
    weekOfYear: number;
    winners: WeeklyWinner[];
}

type PayoutType = 'daily' | 'weekly-history' | 'weekly-admin';

// --- Utility Function ---
const getCurrentWeekNumber = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const diff = (now.getTime() - startOfYear.getTime() + 86400000) / (1000 * 60 * 60 * 24); 
    return Math.ceil(diff / 7);
};

// --- API Helper Types ---
type WeeklyAdminSuccess = { error?: false; message?: string; data: WeeklyWinner[]; week: number };
type WeeklyAdminError = { error: true; message: string; week?: number };
type WeeklyAdminResponse = WeeklyAdminSuccess | WeeklyAdminError;

// Type for a successful daily/weekly history fetch - REMOVED: No longer needed with strong overloads

// Function Overloads for Type Safety (Keep these)
async function fetchHistory(type: 'daily'): Promise<DailyPayout[]>;
async function fetchHistory(type: 'weekly-history'): Promise<WeeklyHistoryGroup[]>;
async function fetchHistory(type: 'weekly-admin', week?: number): Promise<WeeklyAdminResponse>;

// **CORRECTED IMPLEMENTATION** - The union return type satisfies all overloads
async function fetchHistory(
    type: PayoutType, // Use the union type here
    week?: number
): Promise<DailyPayout[] | WeeklyHistoryGroup[] | WeeklyAdminResponse> {
    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!BASE_URL) {
        const message = 'API base URL is not configured (NEXT_PUBLIC_API_BASE_URL is missing).';
        console.error(message);
        if (type === 'weekly-admin') {
            // Return WeeklyAdminError
            return { error: true, message: message }; 
        }
        // Return empty array for other types
        return [];
    }
    
    let endpoint = '';

    if (type === 'daily') {
        endpoint = `${BASE_URL}/api/bonusHistery/daily`;
    } else if (type === 'weekly-history') {
        endpoint = `${BASE_URL}/api/bonusHistery/weekly`;
    } else if (type === 'weekly-admin') {
        endpoint = `${BASE_URL}/api/admin/weekly/winners${week ? `?week=${week}` : ''}`;
    }

    try {
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            // Handle 409 Conflict specifically for admin endpoint
            if (response.status === 409 && type === 'weekly-admin') {
                const errorResult = await response.json();
                return {
                    error: true,
                    message: errorResult.message,
                    week: errorResult.week,
                }; 
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success === false) { 
            throw new Error(result.message || 'API call failed');
        }

        if (type === 'weekly-admin') {
            // Return WeeklyAdminSuccess
            return { error: false, message: result.message, data: result.data ?? [], week: result.week };
        }

        // Return DailyPayout[] or WeeklyHistoryGroup[]
        return (result.data || result); 

    } catch (error) {
        console.error(`Error fetching ${type} history from API:`, error);

        const errorMessage =
            error instanceof Error
                ? error.message
                : 'A network or unknown error occurred.';

        if (type === 'weekly-admin') {
            // Return WeeklyAdminError
            return { error: true, message: errorMessage };
        }
        // Return empty array
        return []; 
    }
}

const executePayoutRequest = async (week: number, winners: WeeklyWinner[]) => {
    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!BASE_URL) {
        throw new Error('API base URL is not configured (NEXT_PUBLIC_API_BASE_URL is missing).');
    }

    const apiUrl = `${BASE_URL}/api/admin/weekly/payout`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ week, winners }),
        });
        
        const result = await response.json();

        if (!response.ok || !result.success) {
            if (response.status === 409) {
                throw new Error(result.message || 'This week has already been paid out.');
            }
            throw new Error(result.message || `Payout failed with status ${response.status}`);
        }
        return result as { success: boolean, count: number, message: string };
    } catch (error) {
        console.error("Payout execution error:", error);
        throw error;
    }
};

const BonusHistory: React.FC = () => {
    // --- State Declarations ---
    const [dailyHistory, setDailyHistory] = useState<DailyPayout[]>([]);
    const [weeklyHistory, setWeeklyHistory] = useState<WeeklyHistoryGroup[]>([]);
    const [adminWinners, setAdminWinners] = useState<WeeklyWinner[]>([]);
    
    const currentWeek = getCurrentWeekNumber();
    const defaultPayoutWeek = currentWeek === 1 ? 52 : currentWeek - 1; 
    const [payoutWeek, setPayoutWeek] = useState<number>(defaultPayoutWeek);

    const [adminMessage, setAdminMessage] = useState<string | null>(null);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isPayoutLoading, setIsPayoutLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<PayoutType>('weekly-admin');

    // --- Memoized Handlers ---

    const fetchAdminWinners = useCallback(async (week: number) => {
        setAdminWinners([]);
        setAdminMessage(null);
        setIsLoading(true);

        try {
            // TypeScript now correctly infers the return type as WeeklyAdminResponse
            const result = await fetchHistory('weekly-admin', week); 
            
            // Check the error property to narrow the type
            if (result.error) {
                setAdminMessage(`❌ ${result.message}`);
            } else {
                // If no error, result is WeeklyAdminSuccess
                const winners = result.data ?? [];

                setAdminWinners(winners);

                setAdminMessage(
                    winners.length > 0
                        ? `Found ${winners.length} potential winner(s) for week ${week}. Review and Confirm.`
                        : `No winners found for week ${week}.`
                );
            }
        } catch (error) {
            setAdminMessage('Failed to fetch winners for admin review due to an unexpected error.');
        } finally {
            setIsLoading(false);
        }
    }, []); 

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // TypeScript correctly infers the return types based on literal arguments
            const [dailyData, weeklyData] = await Promise.all([
                fetchHistory('daily'), // Inferred as DailyPayout[]
                fetchHistory('weekly-history') // Inferred as WeeklyHistoryGroup[]
            ]);
            
            setDailyHistory(dailyData);
            setWeeklyHistory(weeklyData);

        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setIsLoading(false);
        }
    }, []); 

    // --- Effects ---

    useEffect(() => {
        fetchData();
    }, [fetchData]); 

    useEffect(() => {
        if (activeTab === 'weekly-admin') {
            fetchAdminWinners(payoutWeek);
        }
    }, [activeTab, payoutWeek, fetchAdminWinners]); 

    // --- Handlers ---

    const handlePayout = async () => {
        if (adminWinners.length === 0) {
            setAdminMessage('Cannot execute payout: No winners to pay.');
            return;
        }

        const userConfirmed = window.confirm(
            `Are you sure you want to pay out ${adminWinners.length} winner(s) for Week ${payoutWeek}? This action cannot be undone.`
        );
        if (!userConfirmed) {
            return;
        }

        setIsPayoutLoading(true);
        setAdminMessage('Executing payout...');
        try {
            const result = await executePayoutRequest(payoutWeek, adminWinners); 
            setAdminMessage(`✅ Success! ${result.count} winner(s) paid for Week ${payoutWeek}. Payout recorded.`);
            setAdminWinners([]); 
            fetchData(); 

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            setAdminMessage(`❌ Payout failed: ${errorMessage}`);
        } finally {
            setIsPayoutLoading(false);
            fetchAdminWinners(payoutWeek); 
        }
    };


    // --- Helper Components ---

    const Card = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
        <div className="bg-gray-800 p-6 rounded-xl shadow-2xl h-full border border-green-700/50">
            <h2 className="text-xl font-bold mb-4 flex items-center text-green-400">
                {icon}
                <span className="ml-2">{title}</span>
            </h2>
            {children}
        </div>
    );

    const formatPayoutDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid Date';
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString();
        } catch {
            return 'Invalid Date';
        }
    };
    
    const DailyHistoryTable = () => (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
                <thead>
                    <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-700/50">
                        <th className="px-4 py-3">User ID</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Wins (24h)</th>
                        <th className="px-4 py-3">Time Awarded</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-sm">
                    {dailyHistory.map((payout) => (
                        <tr key={payout._id} className="hover:bg-gray-700 transition duration-150">
                            <td className="px-4 py-3 font-mono text-xs text-gray-300">{payout.telegramId}</td>
                            <td className="px-4 py-3 text-green-400 font-semibold">{payout.amount} ETB</td>
                            <td className="px-4 py-3 text-yellow-400">{payout.details.winsIn24h}</td>
                            <td className="px-4 py-3 text-gray-400">{formatPayoutDate(payout.createdAt)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const WeeklyHistoryList = () => (
        <div className="space-y-6">
            {weeklyHistory.map((week) => (
                <Card key={week.weekOfYear} title={`Weekly Challenge - Week ${week.weekOfYear} (PAID)`} icon={<Trophy className="w-5 h-5" />}>
                    <div className="space-y-2">
                        {week.winners.map((winner) => (
                            <div 
                                key={winner.telegramId} 
                                className={`flex justify-between items-center p-3 rounded-lg ${
                                    winner.rank === 1 ? 'bg-yellow-900/40 border border-yellow-500' : 'bg-gray-700/50'
                                }`}
                            >
                                <div className="flex items-center">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${
                                        winner.rank === 1 ? 'text-black bg-yellow-400' : 
                                        winner.rank === 2 ? 'text-white bg-gray-400' : 
                                        'text-white bg-gray-500'
                                    }`}>
                                        {winner.rank}
                                    </span>
                                    <div>
                                        <p className="font-semibold text-white">{winner.username || 'N/A'}</p>
                                        <p className="text-xs text-gray-400">ID: {winner.telegramId}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-400">{winner.amount || 'N/A'} ETB</p>
                                    <p className="text-xs text-gray-400">Wins: {winner.totalWins}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            ))}
            {weeklyHistory.length === 0 && <p className="text-gray-400 text-center">No weekly challenge history found yet.</p>}
        </div>
    );

    const WeeklyAdminTable = () => (
        <div className="space-y-4">
            {/* Week Selector and Status */}
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-gray-800 rounded-xl shadow-lg border border-yellow-700/50">
                <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                    <label htmlFor="week-select" className="text-gray-300 font-semibold whitespace-nowrap">Select Week:</label>
                    <select
                        id="week-select"
                        value={payoutWeek}
                        onChange={(e) => setPayoutWeek(parseInt(e.target.value, 10))}
                        className="p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:ring-yellow-500 focus:border-yellow-500"
                        disabled={isLoading || isPayoutLoading}
                    >
                        {Array.from({ length: 5 }, (_, i) => currentWeek - i).filter(w => w > 0).map(week => (
                            <option key={week} value={week}>Week {week}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => fetchAdminWinners(payoutWeek)}
                        className="text-sm text-yellow-500 hover:text-yellow-400 flex items-center p-2 rounded transition"
                        disabled={isLoading || isPayoutLoading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-1 ${isLoading && activeTab === 'weekly-admin' ? 'animate-spin' : ''}`} />
                        Recalculate
                    </button>
                </div>
                
                <p className={`text-sm font-medium ${adminMessage?.startsWith('✅') ? 'text-green-400' : adminMessage?.startsWith('❌') || adminMessage?.includes('already been executed') ? 'text-red-400' : 'text-yellow-400'}`}>
                    {adminMessage || 'Select a week and hit "Recalculate" to find top players.'}
                </p>
            </div>

            {/* Winners List */}
            <Card title={`Winners for Week ${payoutWeek} (Unconfirmed)`} icon={<DollarSign className="w-5 h-5 text-yellow-400" />}>
                {isLoading && activeTab === 'weekly-admin' && !isPayoutLoading ? (
                    <div className="text-center p-8">
                        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-4" />
                        <p className="text-gray-400">Calculating top players...</p>
                    </div>
                ) : adminWinners.length > 0 ? (
                    <>
                        <div className="overflow-x-auto mb-4">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead>
                                    <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-700/50">
                                        <th className="px-4 py-3">Rank</th>
                                        <th className="px-4 py-3">User</th>
                                        <th className="px-4 py-3">Total Wins</th>
                                        <th className="px-4 py-3">Reward (ETB)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800 text-sm">
                                    {adminWinners.map((winner) => (
                                        <tr key={winner.telegramId} className="hover:bg-gray-700 transition duration-150">
                                            <td className="px-4 py-3 font-bold text-yellow-400">{winner.rank}</td>
                                            <td className="px-4 py-3">
                                                <p className="text-white">{winner.username || 'N/A'}</p>
                                                <p className="text-xs text-gray-400 font-mono">ID: {winner.telegramId}</p>
                                            </td>
                                            <td className="px-4 py-3 text-green-400 font-semibold">{winner.totalWins}</td>
                                            <td className="px-4 py-3 text-green-400 font-bold">{winner.rewardAmount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Payout Confirmation Button */}
                        <button
                            onClick={handlePayout}
                            disabled={isPayoutLoading || adminWinners.length === 0}
                            className={`w-full py-3 rounded-xl font-bold text-lg transition-colors duration-200 flex items-center justify-center ${
                                isPayoutLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/50'
                            }`}
                        >
                            {isPayoutLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Processing Payout...
                                </>
                            ) : (
                                <>
                                    <DollarSign className="w-5 h-5 mr-2" />
                                    Confirm & Execute Payout Now
                                </>
                            )}
                        </button>
                    </>
                ) : adminMessage && (adminMessage.includes('already been executed') || adminMessage.includes('No winners found') || adminMessage.includes('API base URL')) ? (
                    <div className="text-center p-4">
                        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                        <p className="text-red-400">{adminMessage}</p>
                    </div>
                ) : (
                    <p className="text-gray-400 text-center py-4">No data to display. Use the selector above to find winners for a specific week.</p>
                )}
            </Card>
        </div>
    );


    // --- Main Render ---

    return (
        <div className="min-h-screen bg-gray-900 p-4 sm:p-8 font-sans">
            <div className="max-w-5xl mx-auto">
                
                <header className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">
                        Bonus Administration & History
                    </h1>
                    <p className="text-gray-400">
                        Manage weekly payouts and review bonus transaction history.
                    </p>
                </header>

                {/* Tab Navigation */}
                <div className="flex space-x-2 mb-6 border-b border-gray-700 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('weekly-admin')}
                        className={`px-4 py-2 font-medium transition duration-200 rounded-t-lg flex items-center whitespace-nowrap ${
                            activeTab === 'weekly-admin' ? 'text-white border-b-2 border-yellow-500' : 'text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        <DollarSign className="w-5 h-5 mr-2" />
                        Weekly Payout Admin
                    </button>
                    <button
                        onClick={() => setActiveTab('weekly-history')}
                        className={`px-4 py-2 font-medium transition duration-200 rounded-t-lg flex items-center whitespace-nowrap ${
                            activeTab === 'weekly-history' ? 'text-white border-b-2 border-green-500' : 'text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        <Trophy className="w-5 h-5 mr-2" />
                        Weekly Payout History
                    </button>
                    <button
                        onClick={() => setActiveTab('daily')}
                        className={`px-4 py-2 font-medium transition duration-200 rounded-t-lg flex items-center whitespace-nowrap ${
                            activeTab === 'daily' ? 'text-white border-b-2 border-green-500' : 'text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        <Zap className="w-5 h-5 mr-2" />
                        Daily 5-Win History
                    </button>
                    <button 
                        onClick={fetchData} 
                        className="ml-auto text-sm text-green-500 hover:text-green-400 flex items-center p-2 rounded transition"
                        disabled={isLoading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-1 ${isLoading && activeTab !== 'weekly-admin' ? 'animate-spin' : ''}`} />
                        Refresh History
                    </button>
                </div>

                {/* Content Area */}
                {activeTab === 'weekly-admin' ? (
                    <WeeklyAdminTable />
                ) : isLoading && !isPayoutLoading ? (
                    <div className="text-center p-12 bg-gray-800 rounded-xl shadow-lg">
                        <RefreshCw className="w-8 h-8 text-green-500 animate-spin mx-auto mb-4" />
                        <p className="text-gray-400">Loading payout history...</p>
                    </div>
                ) : (
                    <div className="py-2">
                        {activeTab === 'weekly-history' && <WeeklyHistoryList />}
                        {activeTab === 'daily' && (
                            <Card title="Recent Daily Bonuses" icon={<Zap className="w-5 h-5" />}>
                                {dailyHistory.length > 0 ? <DailyHistoryTable /> : <p className="text-gray-400 text-center py-4">No daily bonus payouts recorded yet.</p>}
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BonusHistory;