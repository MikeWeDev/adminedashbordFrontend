'use client';

import { FaSort, FaSortAlphaDown, FaSortAlphaUp, FaUsers } from 'react-icons/fa';

export type SortOrder = 'asc' | 'desc';

export type GameRow = {
  _id: string;
  gameId: string;
  GameSessionId: string;
  stakeAmount: number;
  prizeAmount: number;
  totalCards: number;
  players?: { telegramId: number; status: 'connected' | 'disconnected' }[];
  playersCount?: number;
  isActive: boolean;
  createdAt: string;
  endedAt?: string | null;
};

export default function GameTable({
  rows,
  page,
  totalPages,
  totalItems,
  onPageChange,
  sortBy,
  sortOrder,
  onSortChange,
  onEndGame,
  onViewPlayers, // New Prop
}: {
  rows: GameRow[];
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (p: number) => void;
  sortBy: keyof GameRow;
  sortOrder: SortOrder;
  onSortChange: (k: keyof GameRow) => void;
  onEndGame: (id: string) => void;
  onViewPlayers: (id: string) => void; // New Prop Type
}) {
  const sortIcon = (field: keyof GameRow) => {
    if (sortBy !== field) return <FaSort className="inline-block opacity-50" />;
    return sortOrder === 'asc' ? (
      <FaSortAlphaUp className="inline-block" />
    ) : (
      <FaSortAlphaDown className="inline-block" />
    );
  };

  const headCell = (label: string, field: keyof GameRow, className?: string) => (
    <th
      scope="col"
      className={`py-3 px-4 text-left cursor-pointer select-none whitespace-nowrap ${className || ''}`}
      onClick={() => onSortChange(field)}
      aria-sort={sortBy === field ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <span className="inline-flex items-center gap-2">
        {label} {sortIcon(field)}
      </span>
    </th>
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Game Sessions</h3>
        <p className="text-sm text-gray-600">
          {totalItems} total {totalItems === 1 ? 'session' : 'sessions'}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase leading-normal text-xs border-b">
              {headCell('Session ID', 'GameSessionId')}
              {headCell('Game', 'gameId')}
              {headCell('Stake', 'stakeAmount', 'hidden sm:table-cell')}
              {headCell('Prize', 'prizeAmount')}
              {headCell('Cards', 'totalCards', 'hidden sm:table-cell')}
              {headCell('Players', 'playersCount')}
              {headCell('Status', 'isActive')}
              {headCell('Created', 'createdAt', 'hidden lg:table-cell')}
              <th scope="col" className="py-3 px-4 text-center whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="text-gray-700">
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="py-10 text-center text-gray-500">
                  No game sessions found.
                </td>
              </tr>
            )}

            {rows.map((g) => {
              const playersCount =
                typeof g.playersCount === 'number'
                  ? g.playersCount
                  : Array.isArray(g.players)
                  ? g.players.length
                  : 0;

              return (
                <tr key={g._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-indigo-600">{g.GameSessionId.slice(0, 8)}...</td>
                  <td className="py-3 px-4 font-bold">{g.gameId}</td>
                  <td className="py-3 px-4 hidden sm:table-cell">${g.stakeAmount}</td>
                  <td className="py-3 px-4 font-semibold text-green-600">${g.prizeAmount}</td>
                  <td className="py-3 px-4 hidden sm:table-cell">{g.totalCards}</td>
                  <td className="py-3 px-4">
                    <button 
                      onClick={() => onViewPlayers(g._id)}
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline transition"
                    >
                      <FaUsers /> {playersCount}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                        g.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {g.isActive ? 'Live' : 'Ended'}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap hidden lg:table-cell text-gray-500">
                    {new Date(g.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEndGame(g._id)}
                        disabled={!g.isActive}
                        className={`px-3 py-1 text-xs rounded transition ${
                          g.isActive 
                            ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200' 
                            : 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200'
                        }`}
                      >
                        End Game
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-6 pt-4 border-t">
        <p className="text-xs text-gray-500">
           Showing page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 bg-white border border-gray-300 text-gray-600 rounded hover:bg-gray-50 disabled:opacity-50 transition"
          >
            Prev
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1 bg-white border border-gray-300 text-gray-600 rounded hover:bg-gray-50 disabled:opacity-50 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}