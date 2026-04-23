import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { StatusBadge, Spinner, EmptyState } from '../../components/UI';
import { adminAPI } from '../../api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]  = useState('');
  const [roleFilter, setRole] = useState('All');

  useEffect(() => {
    adminAPI.allUsers()
      .then(({ data }) => setUsers(data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const deactivate = (id) => {
    adminAPI.deactivateUser(id)
      .then(() => {
        setUsers((prev) => prev.map((u) => u.id === id ? { ...u, active: false } : u));
        toast.success('User deactivated');
      })
      .catch(() => toast.error('Failed'));
  };

  // FIX: reactivate a previously deactivated user
  const reactivate = (id) => {
    adminAPI.activateUser(id)
      .then(() => {
        setUsers((prev) => prev.map((u) => u.id === id ? { ...u, active: true } : u));
        toast.success('User reactivated');
      })
      .catch(() => toast.error('Failed'));
  };

  const filtered = users
    .filter((u) => roleFilter === 'All' || u.role === roleFilter)
    .filter((u) =>
      !search ||
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    );

  if (loading) return <Layout pageTitle="Users"><Spinner /></Layout>;

  return (
    <Layout pageTitle="Users" pageSubtitle={`${users.length} total registered users`}>
      <div className="flex gap-3 mb-5">
        <input
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search by name or email..."
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700"
          value={roleFilter} onChange={(e) => setRole(e.target.value)}>
          <option value="All">All roles</option>
          <option value="SEEKER">Seekers</option>
          <option value="RECRUITER">Recruiters</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="◎" message="No users found." />
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium w-52">User</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium w-24">Role</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium w-32">Location</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium w-24">Joined</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium w-20">Status</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center
                                      justify-center text-blue-700 text-xs font-medium flex-shrink-0">
                        {u.fullName?.split(' ').map((w) => w[0]).join('') || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{u.fullName}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.role} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 truncate">
                    {u.location || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      u.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {u.active && u.role !== 'ADMIN' && (
                        <button onClick={() => deactivate(u.id)}
                          className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded-lg
                                     hover:bg-red-100">
                          Deactivate
                        </button>
                      )}
                      {/* FIX: allow admin to reactivate a deactivated user */}
                      {!u.active && (
                        <button onClick={() => reactivate(u.id)}
                          className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded-lg
                                     hover:bg-green-100">
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}