import React, { useEffect, useState } from 'react';
// FIX: Correct import path — AdminJobs is at pages/admin/, not pages/
import Layout from '../../components/Layout';
import { StatusBadge, Spinner, EmptyState } from '../../components/UI';
import { adminAPI } from '../../api';
import toast from 'react-hot-toast';

export default function AdminJobs() {
  const [jobs, setJobs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('All');

  useEffect(() => {
    adminAPI.allJobs()
      .then(({ data }) => setJobs(data))
      .catch(() => toast.error('Failed to load jobs'))
      .finally(() => setLoading(false));
  }, []);

  const closeJob = (id) => {
    adminAPI.closeJob(id)
      .then(() => {
        setJobs((prev) => prev.map((j) => j.id === id ? { ...j, status: 'CLOSED' } : j));
        toast.success('Job closed');
      })
      .catch(() => toast.error('Failed'));
  };

  const filtered = jobs
    .filter((j) => statusFilter === 'All' || j.status === statusFilter)
    .filter((j) =>
      !search ||
      j.title?.toLowerCase().includes(search.toLowerCase()) ||
      j.companyName?.toLowerCase().includes(search.toLowerCase())
    );

  if (loading) return <Layout pageTitle="All jobs"><Spinner /></Layout>;

  return (
    <Layout
      pageTitle="All jobs"
      pageSubtitle={`${jobs.length} total · ${jobs.filter(j => j.status === 'ACTIVE').length} active`}
    >
      <div className="flex gap-3 mb-5">
        <input
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search jobs by title or company..."
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700"
          value={statusFilter} onChange={(e) => setStatus(e.target.value)}>
          <option value="All">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="CLOSED">Closed</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="⊞" message="No jobs found." />
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium w-56">Job</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium w-36">Company</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium w-24">Type</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium w-20">Apps</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium w-20">Views</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium w-20">Status</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium w-24">Posted</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800 truncate">{job.title}</p>
                    <p className="text-xs text-gray-400 truncate">{job.location}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 truncate">{job.companyName}</td>
                  <td className="px-4 py-3"><StatusBadge status={job.workType} /></td>
                  <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                    {job.applicationCount}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{job.viewCount}</td>
                  <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {job.postedAt ? new Date(job.postedAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {job.status === 'ACTIVE' && (
                      <button onClick={() => closeJob(job.id)}
                        className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded-lg
                                   hover:bg-red-100">
                        Close
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
