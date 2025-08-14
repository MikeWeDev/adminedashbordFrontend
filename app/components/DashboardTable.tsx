import React from 'react';

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

interface DashboardTableProps {
  games: GameHistoryEntry[];
}

export const DashboardTable: React.FC<DashboardTableProps> = ({ games }) => {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mt-8">
      <h3 className="text-lg sm:text-xl font-semibold mb-4">Games Played Today</h3>

      {/* Desktop Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Start Time</th>
              <th className="py-3 px-6 text-left">Players</th>
              <th className="py-3 px-6 text-left">Stake Amount</th>
              <th className="py-3 px-6 text-left">Winner (Telegram ID)</th>
              <th className="py-3 px-6 text-left">Winner (Username)</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {games.length > 0 ? (
              games.map((game) => (
                <tr key={game.GameSessionId} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6 text-left whitespace-nowrap">
                    {new Date(game.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-6 text-left">{game.playersCount}</td>
                  <td className="py-3 px-6 text-left">{game.stakeAmount} Birr</td>
                  <td className="py-3 px-6 text-left">{game.winnerTelegramId}</td>
                  <td className="py-3 px-6 text-left">{game.winnerUsername}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500">
                  No games played today.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    
    </div>
  );
};
