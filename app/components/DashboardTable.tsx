
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
    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md mt-6">
      <h3 className="text-base sm:text-lg font-semibold mb-3">Games Played Today</h3>

      {/* Responsive table container */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-xs sm:text-sm leading-normal">
              <th className="py-2 px-3 text-left">Start Time</th>
              <th className="py-2 px-3 text-left">Players</th>
              <th className="py-2 px-3 text-left">Stake</th>
              <th className="py-2 px-3 text-left">Winner ID</th>
              <th className="py-2 px-3 text-left">Username</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-xs sm:text-sm font-light">
            {games.length > 0 ? (
              games.map((game) => (
                <tr
                  key={game.GameSessionId}
                  className="border-b border-gray-200 hover:bg-gray-100"
                >
                  <td className="py-2 px-3 whitespace-nowrap">
                    {new Date(game.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2 px-3">{game.playersCount}</td>
                  <td className="py-2 px-3">{game.stakeAmount} Birr</td>
                  <td className="py-2 px-3 max-w-[100px] truncate">{game.winnerTelegramId}</td>
                  <td className="py-2 px-3 max-w-[120px] truncate">{game.winnerUsername}</td>
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
