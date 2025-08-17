'use client';

import { useEffect, useState } from 'react';
import { FaTrash, FaUserPlus } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

type AdminUser = {
  _id: string;
  username: string;
  role: 'admin' | 'superadmin' | string;
};

const API_BASE = 'https://adminedashbordbackend.onrender.com/api/auth';

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/admin/users`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to fetch users: ${res.statusText}`);
      const data = await res.json();
      setUsers(data.data);
    } catch (e: unknown) {
  if (e instanceof Error) {
    setError(e.message);
  } else {
    setError(String(e) || 'Unknown error');
  }
} finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const deleteUser = async (id: string) => {
    const confirmDelete = confirm('Are you sure you want to delete this user?');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const msg = await res.text();
        alert(`Failed to delete user: ${msg}`);
        return;
      }
      fetchUsers();
    } catch (err: any) {
      alert(`Error deleting user: ${err?.message || err}`);
    }
  };

  if (loading) return <div className="p-4 sm:p-6 text-gray-700">Loading users…</div>;
  if (error) return <div className="p-4 sm:p-6 text-red-600">Error: {error}</div>;

  return (
    <main className="flex-1 w-full p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-[1000px] flex flex-col gap-6">
        {/* Header + Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl sm:text-2xl font-semibold">Admin Users</h2>
          <button
            onClick={() => router.push('/auth/register')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base rounded transition w-full sm:w-auto justify-center"
          >
            <FaUserPlus className="inline-block" />
            Add New Admin
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full text-sm sm:text-base">
            <thead className="bg-gray-200 text-gray-700 uppercase text-xs sm:text-sm">
              <tr>
                <th className="py-3 px-3 sm:px-4 text-left">Username</th>
                <th className="py-3 px-3 sm:px-4 text-left">Role</th>
                <th className="py-3 px-3 sm:px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}

              {users.map((u) => (
                <tr key={u._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-2 px-3 sm:py-3 sm:px-4">{u.username}</td>
                  <td className="py-2 px-3 sm:py-3 sm:px-4">{u.role}</td>
                  <td className="py-2 px-3 sm:py-3 sm:px-4 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => deleteUser(u._id)}
                      className="flex items-center justify-center px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm rounded transition w-full sm:w-auto"
                    >
                      <FaTrash className="inline-block mr-1" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
