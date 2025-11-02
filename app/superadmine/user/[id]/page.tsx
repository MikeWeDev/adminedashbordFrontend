// src/app/super-admin/users/[userId]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; 
import Link from 'next/link'; 
import { FaUserEdit, FaSave, FaArrowLeft, FaSpinner } from 'react-icons/fa'; 

/**
 * Interface defining the structure of a single User document.
 * ⭐ CORRECTED to match Mongoose Schema (snake_case)
 */
interface User {
  _id: string;
  telegramId?: number;
  username: string;
  email: string;
  phoneNumber?: string;
  balance: number;
  bonus_balance: number; // ⭐ CORRECTED TO snake_case
  coin_balance: number;  // ⭐ CORRECTED TO snake_case
  registeredAt: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const SUPER_ADMIN_API_BASE_URL = `${BASE_URL}/api/users`; 

export default function SuperAdminUserEditPage() {
  const params = useParams();
  const userId = params.id as string; 
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({}); 
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * useEffect hook to fetch user data based on the userId from the URL.
   */
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        setError("User ID not found in URL.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setSuccessMessage(null); 

        const res = await fetch(`${SUPER_ADMIN_API_BASE_URL}/${userId}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(`User with ID ${userId} not found.`);
          }
          throw new Error(`Failed to fetch user data: ${res.status} ${res.statusText}`);
        }
        const data: User = await res.json();
        setUser(data); 
        
        // ⭐ INITIALIZE FORM DATA with snake_case field names
        setFormData({ 
          username: data.username,
          email: data.email,
          phoneNumber: data.phoneNumber,
          balance: data.balance,
          bonus_balance: data.bonus_balance, // ⭐ CORRECTED
          coin_balance: data.coin_balance,   // ⭐ CORRECTED
        });
      } catch (err: unknown) {
        console.error("Error fetching user data for edit:", err);
        setError((err as Error).message || "An unknown error occurred while fetching user data.");
        setUser(null);
        setFormData({});
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]); 

  /**
   * Handles changes in form input fields and updates the formData state.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      // ⭐ CONVERT all three balance types (using snake_case) to a number
      [name]: (name === 'balance' || name === 'bonus_balance' || name === 'coin_balance') 
              ? parseFloat(value) 
              : value, 
    }));
  };

  /**
   * Handles the form submission for updating user data.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 

    if (!userId) {
      setError("Cannot submit: User ID is missing.");
      return;
    }
    
    // Simple client-side validation - ⭐ Use snake_case
    if (
        !formData.username || 
        typeof formData.balance === 'undefined' || 
        formData.balance === null ||
        typeof formData.bonus_balance === 'undefined' || // ⭐ CORRECTED
        formData.bonus_balance === null ||
        typeof formData.coin_balance === 'undefined' ||  // ⭐ CORRECTED
        formData.coin_balance === null
    ) {
        setError("Username, Balance, Bonus Balance, and Coin Balance are required.");
        return;
    }
    
    // Additional number validation - ⭐ Use snake_case
    if (
        typeof formData.balance !== 'number' || isNaN(formData.balance) ||
        typeof formData.bonus_balance !== 'number' || isNaN(formData.bonus_balance) || // ⭐ CORRECTED
        typeof formData.coin_balance !== 'number' || isNaN(formData.coin_balance) // ⭐ CORRECTED
    ) {
        setError("All balance fields must be valid numbers.");
        return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      // ⭐ IMPORTANT: Map the snake_case formData back to the camelCase expected by the backend route
      // The backend route is expecting: { username, phoneNumber, balance, bonusBalance, coinBalance }
      const payload = {
          username: formData.username,
          phoneNumber: formData.phoneNumber,
          balance: formData.balance,
          // Map back to camelCase for the API payload
          bonusBalance: formData.bonus_balance, 
          coinBalance: formData.coin_balance,  
      };


      const res = await fetch(`${SUPER_ADMIN_API_BASE_URL}/${userId}`, {
        method: 'PUT', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload), // Send the new payload
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to update user: ${res.status} ${res.statusText}`);
      }

      const updatedUser: User = await res.json();
      setUser(updatedUser); 
      setSuccessMessage('User updated successfully!');

    } catch (err: unknown) {
      console.error("Error updating user:", err);
      setError((err as Error).message || "An unknown error occurred during update.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-8">
        <FaSpinner className="animate-spin text-indigo-600 text-4xl mr-3" />
        <span className="text-xl text-gray-700">Loading user data...</span>
      </div>
    );
  }

  if (error && !user) { 
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Not Found!</strong>
          <span className="block sm:inline ml-2">User details could not be loaded.</span>
          <Link href="/superadmine/userMangment">
             <span className="ml-4 text-indigo-600 hover:underline">Back to User List</span>
          </Link>
        </div>
      </div>
    );
  }


  return (
    <div className="p-8 bg-gray-100 min-h-screen text-black">
      {/* Page Header */}
    <div className="bg-white p-6 rounded-lg shadow-md mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
  <div className="w-full md:w-auto">
    <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 flex items-center flex-wrap gap-2">
      <FaUserEdit className="text-indigo-600" />
      Edit User: {user.username}
    </h1>
    <p className=" text-sm sm:text-lg">
      Modify user data and audit balance changes.
    </p>
  </div>
  <Link href="/superadmine/userMangment" className="w-full md:w-auto">
    <button className="w-full md:w-auto bg-gray-300 hover:bg-gray-400 font-bold py-2 px-4 rounded-lg flex justify-center items-center gap-2 transition-colors duration-200">
      <FaArrowLeft />
      Back
    </button>
  </Link>
</div>


      {/* Form Section */}
      <div className="bg-white p-8 rounded-lg shadow-md">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Success!</strong>
            <span className="block sm:inline ml-2">{successMessage}</span>
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        {/* Updated Form Layout with 4 columns for balance types */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-bold mb-2">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Email (Readonly) */}
          <div>
            <label htmlFor="email" className="block text-sm font-bold mb-2">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight bg-gray-100 cursor-not-allowed"
              readOnly
            />
          </div>
          

          {/* Phone Number */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-bold mb-2">Phone Number:</label>
            <input
              type="text"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Telegram ID (Display Only - Not Editable) */}
          <div>
            <label htmlFor="telegramId" className="block text-sm font-bold mb-2">Telegram ID:</label>
            <input
              type="text"
              id="telegramId"
              name="telegramId"
              value={user.telegramId || 'N/A'}
              className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight bg-gray-100 cursor-not-allowed"
              readOnly 
            />
            <p className="text-xs mt-1">Telegram ID cannot be changed.</p>
          </div>
          
          <div className="md:col-span-2">
            <h3 className="text-lg font-extrabold mt-4 mb-2 border-b pb-1">Balance Adjustments</h3>
          </div>
          
          {/* Main Balance */}
          <div>
            <label htmlFor="balance" className="block text-gray-700 text-sm font-bold mb-2">Main Balance (Birr):</label>
            <input
              type="number"
              id="balance"
              name="balance"
              value={typeof formData.balance === 'number' ? formData.balance : ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500"
              step="0.01" 
              required
            />
            {user.balance !== undefined && (
              <p className="text-xs mt-1">Current: {user.balance.toFixed(2)} Birr</p>
            )}
          </div>
          
          {/* ⭐ CORRECTED: Bonus Balance Input (name="bonus_balance") */}
          <div>
            <label htmlFor="bonus_balance" className="block text-gray-700 text-sm font-bold mb-2">Bonus Balance (Birr):</label>
            <input
              type="number"
              id="bonus_balance"
              name="bonus_balance" // ⭐ CORRECTED
              value={typeof formData.bonus_balance === 'number' ? formData.bonus_balance : ''} // ⭐ CORRECTED
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500"
              step="0.01" 
              required
            />
            {user.bonus_balance !== undefined && ( // ⭐ CORRECTED
              <p className="text-xs mt-1">Current: {user.bonus_balance.toFixed(2)} Birr</p> // ⭐ CORRECTED
            )}
          </div>

          {/* ⭐ CORRECTED: Coin Balance Input (name="coin_balance") */}
          <div>
            <label htmlFor="coin_balance" className="block text-gray-700 text-sm font-bold mb-2">Coin Balance (Coins):</label>
            <input
              type="number"
              id="coin_balance"
              name="coin_balance" // ⭐ CORRECTED
              value={typeof formData.coin_balance === 'number' ? formData.coin_balance : ''} // ⭐ CORRECTED
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500"
              step="1" 
              required
            />
            {user.coin_balance !== undefined && ( // ⭐ CORRECTED
              <p className="text-xs mt-1">Current: {user.coin_balance.toFixed(0)} Coins</p> // ⭐ CORRECTED
            )}
          </div>
          
          {/* Registered At (Display Only) */}
          <div>
            <label htmlFor="registeredAt" className="block text-sm font-bold mb-2">Registered At:</label>
            <input
              type="text"
              id="registeredAt"
              name="registeredAt"
              value={new Date(user.registeredAt).toLocaleString()}
              className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight bg-gray-100 cursor-not-allowed"
              readOnly
            />
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2 text-right mt-4">
            <button
              type="submit"
              disabled={submitting || loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg inline-flex items-center gap-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <FaSpinner className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <FaSave /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}