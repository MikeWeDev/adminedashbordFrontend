import React from 'react';

/**
 * Interface defining the common structure for combined transaction data.
 */
interface Transaction {
  _id: string; // Original MongoDB ID of the Payment or Withdrawal document
  transactionId: string; // e.g., tx_ref
  type: 'Deposit' | 'Withdrawal'; // Type of transaction
  amount: number; // Amount of the transaction
  status: string; // e.g., 'success', 'pending', 'failed', 'paid', 'processing', 'rejected'
  telegramId: string; // Telegram ID of the user involved
  username: string;   // Added username to the interface
  date: string; // Date of the transaction (createdAt field)
  currency: string; // Currency (e.g., 'ETB')
  // Optional fields specific to withdrawals, might be undefined for deposits
  bank_code?: string;
  account_name?: string;
  account_number?: string;
}

/**
 * Props for the TransactionTable component.
 */
interface TransactionTableProps {
  transactions: Transaction[]; // Array of combined transaction objects
  currentPage: number; // Current page number for pagination
  itemsPerPage: number; // Number of items displayed per page
  totalTransactions: number; // Total count of transactions in the database
  totalPages: number; // Total number of pages
  onPageChange: (page: number) => void; // Callback function for page change
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void; // Callback for sorting
  currentSortBy: string; // Currently active sort field
  currentSortOrder: 'asc' | 'desc'; // Currently active sort order
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  currentPage,
  itemsPerPage,
  totalTransactions,
  totalPages,
  onPageChange,
  onSortChange,
  currentSortBy,
  currentSortOrder,
}) => {

  // Function to handle sort click on table headers
  const handleSortClick = (field: string) => {
    // If clicking on the same field, toggle sort order
    if (currentSortBy === field) {
      onSortChange(field, currentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking on a new field, default to descending for 'date', ascending for others
      onSortChange(field, field === 'date' ? 'desc' : 'asc');
    }
  };

  // Helper to render sort icon (triangle up/down)
  const renderSortIcon = (field: string) => {
    if (currentSortBy === field) {
      return currentSortOrder === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8">
      <h3 className="text-xl font-semibold mb-4">All Transactions</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            {/* Removed whitespace between <th> tags to prevent hydration errors */}
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Transaction ID</th><th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSortClick('type')}>
                Type {renderSortIcon('type')}
              </th><th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSortClick('amount')}>
                Amount {renderSortIcon('amount')}
              </th><th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSortClick('status')}>
                Status {renderSortIcon('status')}
              </th><th className="py-3 px-6 text-left">Telegram ID</th><th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSortClick('username')}>
                Username {renderSortIcon('username')}
              </th><th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSortClick('date')}>
                Date {renderSortIcon('date')}
              </th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {transactions.length > 0 ? (
              transactions.map((transaction) => ( // ⭐ FIX: Ensure `map` correctly returns JSX in parentheses
                <tr key={transaction.transactionId} className="border-b border-gray-200 hover:bg-gray-100">
                  {/* Removed whitespace between <td> tags to prevent hydration errors */}
                  <td className="py-3 px-6 text-left whitespace-nowrap">{transaction.transactionId}</td><td className="py-3 px-6 text-left">{transaction.type}</td><td className="py-3 px-6 text-left">{transaction.amount.toLocaleString()} {transaction.currency}</td><td className="py-3 px-6 text-left">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${transaction.status === 'success' || transaction.status === 'paid' ? 'bg-green-200 text-green-800' :
                        transaction.status === 'pending' || transaction.status === 'processing' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-red-200 text-red-800'
                      }`}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                  </td><td className="py-3 px-6 text-left">{transaction.telegramId}</td><td className="py-3 px-6 text-left">{transaction.username}</td><td className="py-3 px-6 text-left whitespace-nowrap">
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

      {/* Pagination Controls */}
      {totalTransactions > 0 && (
        <div className="flex justify-between items-center mt-6 p-3 bg-gray-50 rounded-lg">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-gray-700">
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
