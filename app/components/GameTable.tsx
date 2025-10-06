'use client';

import { FaSort, FaSortAlphaDown, FaSortAlphaUp } from 'react-icons/fa';

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
        <h3 className="text-lg font-semibold">Game Sessions</h3>
        <p className="text-sm text-gray-600">
          {totalItems} total {totalItems === 1 ? 'session' : 'sessions'}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-200 text-gray-700 uppercase leading-normal text-xs">
              {headCell('Session ID', 'GameSessionId')}
              {headCell('Game', 'gameId')}
              {headCell('Stake', 'stakeAmount', 'hidden sm:table-cell')}
              {headCell('Prize', 'prizeAmount')}
              {headCell('Cards', 'totalCards', 'hidden sm:table-cell')}
              {headCell('Players', 'playersCount', 'hidden sm:table-cell')}
              {headCell('Status', 'isActive')}
              {headCell('Created', 'createdAt', 'hidden sm:table-cell')}
              {headCell('Ended', 'endedAt', 'hidden sm:table-cell')}
              <th scope="col" className="py-3 px-4 text-left whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="text-gray-700">
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="py-6 text-center text-gray-500">
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
                <tr key={g._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono">{g.GameSessionId}</td>
                  <td className="py-3 px-4">{g.gameId}</td>
                  <td className="py-3 px-4 hidden sm:table-cell">{g.stakeAmount}</td>
                  <td className="py-3 px-4">{g.prizeAmount}</td>
                  <td className="py-3 px-4 hidden sm:table-cell">{g.totalCards}</td>
                  <td className="py-3 px-4 hidden sm:table-cell">{playersCount}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        g.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {g.isActive ? 'Active' : 'Ended'}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap hidden sm:table-cell">
                    {new Date(g.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap hidden sm:table-cell">
                    {g.endedAt ? new Date(g.endedAt).toLocaleString() : '-'}
                  </td>
                 <td className="py-3 px-4 mt-4 whitespace-nowrap bg-gray-50 flex items-center justify-end">
                    <button
                        onClick={() => onEndGame(g._id)}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition"
                    >
                        End
                    </button>
                          </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-4 p-3 bg-gray-50 rounded-lg">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <span className="text-gray-700 text-sm sm:text-base">
          Page {page} of {totalPages} ({totalItems} total)
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
