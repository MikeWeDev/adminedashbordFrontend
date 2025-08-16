'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaEdit, FaSave, FaArrowLeft, FaSpinner } from 'react-icons/fa';

interface Transaction {
  _id: string;
  tx_ref: string;
  telegramId: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'processing' | 'paid' | 'rejected';
  createdAt: string;
  type: 'Payment' | 'Withdrawal';
  bank_code?: string;
  account_name?: string;
  account_number?: string;
  phone_number?: string;
}

const API_URL = 'https://adminedashbordbackend.onrender.com/api/payments';

export default function PaymentEditPage() {
  const params = useParams();
  const id = params.id; // ✅ Use `id` consistently
  const router = useRouter();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState<Partial<Transaction>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

useEffect(() => {
  if (!id) {
    setError('Transaction reference not found in URL.');
    setLoading(false);
    return;
  }

  const fetchTransactionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch by tx_ref using the new backend route
      const res = await fetch(`${API_URL}/by-tx-ref/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error(`Transaction with tx_ref ${id} not found.`);
        throw new Error(`Failed to fetch transaction: ${res.status}`);
      }

      const data: Transaction = await res.json();
      setTransaction(data);

      // Set form data with current transaction status and amount
      setFormData({ status: data.status, amount: data.amount });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  fetchTransactionData();
}, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value,
    }));
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!transaction?._id) {
    setError('Cannot submit: Transaction ID is missing.');
    return;
  }

  if (!formData.status || isNaN(Number(formData.amount))) {
    setError('Status and Amount are required.');
    return;
  }

  try {
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    // Use the actual MongoDB _id for the PUT request
    const res = await fetch(`${API_URL}/${transaction._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || `Failed to update transaction: ${res.status}`);
    }

    const updatedTransaction: Transaction = await res.json();

    setSuccessMessage('Transaction updated successfully!');
    setTransaction(updatedTransaction);
  } catch (err) {
    setError((err as Error).message);
  } finally {
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-8 ">
        <FaSpinner className="animate-spin text-indigo-600 text-4xl mr-3" />
        <span className="text-xl text-gray-700">Loading transaction data...</span>
      </div>
    );
  }

  if (error && !transaction) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-8 ">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error!</strong>
          <span className="ml-2">{error}</span>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-8 ml-64">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Not Found!</strong>
          <span className="ml-2">Transaction could not be loaded.</span>
          <Link href="/superadmine/transcations">
            <button className="ml-4 text-indigo-600 hover:underline">Back to Transactions</button>
          </Link>
        </div>
      </div>
    );
  }

  const isWithdrawal = transaction.type === 'Withdrawal';
  const statusOptions = isWithdrawal
    ? ['pending', 'processing', 'paid', 'failed', 'rejected']
    : ['pending', 'success', 'failed'];

  return (
    <div className="p-8 bg-gray-100 min-h-screen ">
      <div className="bg-white p-6 rounded-lg shadow-md mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2">
            <FaEdit className="inline mr-3 text-indigo-600" />
            Edit {transaction.type}: {transaction.tx_ref}
          </h1>
          <p className="text-gray-600 text-lg">Modify transaction details manually.</p>
        </div>
        <Link href="/superadmine/transcations">
          <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg flex items-center gap-2">
            <FaArrowLeft /> Back 
          </button>
        </Link>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md">
        {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{successMessage}</div>}
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Read-only fields */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Transaction Type:</label>
            <input type="text" value={transaction.type} className="shadow border rounded w-full py-2 px-3 bg-gray-100" readOnly />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Telegram ID:</label>
            <input type="text" value={transaction.telegramId} className="shadow border rounded w-full py-2 px-3 bg-gray-100" readOnly />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Transaction Ref:</label>
            <input type="text" value={transaction.tx_ref} className="shadow border rounded w-full py-2 px-3 bg-gray-100" readOnly />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Created At:</label>
            <input type="text" value={new Date(transaction.createdAt).toLocaleString()} className="shadow border rounded w-full py-2 px-3 bg-gray-100" readOnly />
          </div>

          {/* Editable fields */}
          <div>
            <label htmlFor="amount" className="block text-gray-700 text-sm font-bold mb-2">Amount:</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount ?? ''}
              onChange={handleChange}
              className="shadow border rounded w-full py-2 px-3"
              step="0.01"
              required
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">Status:</label>
            <select
              id="status"
              name="status"
              value={formData.status || ''}
              onChange={handleChange}
              className="shadow border rounded w-full py-2 px-3"
              required
            >
              {statusOptions.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 text-right">
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (<><FaSpinner className="animate-spin" /> Saving...</>) : (<><FaSave /> Save Changes</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
