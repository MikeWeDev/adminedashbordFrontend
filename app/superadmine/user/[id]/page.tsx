// src/app/super-admin/users/[userId]/page.tsx // Note: Folder structure should be users/[id] for params.id
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; // For getting URL params and navigation
import Link from 'next/link'; // For "Back to Users" link
import { FaUserEdit, FaSave, FaArrowLeft, FaSpinner } from 'react-icons/fa'; // Icons

/**
 * Interface defining the structure of a single User document.
 * This should match your backend User schema.
 */
interface User {
  _id: string;
  telegramId?: number;
  username: string;
  email: string;
  phoneNumber?: string;
  balance: number;
  registeredAt: string;
}

// ⭐ IMPORTANT: Backend API Base URL for Super Admin User Management.
// Ensure this matches your backend's actual URL.
const SUPER_ADMIN_API_BASE_URL = 'https://adminbackend.bingoogame.com/api/users'; 

export default function SuperAdminUserEditPage() {
  const params = useParams();
  // Corrected: If your folder is `superadmine/user/[id]/page.tsx`, then params.id holds the value.
  // If your folder is `super-admin/users/[userId]/page.tsx`, then params.userId holds the value.
  // Based on your error URL `superadmine/user/68989a547e29e20cdd60b46f`, it's likely `params.id`.
  const userId = params.id as string; 
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({}); // State for form inputs
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * useEffect hook to fetch user data based on the userId from the URL.
   * Runs once on component mount or if userId changes.
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
        setSuccessMessage(null); // Clear previous messages

        const res = await fetch(`${SUPER_ADMIN_API_BASE_URL}/${userId}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(`User with ID ${userId} not found.`);
          }
          throw new Error(`Failed to fetch user data: ${res.status} ${res.statusText}`);
        }
        const data: User = await res.json();
        setUser(data); // Set the full user data
        setFormData({ // Initialize form data with fetched user data
          username: data.username,
          email: data.email,
          phoneNumber: data.phoneNumber,
          balance: data.balance,
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
  }, [userId]); // Dependency: re-run if userId changes (though typically static for this page)

  /**
   * Handles changes in form input fields and updates the formData state.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'balance' ? parseFloat(value) : value, // Convert balance to number
    }));
  };

  /**
   * Handles the form submission for updating user data.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission and page reload

    if (!userId) {
      setError("Cannot submit: User ID is missing.");
      return;
    }
    
    // Simple client-side validation before sending
    if (!formData.username || typeof formData.balance === 'undefined' || formData.balance === null) {
        setError("Username, Email, and Balance are required.");
        return;
    }
    if (typeof formData.balance !== 'number' || isNaN(formData.balance)) {
        setError("Balance must be a valid number.");
        return;
    }
   

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const res = await fetch(`${SUPER_ADMIN_API_BASE_URL}/${userId}`, {
        method: 'PUT', // Use PUT for full replacement, PATCH for partial updates
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData), // Send the form data as JSON
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to update user: ${res.status} ${res.statusText}`);
      }

      const updatedUser = await res.json();
      setSuccessMessage('User updated successfully!');
      // Optionally, update the user state with the returned data or redirect
      // router.push('/super-admin/users'); // Redirect back to user list after successful update

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

  if (error && !user) { // Only show error if no user data could be loaded at all
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      </div>
    );
  }

  // If user is null but not loading and no error, means user not found (handled by error message)
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Not Found!</strong>
          <span className="block sm:inline ml-2">User details could not be loaded.</span>
          <Link href="/superadmine/userMangment">
            <a className="ml-4 text-indigo-600 hover:underline">Back to User List</a>
          </Link>
        </div>
      </div>
    );
  }


  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      {/* Page Header */}
    <div className="bg-white p-6 rounded-lg shadow-md mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
  <div className="w-full md:w-auto">
    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-2 flex items-center flex-wrap gap-2">
      <FaUserEdit className="text-indigo-600" />
      Edit User: {user.username}
    </h1>
    <p className="text-gray-600 text-sm sm:text-lg">
      Modify user data and audit balance changes.
    </p>
  </div>
  <Link href="/superadmine/userMangment" className="w-full md:w-auto">
    <button className="w-full md:w-auto bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg flex justify-center items-center gap-2 transition-colors duration-200">
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

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

        

          {/* Phone Number */}
          <div>
            <label htmlFor="phoneNumber" className="block text-gray-700 text-sm font-bold mb-2">Phone Number:</label>
            <input
              type="text"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Balance (CRITICAL for auditing) */}
          <div>
            <label htmlFor="balance" className="block text-gray-700 text-sm font-bold mb-2">Balance (Birr):</label>
            <input
              type="number"
              id="balance"
              name="balance"
              value={typeof formData.balance === 'number' ? formData.balance : ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-500"
              step="0.01" // Allow decimal values
              required
            />
            {/* Display original balance for comparison if it exists */}
            {user.balance !== undefined && (
              <p className="text-xs text-gray-500 mt-1">Current: {user.balance.toFixed(2)} Birr</p>
            )}
          </div>
          
          {/* Telegram ID (Display Only - Not Editable) */}
          <div>
            <label htmlFor="telegramId" className="block text-gray-700 text-sm font-bold mb-2">Telegram ID:</label>
            <input
              type="text"
              id="telegramId"
              name="telegramId"
              value={user.telegramId || 'N/A'}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100 cursor-not-allowed"
              readOnly // Make it read-only
            />
            <p className="text-xs text-gray-500 mt-1">Telegram ID cannot be changed.</p>
          </div>

          {/* Registered At (Display Only) */}
          <div>
            <label htmlFor="registeredAt" className="block text-gray-700 text-sm font-bold mb-2">Registered At:</label>
            <input
              type="text"
              id="registeredAt"
              name="registeredAt"
              value={new Date(user.registeredAt).toLocaleString()}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100 cursor-not-allowed"
              readOnly
            />
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2 text-right">
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
