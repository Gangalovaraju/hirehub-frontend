import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { StatusBadge, Spinner, EmptyState } from '../../components/UI';
import { appsAPI } from '../../api';
import toast from 'react-hot-toast';

const STATUSES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'ROUND2', 'OFFER', 'REJECTED'];

export default function Candidates() {
  const [candidates, setCands] = useState([]);
  const [loading, setLoading]  = useState(true);
  const [search, setSearch]    = useState('');
  const [filter, setFilter]    = useState('All');

  useEffect(() => {
    appsAPI.allCandidates()
      .then(({ data }) => setCands(data))
      .catch(() => toast.error('Failed to load candidates'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = (appId, status) => {
    appsAPI.updateStatus(appId, { status })
      .then(() => {
        setCands((prev) => prev.map((c) => c.id === appId ? { ...c, status } : c));
        toast.success(`Moved to ${status}`);
      })
      .catch(() => toast.error('Update failed'));
  };

  // FIX: use flat transient fields for search/filter
  const filtered = candidates
    .filter((c) => filter === 'All' || c.status === filter)
    .filter((c) =>
      !search ||
      c.applicantName?.toLowerCase().includes(search.toLowerCase()) ||
      c.jobTitle?.toLowerCase().includes(search.toLowerCase())
    );

  if (loading) return <Layout pageTitle="Candidates"><Spinner /></Layout>;

  return (
    <Layout
      pageTitle="Candidates"
      pageSubtitle={`${candidates.length} applicants across all roles`}
    >
      {/* Search + filter */}
      <div className="flex gap-3 mb-4">
        <input
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search by name or role..."
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white
                     text-gray-700 focus:outline-none"
          value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="All">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="◎" message="No candidates match your filter." />
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium w-48">Candidate</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium w-40">Role</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium w-20">Match</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium w-28">Status</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium w-24">Applied</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-purple-50 flex items-center
                                      justify-center text-purple-700 text-xs font-medium flex-shrink-0">
                        {/* FIX: flat field */}
                        {app.applicantName?.split(' ').map((w) => w[0]).join('') || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {app.applicantName}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {app.applicantLocation}
                        </p>
                      </div>
                    </div>
                  </td>
                  {/* FIX: flat field */}
                  <td className="px-4 py-3 text-gray-600 text-xs truncate">{app.jobTitle}</td>
                  <td className="px-4 py-3">
                    {app.matchScore ? (
                      <span className="text-xs font-medium text-green-700 bg-green-50
                                       px-2 py-0.5 rounded-full">
                        {app.matchScore}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {app.status !== 'OFFER' && app.status !== 'REJECTED' && (
                        <button onClick={() => {
                          const next = STATUSES[STATUSES.indexOf(app.status) + 1];
                          if (next) updateStatus(app.id, next);
                        }}
                          className="px-2.5 py-1 text-xs bg-green-50 text-green-700
                                     rounded-lg hover:bg-green-100">
                          Advance
                        </button>
                      )}
                      {app.status !== 'REJECTED' && (
                        <button onClick={() => updateStatus(app.id, 'REJECTED')}
                          className="px-2.5 py-1 text-xs bg-red-50 text-red-600
                                     rounded-lg hover:bg-red-100">
                          Reject
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
