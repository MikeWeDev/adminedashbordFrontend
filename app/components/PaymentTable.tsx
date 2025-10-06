import Link from 'next/link';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { IoCheckmarkCircleOutline } from "react-icons/io5";

interface Transaction {
    _id: string;
    tx_ref: string;
    telegramId: string;
    username?: string; 
    amount: number;
    status: 'pending' | 'success' | 'failed' | 'processing' | 'paid' | 'rejected' | 'approved' | 'completed';
    createdAt: string;
    type: 'Payment' | 'Withdrawal';
    bank_code?: string;
    account_number?: string;
    method?: 'CBE' | 'Telebirr' | 'Other';
}

interface PaymentTableProps {
    transactions: Transaction[];
    currentPage: number;
    itemsPerPage: number;
    totalTransactions: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onSortChange: (field: string, order: 'asc' | 'desc') => void;
    currentSortBy: string;
    currentSortOrder: 'asc' | 'desc';
}

// ---------------------------------------------------------------------
// 💡 SOLVED PROBLEM HERE: Changed hour12: false to hour12: true
// ---------------------------------------------------------------------
// Helper function to format the timestamp clearly
const formatTimestamp = (isoString: string) => {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        
        // Format: MM/DD/YYYY, HH:MM:SS AM/PM
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            // 🚨 THIS IS THE KEY CHANGE FOR 12-HOUR FORMAT
            hour12: true, 
        });
    } catch (e) {
        return 'Invalid Date';
    }
};
// ---------------------------------------------------------------------

export const PaymentTable: React.FC<PaymentTableProps> = ({
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
    const getSortIcon = (field: string) => {
        if (currentSortBy !== field) return <FaSort className="text-gray-400" />;
        return currentSortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />;
    };

    const handleSortClick = (field: string) => {
        const newOrder = currentSortBy === field && currentSortOrder === 'desc' ? 'asc' : 'desc';
        onSortChange(field, newOrder);
    };

    const statusColors = (status: string) => {
        switch (status) {
            case 'success':
            case 'paid':
            case 'approved':
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'pending':
            case 'processing':
                return 'bg-yellow-100 text-yellow-800';
            case 'failed':
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const displayType = (type: string) => (type === 'Payment' ? 'Deposit' : 'Withdrawal');

    const handleMarkAsPaid = async (id: string) => {
        const confirmed = window.confirm('Are you sure you want to mark this withdrawal as paid?');
        if (!confirmed) return;

        try {
            const res = await fetch(`/api/payments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'paid' }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update transaction status.');
            }
            alert('Withdrawal marked as paid successfully!');
            window.location.reload();
        } catch (error) {
            console.error('Error marking withdrawal as paid:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Transaction History</h2>
                <span className="text-gray-600">Total: {totalTransactions.toLocaleString()}</span>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                                Transaction ID
                            </th>
                            {/* 1. NEW USERNAME HEADER */}
                            <th 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell cursor-pointer"
                                onClick={() => handleSortClick('username')}
                            >
                                <div className="flex items-center">Username {getSortIcon('username')}</div>
                            </th>
                            {/* 2. NEW DATE/TIME HEADER (made visible and sortable) */}
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                onClick={() => handleSortClick('createdAt')}
                            >
                                <div className="flex items-center">Date/Time {getSortIcon('createdAt')}</div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                onClick={() => handleSortClick('amount')}
                            >
                                <div className="flex items-center">Amount {getSortIcon('amount')}</div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                                Method
                            </th>
                            <th
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                onClick={() => handleSortClick('status')}
                            >
                                <div className="flex items-center">Status {getSortIcon('status')}</div>
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.length > 0 ? (
                            transactions.map((transaction) => (
                                <tr key={transaction._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 hidden lg:table-cell" title={transaction.tx_ref}>
                                        {transaction.tx_ref?.substring(0, 10) || 'N/A'}...
                                    </td>
                                    {/* 1. NEW USERNAME CELL */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 hidden md:table-cell">
                                        @{transaction.username || 'N/A'}
                                    </td>
                                    {/* 2. NEW DATE/TIME CELL (Clear Timestamp) */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatTimestamp(transaction.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span
                                            className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${
                                                transaction.type === 'Payment' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                            }`}
                                        >
                                            {displayType(transaction.type)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">
                                        {transaction.amount.toLocaleString()} Birr
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                                        {transaction.method || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span
                                            className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${statusColors(
                                                transaction.status
                                            )}`}
                                        >
                                            {transaction.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            {transaction.type === 'Withdrawal' && transaction.status === 'pending' && (
                                                <button
                                                    onClick={() => handleMarkAsPaid(transaction._id)}
                                                    className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-green-700 transition-colors duration-200"
                                                >
                                                    <IoCheckmarkCircleOutline className="mr-1" /> Paid
                                                </button>
                                            )}
                                            <Link
                                                href={`/superadmine/transcations/${transaction._id}`}
                                                className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-indigo-700 transition-colors duration-200"
                                            >
                                                Edit
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No transactions found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {totalPages > 1 && (
                <div className="flex flex-col md:flex-row justify-between items-center mt-6 p-3 bg-gray-50 rounded-lg gap-2 w-[80%] md:w-full">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full md:w-auto"
                    >
                        Previous
                    </button>
                    <span className="text-gray-700 text-center">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                        {Math.min(currentPage * itemsPerPage, totalTransactions)} of {totalTransactions} results
                    </span>
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full md:w-auto"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};