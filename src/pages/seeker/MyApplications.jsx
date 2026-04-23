import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { KpiCard, StatusBadge, Spinner, EmptyState } from '../../components/UI';
import { appsAPI } from '../../api';
import API from '../../api';
import toast from 'react-hot-toast';

export default function MyApplications() {
  const [applications, setApps] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('All');
  // FIX: confirm modal for withdraw
  const [withdrawTarget, setWithdrawTarget] = useState(null);

  useEffect(() => {
    appsAPI.myApplications()
      .then(({ data }) => setApps(data))
      .catch(() => toast.error('Failed to load applications'))
      .finally(() => setLoading(false));
  }, []);

  // FIX: Withdraw application — only allowed when status is APPLIED
  const handleWithdraw = (appId) => {
    API.delete(`/applications/${appId}`)
      .then(() => {
        setApps((prev) => prev.filter((a) => a.id !== appId));
        toast.success('Application withdrawn');
        setWithdrawTarget(null);
      })
      .catch(() => toast.error('Failed to withdraw application'));
  };

  const FILTERS = ['All', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED'];

  const filtered = filter === 'All'
    ? applications
    : applications.filter((a) => a.status === filter);

  if (loading) return <Layout pageTitle="My applications"><Spinner /></Layout>;

  return (
    <Layout pageTitle="My applications" pageSubtitle={`${applications.length} total`}>

      {/* Withdraw confirm modal */}
      {withdrawTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"
               onClick={() => setWithdrawTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-80 p-6 z-10">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-center font-semibold text-gray-900 mb-1">Withdraw application?</p>
            <p className="text-center text-sm text-gray-400 mb-5">
              This will remove your application to{' '}
              <span className="font-medium text-gray-700">{withdrawTarget.company}</span>
              {' '}for{' '}
              <span className="font-medium text-gray-700">{withdrawTarget.role}</span>.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setWithdrawTarget(null)}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleWithdraw(withdrawTarget.id)}
                className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 font-medium">
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total',     count: applications.length },
          { label: 'In review', count: applications.filter(a => a.status === 'APPLIED' || a.status === 'SCREENING').length },
          { label: 'Interview', count: applications.filter(a => a.status === 'INTERVIEW').length },
          { label: 'Offer',     count: applications.filter(a => a.status === 'OFFER').length },
          { label: 'Rejected',  count: applications.filter(a => a.status === 'REJECTED').length },
        ].map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.count} />
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors
              ${filter === f
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Applications list */}
      {filtered.length === 0 ? (
        <EmptyState icon="◷" message="No applications in this category." />
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Company</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Role</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Applied</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Match</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Recruiter note</th>
                {/* FIX: Actions column for Withdraw */}
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center
                                      justify-center text-blue-700 text-xs font-medium">
                        {app.jobCompanyName?.[0] || '?'}
                      </div>
                      <span className="text-sm text-gray-800 font-medium">
                        {app.jobCompanyName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{app.jobTitle}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('en-IN') : '—'}
                  </td>
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
                  <td className="px-4 py-3 text-xs text-gray-400 max-w-[150px] truncate">
                    {app.recruiterNote || '—'}
                  </td>
                  {/* FIX: Withdraw only available when APPLIED (not yet reviewed) */}
                  <td className="px-4 py-3">
                    {app.status === 'APPLIED' && (
                      <button
                        onClick={() => setWithdrawTarget({
                          id: app.id,
                          company: app.jobCompanyName,
                          role: app.jobTitle,
                        })}
                        className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                        Withdraw
                      </button>
                    )}
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