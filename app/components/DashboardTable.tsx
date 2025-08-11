import React from 'react';

// UPDATED INTERFACE to match the GameHistoryEntry from page.tsx and backend response
interface GameHistoryEntry {
  _id: string;
  GameSessionId: string; // Added to match the backend response
  gameId: string;
  playersCount: number; // Renamed from 'players' to 'playersCount'
  stakeAmount: number;
  winnerTelegramId: string;
  winnerUsername: string; // Added to match the backend response
  createdAt: string;
  endedAt: string | null; // Renamed from 'finishedAt' to 'endedAt' and can be null
}

interface DashboardTableProps {
  games: GameHistoryEntry[]; // Ensure the prop type uses the updated interface
}

export const DashboardTable: React.FC<DashboardTableProps> = ({ games }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8">
      <h3 className="text-xl font-semibold mb-4">Games Played Today</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            {/* FIX: Ensured no whitespace between <th> tags and </tr> to prevent hydration errors */}
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Start Time</th><th className="py-3 px-6 text-left">Players</th><th className="py-3 px-6 text-left">Stake Amount</th><th className="py-3 px-6 text-left">Winner (Telegram ID)</th><th className="py-3 px-6 text-left">Winner (Username)</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {games.length > 0 ? (
              games.map((game) => (
                // Using GameSessionId as key since _id might not be unique if coming from GameControl/GameHistory join
                // 🎯 FIX: Ensured no whitespace between <td> tags and </tr> within the mapped rows
                <tr key={game.GameSessionId} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6 text-left whitespace-nowrap">
                    {new Date(game.createdAt).toLocaleString()}
                  </td><td className="py-3 px-6 text-left">{game.playersCount}</td><td className="py-3 px-6 text-left">{game.stakeAmount} Birr</td><td className="py-3 px-6 text-left">{game.winnerTelegramId}</td><td className="py-3 px-6 text-left">{game.winnerUsername}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500">No games played today.</td> {/* Adjusted colspan */}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};