'use client'
import React, { useState, useEffect } from 'react';
import { RefreshCw, Zap, Trophy, DollarSign, Loader2, AlertTriangle } from 'lucide-react';

// --- Type Definitions for the Data ---
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
  rewardAmount: number; // Used in admin view
}

interface WeeklyHistoryGroup {
  weekOfYear: number;
  winners: WeeklyWinner[];
}

type PayoutType = 'daily' | 'weekly-history' | 'weekly-admin';

// Replicate utility function here for client-side use
const getCurrentWeekNumber = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const diff = (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
    return Math.ceil(diff / 7);
};

// --- API Helper ---
const fetchHistory = async (type: PayoutType, week?: number): Promise<any> => {
   // NOTE: In a real app, you need a way to pass the admin token/credentials here
   const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
   let endpoint = '';

   if (type === 'daily') {
     endpoint = `${BASE_URL}/api/bonusHistery/daily`;
   } else if (type === 'weekly-history') {
     endpoint = `${BASE_URL}/api/bonusHistery/weekly`;
   } else if (type === 'weekly-admin') {
     endpoint = `${BASE_URL}/api/admin/weekly/winners${week ? `?week=${week}` : ''}`;
   }
   
   const apiUrl = endpoint; 

   try {
     const response = await fetch(apiUrl);
     if (!response.ok) {
       // Check for 409 Conflict (already paid)
       if (response.status === 409) {
            const errorResult = await response.json();
            return { error: true, message: errorResult.message, week: errorResult.week };
       }
       throw new Error(`HTTP error! status: ${response.status}`);
     }
     const result = await response.json();
     if (!result.success) {
       throw new Error(result.message || 'API call failed');
     }
     return result.data || result; // For admin endpoint, the structure is { success, week, data }
   } catch (error) {
     console.error(`Error fetching ${type} history from API:`, error);
     
     // --- FIX: Check if error is an instance of Error before accessing message ---
     const errorMessage = error instanceof Error ? error.message : 'A network or unknown error occurred.';

     // Return empty array/object on failure, using the determined message
     return type === 'weekly-admin' ? { error: true, message: errorMessage } : []; 
   }
};

const executePayoutRequest = async (week: number, winners: WeeklyWinner[]) => {
    // NOTE: In a real app, you need a way to pass the admin token/credentials here
    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    const apiUrl = `${BASE_URL}/api/admin/weekly/payout`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ week, winners }),
        });
        
        const result = await response.json();

        if (!response.ok || !result.success) {
            // Check for 409 Conflict (already paid)
            if (response.status === 409) {
                 throw new Error(result.message || 'This week has already been paid out.');
            }
            throw new Error(result.message || `Payout failed with status ${response.status}`);
        }
        return result;
    } catch (error) {
        console.error("Payout execution error:", error);
        throw error;
    }
};

const BonusHistoey: React.FC = () => {
  const [dailyHistory, setDailyHistory] = useState<DailyPayout[]>([]);
  const [weeklyHistory, setWeeklyHistory] = useState<WeeklyHistoryGroup[]>([]);
  const [adminWinners, setAdminWinners] = useState<WeeklyWinner[]>([]);
  
  // Calculate default week to review (the one that just finished)
  const currentWeek = getCurrentWeekNumber();
  const defaultPayoutWeek = currentWeek === 1 ? 52 : currentWeek - 1; // Assuming 52 is the highest week number
  const [payoutWeek, setPayoutWeek] = useState<number>(defaultPayoutWeek);

  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isPayoutLoading, setIsPayoutLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<PayoutType>('weekly-admin'); // Default to admin view

  // --- Initial Data Fetch (for History tabs) ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const dailyData = await fetchHistory('daily');
      setDailyHistory(dailyData);

      const weeklyData = await fetchHistory('weekly-history');
      setWeeklyHistory(weeklyData);

    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Admin Winner Fetch ---
  const fetchAdminWinners = async (week: number) => {
    setAdminWinners([]); // Clear previous results
    setAdminMessage(null);
    setIsLoading(true);

    try {
        const result = await fetchHistory('weekly-admin', week);
        
        if (result.error) {
            setAdminMessage(`❌ ${result.message}`);
        } else {
            setAdminWinners(result.data);
            setAdminMessage(result.data.length > 0 
                ? `Found ${result.data.length} potential winner(s) for week ${week}. Review and Confirm.`
                : `No winners found for week ${week}.`
            );
        }
    } catch (error) {
        setAdminMessage('Failed to fetch winners for admin review.');
    } finally {
        setIsLoading(false);
    }
  };

  // Fetch initial history data
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch admin winners whenever the tab or week changes
  useEffect(() => {
    if (activeTab === 'weekly-admin') {
        fetchAdminWinners(payoutWeek);
    }
  }, [activeTab, payoutWeek]);

  // --- Handlers ---

  const handlePayout = async () => {
    if (adminWinners.length === 0) {
        setAdminMessage('Cannot execute payout: No winners to pay.');
        return;
    }

    // Custom confirmation dialog
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
        setAdminWinners([]); // Clear list after successful payment
        fetchData(); // Refresh history tab data

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        setAdminMessage(`❌ Payout failed: ${errorMessage}`);
    } finally {
        setIsPayoutLoading(false);
        // Force re-fetch the admin list to check if the week is now "paid"
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
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString();
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
                  {/* Amount is non-optional in history view, but included optional in type def above for flexibility */}
                  <p className="font-bold text-green-400">{winner.amount} ETB</p>
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
                    onChange={(e) => setPayoutWeek(parseInt(e.target.value))}
                    className="p-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:ring-yellow-500 focus:border-yellow-500"
                    disabled={isLoading || isPayoutLoading}
                >
                    {/* Generates options for the current week and previous 4 weeks */}
                    {Array.from({ length: 5 }, (_, i) => currentWeek - i).filter(w => w > 0).map(week => (
                        <option key={week} value={week}>Week {week}</option>
                    ))}
                </select>
                <button
                    onClick={() => fetchAdminWinners(payoutWeek)}
                    className="text-sm text-yellow-500 hover:text-yellow-400 flex items-center p-2 rounded transition"
                    disabled={isLoading || isPayoutLoading}
                >
                    <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                    Recalculate
                </button>
            </div>
            
            <p className={`text-sm font-medium ${adminMessage?.startsWith('✅') ? 'text-green-400' : adminMessage?.startsWith('❌') || adminMessage?.includes('already been executed') ? 'text-red-400' : 'text-yellow-400'}`}>
                {adminMessage || 'Select a week and hit "Recalculate" to find top players.'}
            </p>
        </div>

        {/* Winners List */}
        <Card title={`Winners for Week ${payoutWeek} (Unconfirmed)`} icon={<DollarSign className="w-5 h-5 text-yellow-400" />}>
            {isLoading && !isPayoutLoading ? (
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
            ) : adminMessage && (adminMessage.includes('already been executed') || adminMessage.includes('No winners found')) ? (
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
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
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

export default BonusHistoey;
