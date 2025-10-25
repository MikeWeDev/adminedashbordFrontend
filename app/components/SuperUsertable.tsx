import { useState, useMemo, Dispatch, SetStateAction } from 'react';
import Link from 'next/link';
// NOTE: We assume the external environment provides Next.js Link for this mock.

// Replaces 'react-icons/fa/FaEdit'
const FaEdit = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

// Defining types for FaSort icons
interface IconProps {
    className: string;
}
// Replaces 'react-icons/fa/FaSortAlphaDown'
const FaSortAlphaDown: React.FC<IconProps> = ({ className }) => <span className={className}>↓</span>;
// Replaces 'react-icons/fa/FaSortAlphaUp'
const FaSortAlphaUp: React.FC<IconProps> = ({ className }) => <span className={className}>↑</span>;

// --- Interfaces ---
interface User {
    _id: string;
    telegramId?: number;
    username: string;
    phoneNumber?: string;
    balance: number;
    bonus_balance?: number; 
    registeredAt: string;
}

interface UserTableProps {
    users: User[];
    currentPage: number;
    itemsPerPage: number; 
    totalUsers: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onSortChange: (field: string, order: 'asc' | 'desc') => void;
    currentSortBy: string;
    currentSortOrder: 'asc' | 'desc';
    usernameQuery: string; 
    contactQuery: string; 
    onSearchChange: (field: 'username' | 'contact', value: string) => void;
}

// --- Component Definition ---
export const UserTable: React.FC<UserTableProps> = ({
    users, // Now holds the current page of sorted and filtered users
    currentPage,
    totalUsers,
    totalPages,
    onPageChange,
    onSortChange,
    currentSortBy,
    currentSortOrder,
    usernameQuery,
    contactQuery,
    onSearchChange,
}) => {
    
    // Client-side filtering logic remains commented out as we assume server-side filtering
    /* const filteredUsers = useMemo(() => {
        // ... filtering logic ...
    }, [users, usernameQuery, contactQuery]);
    */

    const handleSortClick = (field: string) => {
        if (currentSortBy === field) {
            onSortChange(field, currentSortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            onSortChange(field, 'asc');
        }
    };

    const renderSortIcon = (field: string) => {
        if (currentSortBy === field) {
            return currentSortOrder === 'asc' ? (
                <FaSortAlphaUp className="inline ml-1" />
            ) : (
                <FaSortAlphaDown className="inline ml-1" />
            );
        }
        return null;
    };

    // Total columns are now 7 (Username, Telegram ID, Phone, Balance, Bonus Balance, Registered At, Actions)
    const COL_SPAN = 7; 

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-8 ">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
                All Registered Users
            </h3>

            {/* Search Boxes */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Search by username..."
                    value={usernameQuery}
                    onChange={(e) => onSearchChange('username', e.target.value)}
                    className="w-full md:w-1/3 px-4 py-2 border rounded-lg text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                    type="text"
                    placeholder="Search by phone number or Telegram ID..."
                    value={contactQuery}
                    onChange={(e) => onSearchChange('contact', e.target.value)}
                    className="w-full md:w-1/3 px-4 py-2 border rounded-lg shadow-sm text-black   focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            <div className="overflow-x-auto">
                <table className="table-auto border-collapse w-full "><thead>
                    <tr className="bg-gray-200 text-gray-700 uppercase text-xs leading-normal">
                        <th
                            className="py-3 px-6 text-left cursor-pointer hover:bg-gray-300 transition-colors duration-150 rounded-tl-lg whitespace-nowrap"
                            onClick={() => handleSortClick('username')}
                        >
                            Username {renderSortIcon('username')}
                        </th>
                        <th
                            className="py-3 px-6 text-left cursor-pointer hover:bg-gray-300 transition-colors duration-150 hidden md:table-cell whitespace-nowrap"
                            onClick={() => handleSortClick('telegramId')}
                        >
                            Telegram ID {renderSortIcon('telegramId')}
                        </th>
                        <th className="py-3 px-6 text-left whitespace-nowrap">Phone Number</th>
                        <th
                            className="py-3 px-6 text-left cursor-pointer hover:bg-gray-300 transition-colors duration-150 whitespace-nowrap"
                            onClick={() => handleSortClick('balance')}
                        >
                            Balance {renderSortIcon('balance')}
                        </th>
                        {/* START: NEW COLUMN FOR BONUS BALANCE */}
                        <th
                            className="py-3 px-6 text-left cursor-pointer hover:bg-gray-300 transition-colors duration-150 whitespace-nowrap"
                            onClick={() => handleSortClick('bonus_balance')}
                        >
                            Bonus Balance {renderSortIcon('bonus_balance')}
                        </th>
                        {/* END: NEW COLUMN FOR BONUS BALANCE */}
                        {/* Registered At hidden on small screens */}
                        <th
                            className="py-3 px-6 text-left cursor-pointer hover:bg-gray-300 transition-colors duration-150 hidden md:table-cell whitespace-nowrap"
                            onClick={() => handleSortClick('registeredAt')}
                        >
                            Registered At {renderSortIcon('registeredAt')}
                        </th>
                        <th className="py-3 px-6 text-left rounded-tr-lg whitespace-nowrap">Actions</th>
                    </tr>
                </thead><tbody className="text-gray-700 text-sm font-light">
                    {/* Use 'users' prop and explicitly type 'user' */}
                    {users.length > 0 ? ( 
                        users.map((user: User) => ( 
                            <tr
                                key={user._id}
                                className="border-b border-gray-200 hover:bg-gray-100 transition-colors duration-150"
                            >
                                <td className="py-3 px-6 text-left whitespace-nowrap">
                                    {user.username}
                                </td>
                                <td className="py-3 px-6 text-left hidden md:table-cell">
                                    {user.telegramId || 'N/A'}
                                </td>
                                <td className="py-3 px-6 text-left">
                                    {user.phoneNumber || 'N/A'}
                                </td>
                                <td className="py-3 px-6 text-left whitespace-nowrap">
                                    {user.balance.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}{' '}
                                    Birr
                                </td>
                                {/* START: NEW DATA CELL FOR BONUS BALANCE */}
                                <td className="py-3 px-6 text-left whitespace-nowrap">
                                    {(user.bonus_balance || 0).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}{' '}
                                    Birr
                                </td>
                                {/* END: NEW DATA CELL FOR BONUS BALANCE */}
                                {/* Registered At hidden on small screens */}
                                <td className="py-3 px-6 text-left whitespace-nowrap hidden md:table-cell">
                                    {new Date(user.registeredAt).toLocaleDateString()}
                                    <span className="block text-xs text-gray-500">
                                        {new Date(user.registeredAt).toLocaleTimeString()}
                                    </span>
                                </td>
                                <td className="py-3 px-6 text-left">
                                    {/* Link for navigation is now correctly implemented */}
                                    <Link
                                        href={`/superadmine/user/${user._id}`}
                                        className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center gap-1 transition-colors duration-200 text-sm"
                                    >
                                        <FaEdit /> Edit
                                    </Link>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan={COL_SPAN} // Using COL_SPAN which is 7
                                className="py-4 text-center text-gray-500"
                            >
                                No users found.
                            </td>
                        </tr>
                    )}
                </tbody></table>
            </div>

           {totalUsers > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center mt-6 p-3 bg-gray-50 rounded-lg gap-2 w-full">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full md:w-auto"
                >
                    Previous
                </button>

                <span className="text-gray-700 text-center">
                    Page {currentPage} of {totalPages} ({totalUsers} users)
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

// --- Mock App for Preview (Fixes error 2739) ---
const App = () => {
    // Mock Data including bonus_balance
    const mockUsers: User[] = [
        { _id: '1', telegramId: 12345, username: 'UserAlpha', phoneNumber: '251911000000', balance: 5000.5, bonus_balance: 150.0, registeredAt: '2023-01-15T10:00:00Z' },
        { _id: '2', telegramId: 67890, username: 'BetaTester', phoneNumber: '251911000001', balance: 1234.75, bonus_balance: 0.0, registeredAt: '2023-03-22T14:30:00Z' },
        { _id: '3', telegramId: 13579, username: 'CharlieDev', phoneNumber: '251911000002', balance: 800.0, bonus_balance: 25.5, registeredAt: '2023-05-01T08:15:00Z' },
        { _id: '4', username: 'DavidNoContact', balance: 99.99, bonus_balance: 10.0, registeredAt: '2023-06-10T11:45:00Z', telegramId: undefined, phoneNumber: undefined },
        { _id: '5', username: 'EricaUser', balance: 15000.0, bonus_balance: 50.0, registeredAt: '2023-11-20T11:45:00Z' , telegramId: 98765, phoneNumber: '251911000003'},
    ];
    
    // Mock State and Logic (must be present for runnability)
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState('registeredAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); 
    
    // Add state for new search props
    const [usernameQuery, setUsernameQuery] = useState('');
    const [contactQuery, setContactQuery] = useState('');

    const totalUsers = mockUsers.length;
    const itemsPerPage = 10;
    const totalPages = Math.ceil(totalUsers / itemsPerPage);

    const sortUsers = (users: User[]) => {
        const sortableUsers = [...users];
        return sortableUsers.sort((a, b) => {
            const valA = a[sortBy as keyof User] ?? (sortBy === 'username' ? '' : -Infinity);
            const valB = b[sortBy as keyof User] ?? (sortBy === 'username' ? '' : -Infinity);

            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            if (typeof valA === 'number' && typeof valB === 'number') {
                return sortOrder === 'asc' ? valA - valB : valB - valA; 
            }
            // Fallback for dates (registeredAt)
            const dateA = new Date(a.registeredAt).getTime();
            const dateB = new Date(b.registeredAt).getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;

        });
    };

    const sortedUsers = useMemo(() => sortUsers(mockUsers), [mockUsers, sortBy, sortOrder]);


    const handleSortChange = (field: string, order: 'asc' | 'desc') => {
        setSortBy(field);
        setSortOrder(order);
    };

    // Add handler for search change
    const handleSearchChange = (field: 'username' | 'contact', value: string) => {
        if (field === 'username') setUsernameQuery(value);
        if (field === 'contact') setContactQuery(value);
        // In a real app, this should also trigger onPageChange(1) and a data fetch
        setCurrentPage(1); 
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-[Inter]">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b-4 border-indigo-500 pb-2">
                    User Table Preview (Bonus Balance Added)
                </h1>
                <UserTable
                    users={sortedUsers}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    totalUsers={totalUsers}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    onSortChange={handleSortChange}
                    currentSortBy={sortBy}
                    currentSortOrder={sortOrder}
                    usernameQuery={usernameQuery}
                    contactQuery={contactQuery}
                    onSearchChange={handleSearchChange}
                />
            </div>
        </div>
    );
}

export default App;
