'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';

const API_BASE_URL = 'http://localhost:5000/api/bonusCliam'; // Update if needed

export interface Claim {
    claimId: string;
    telegramId: number;
    username: string;
    bonusAmount: number;
    claimedAt: string;
}

export interface ClaimsResponse {
    claims: Claim[];
    currentPage: number;
    totalPages: number;
    totalClaimsCount: number;
    currentDate: string; // YYYY-MM-DD
}

export default function BonusClaimsPage() {
    const [data, setData] = useState<ClaimsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    // State to track the date being viewed (format: YYYY-MM-DD)
    const [viewDate, setViewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [page, setPage] = useState(1);

    const fetchData = useCallback(async (targetDate: string, targetPage: number) => {
        setLoading(true);
        try {
            const url = `${API_BASE_URL}/daily-bonus-claims?page=${targetPage}&date=${targetDate}`;
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error('Failed to fetch data');
            }
            const result: ClaimsResponse = await res.json();
            setData(result);
            setPage(targetPage); // Ensure state matches fetched page
            setViewDate(targetDate); // Ensure state matches fetched date
        } catch (error) {
            console.error('Fetch error:', error);
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(viewDate, page);
    }, [fetchData, viewDate, page]);


    // --- Navigation Handlers ---

    const navigateDay = (direction: 'prev' | 'next') => {
        const currentDate = new Date(viewDate);
        const newDate = new Date(currentDate);

        if (direction === 'prev') {
            newDate.setDate(currentDate.getDate() - 1);
        } else {
            newDate.setDate(currentDate.getDate() + 1);
        }

        // Reset page to 1 when changing the day
        setPage(1); 
        setViewDate(format(newDate, 'yyyy-MM-dd'));
    };

    const navigatePage = (newPage: number) => {
        if (newPage >= 1 && newPage <= (data?.totalPages || 1)) {
            setPage(newPage);
        }
    };

    // --- Render Logic ---

    if (loading && !data) return <div className="p-8 text-center text-gray-500">Loading claims data...</div>;
    
    const claims = data?.claims || [];
    const { totalClaimsCount, currentPage, totalPages, currentDate } = data || {
        totalClaimsCount: 0,
        currentPage: 1,
        totalPages: 1,
        currentDate: viewDate,
    };


    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">💰 Daily Bonus Claim Report</h1>
            
            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow">
                <button
                    onClick={() => navigateDay('prev')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-150"
                >
                    &larr; Prev Day
                </button>
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-700">
                        Claims for: {format(new Date(currentDate), 'MMM dd, yyyy')}
                    </h2>
                    <p className="text-sm text-gray-500">{totalClaimsCount} total claims</p>
                </div>
                <button
                    onClick={() => navigateDay('next')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-150"
                >
                    Next Day &rarr;
                </button>
            </div>

            {claims.length === 0 && !loading ? (
                <div className="text-center p-10 bg-white rounded-lg shadow">
                    <p className="text-gray-500">No bonus claims found for {format(new Date(currentDate), 'MMM dd, yyyy')}.</p>
                </div>
            ) : (
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telegram ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {claims.map((claim) => (
                                <tr key={claim.claimId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {format(new Date(claim.claimedAt), 'hh:mm:ss a')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">{claim.telegramId}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{claim.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">{claim.bonusAmount} Birr</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 space-x-4">
                    <button
                        onClick={() => navigatePage(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:bg-gray-100 transition"
                    >
                        &larr; Prev Page
                    </button>
                    <span className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => navigatePage(currentPage + 1)}
                        disabled={currentPage === totalPages || loading}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:bg-gray-100 transition"
                    >
                        Next Page &rarr;
                    </button>
                </div>
            )}
        </div>
    );
}