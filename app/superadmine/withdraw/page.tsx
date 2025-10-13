// C:/Users/mike199414/Desktop/Projects/Telegram bingo game/TELGRAM BINGO GAME DASHBORD/Admine Dashbord/client/app/superadmine/withdraw/page.tsx

'use client';

import { useState, useEffect } from 'react';

// ✅ Define the type for a Withdrawal object
interface Withdrawal {
  _id: string;
  amount: number;
  telegramId: string;
  account_number: string;
  bank_code: string;
  createdAt: string;
}

export default function AdminDashboard() {
  // ✅ Use the new interface to type the state
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const fetchWithdrawals = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/withdrawReq/withdrawals/pending`);
      if (!response.ok) {
        throw new Error('Failed to fetch data.');
      }
      const data: Withdrawal[] = await response.json();
      setWithdrawals(data);
    } catch (err: unknown) { // ✅ Add type annotation for 'err'
      // ✅ Safely check and handle the error message
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  // ✅ Add explicit type for 'withdrawalId'
  const handleComplete = async (withdrawalId: string) => {
    if (window.confirm('Are you sure you want to complete this withdrawal?')) {
      try {
        const res = await fetch('https://adminbackend.bingoogame.com/api/withdrawReq/withdrawals/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ withdrawalId }),
        });
        if (!res.ok) {
          throw new Error('Failed to complete withdrawal.');
        }
        fetchWithdrawals();
      } catch (err) {
        alert('Failed to complete withdrawal. Please try again.');
      }
    }
  };

  // ✅ Add explicit type for 'withdrawalId'
  const handleCancel = async (withdrawalId: string) => {
    if (window.confirm('Are you sure you want to cancel this withdrawal?')) {
      try {
        const res = await fetch('https://adminbackend.bingoogame.com/api/withdrawReq/withdrawals/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ withdrawalId }),
        });
        if (!res.ok) {
          throw new Error('Failed to cancel withdrawal.');
        }
        fetchWithdrawals();
      } catch (err) {
        alert('Failed to cancel withdrawal. Please try again.');
      }
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading withdrawals...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Admin Dashboard</h1>
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">Pending Withdrawals ({withdrawals.length})</h2>
      
      {withdrawals.length === 0 ? (
        <div className="p-4 bg-white rounded-lg shadow-md text-center text-gray-500">
          No pending withdrawal requests.
        </div>
      ) : (
        <div className="space-y-4">
          {/* ✅ The 'item' is now correctly typed as Withdrawal */}
          {withdrawals.map((item: Withdrawal) => (
            <div key={item._id} className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center flex-wrap">
              <div className="flex-1 min-w-[200px] mb-4 md:mb-0">
                <p className="text-lg font-medium text-gray-900">
                  <span className="font-bold">Amount:</span> {item.amount} Birr
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold">User ID:</span> {item.telegramId}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Account:</span> {item.account_number} ({item.bank_code})
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Requested:</span> {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => handleComplete(item._id)}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Complete
                </button>
                <button
                  onClick={() => handleCancel(item._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}