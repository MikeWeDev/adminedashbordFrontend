import React from 'react';

interface Transaction {
  _id: string;
  transactionId: string;
  type: 'Deposit' | 'Withdrawal';
  amount: number;
  status: string;
  telegramId: string;
  username: string;
  date: string;
  currency: string;
  bank_code?: string;
  account_name?: string;
  account_number?: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
  currentPage: number;
  itemsPerPage: number;
  totalTransactions: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  currentSortBy: string;
  currentSortOrder: 'asc' | 'desc';
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  currentPage,
  totalTransactions,
  totalPages,
  onPageChange,
  onSortChange,
  currentSortBy,
  currentSortOrder,
}) => {

  const handleSortClick = (field: string) => {
    if (currentSortBy === field) {
      onSortChange(field, currentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(field, field === 'date' ? 'desc' : 'asc');
    }
  };

  const renderSortIcon = (field: string) => {
    if (currentSortBy === field) {
      return currentSortOrder === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
  };

  // 🔹 helper function to shorten long text
  const truncateText = (text: string, start: number = 6, end: number = 4) => {
    if (!text) return '';
    if (text.length <= start + end) return text;
    return `${text.slice(0, start)}...${text.slice(-end)}`;
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mt-8 w-full">
      <h3 className="text-xl font-semibold mb-4">All Transactions</h3>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-4 text-left whitespace-nowrap">Transaction ID</th>
              <th className="py-3 px-4 text-left cursor-pointer" onClick={() => handleSortClick('type')}>
                Type {renderSortIcon('type')}
              </th>
              <th className="py-3 px-4 text-left cursor-pointer" onClick={() => handleSortClick('amount')}>
                Amount {renderSortIcon('amount')}
              </th>
              <th className="py-3 px-4 text-left cursor-pointer" onClick={() => handleSortClick('status')}>
                Status {renderSortIcon('status')}
              </th>
              <th className="py-3 px-4 text-left whitespace-nowrap  hidden md:table-cell">Telegram ID</th>
              <th className="py-3 px-4 text-left cursor-pointer  hidden md:table-cell" onClick={() => handleSortClick('username')}>
                Username {renderSortIcon('username')}
              </th>
              <th className="py-3 px-4 text-left cursor-pointer" onClick={() => handleSortClick('date')}>
                Date {renderSortIcon('date')}
              </th>
            </tr>
          </thead>

          <tbody className="text-gray-600 text-sm font-light">
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <tr key={transaction.transactionId} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-4 text-left whitespace-nowrap">
                    {truncateText(transaction.transactionId, 6, 6)}
                  </td>
                  <td className="py-3 px-4 text-left">{transaction.type}</td>
                  <td className="py-3 px-4 text-left">
                    {transaction.amount.toLocaleString()} {transaction.currency}
                  </td>
                  <td className="py-3 px-4 text-left">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${transaction.status === 'success' || transaction.status === 'paid'
                          ? 'bg-green-200 text-green-800'
                          : transaction.status === 'pending' || transaction.status === 'processing'
                            ? 'bg-yellow-200 text-yellow-800'
                            : 'bg-red-200 text-red-800'
                        }`}
                    >
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-left whitespace-nowrap  hidden md:table-cell">
                    {truncateText(transaction.telegramId, 5, 3)}
                  </td>
                  <td className="py-3 px-4 text-left  hidden md:table-cell">
                    {truncateText(transaction.username, 5, 3)}
                  </td>
                  <td className="py-3 px-4 text-left whitespace-nowrap">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-4 text-center text-gray-500">No transactions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalTransactions > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 p-3 bg-gray-50 rounded-lg gap-3">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-gray-700 text-sm sm:text-base">
            Page {currentPage} of {totalPages} ({totalTransactions} transactions)
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
