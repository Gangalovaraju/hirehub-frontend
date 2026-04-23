import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { KpiCard, StatusBadge, BarChart, Card, Spinner } from '../../components/UI';
import { jobsAPI, appsAPI } from '../../api';
import toast from 'react-hot-toast';

export default function RecruiterDashboard() {
  const { user }              = useSelector((s) => s.auth);
  const [jobs, setJobs]       = useState([]);
  const [candidates, setCands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([jobsAPI.myJobs(), appsAPI.allCandidates()])
      .then(([jobsRes, candsRes]) => {
        setJobs(jobsRes.data   || []);
        setCands(candsRes.data || []);
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout pageTitle="Recruiter dashboard"><Spinner /></Layout>;

  const activeJobs = jobs.filter((j) => j.status === 'ACTIVE').length;
  const offers     = candidates.filter((c) => c.status === 'OFFER').length;
  const interviews = candidates.filter((c) => c.status === 'INTERVIEW').length;

  // FIX: use flat transient field jobTitle instead of c.job?.title
  const roleData = candidates.reduce((acc, c) => {
    const title = c.jobTitle || 'Other';
    acc[title]  = (acc[title] || 0) + 1;
    return acc;
  }, {});
  const barData = Object.entries(roleData)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <Layout
      pageTitle="Recruiter dashboard"
      pageSubtitle={`${user?.fullName} · ${new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}`}
      topAction={
        <Link to="/recruiter/post-job"
          className="px-4 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Post a Job
        </Link>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <KpiCard label="Active jobs"      value={activeJobs}        delta="posted"       deltaUp />
        <KpiCard label="Total applicants" value={candidates.length} delta="total received" deltaUp />
        <KpiCard label="Interviews"       value={interviews}        delta="scheduled"    deltaUp />
        <KpiCard label="Offers sent"      value={offers}            delta="this month"   deltaUp />
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        {/* Top candidates */}
        <Card title="Top candidates"
          className="col-span-3"
          action={<Link to="/recruiter/candidates" className="text-xs text-blue-600">View all →</Link>}>
          <div className="divide-y divide-gray-50">
            {candidates.slice(0, 5).map((app) => (
              <div key={app.id} className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center
                                text-purple-700 text-xs font-medium flex-shrink-0">
                  {/* FIX: flat field applicantName */}
                  {app.applicantName?.split(' ').map((w) => w[0]).join('') || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {app.applicantName}
                  </p>
                  {/* FIX: flat fields */}
                  <p className="text-xs text-gray-400 truncate">
                    {app.jobTitle} · {app.applicantLocation}
                  </p>
                </div>
                {app.matchScore && (
                  <span className="text-xs font-medium text-green-700 bg-green-50
                                   px-2.5 py-0.5 rounded-full flex-shrink-0">
                    {app.matchScore}%
                  </span>
                )}
                <StatusBadge status={app.status} />
              </div>
            ))}
            {candidates.length === 0 && (
              <p className="text-sm text-gray-400 py-6 text-center">No candidates yet</p>
            )}
          </div>
        </Card>

        {/* Applications by role */}
        <Card title="Applications by role" className="col-span-2">
          {barData.length > 0
            ? <BarChart data={barData} color="#7C3AED" />
            : <p className="text-xs text-gray-400 text-center py-6">No data yet</p>
          }
        </Card>
      </div>

      {/* Active job listings */}
      <Card title="Your active jobs"
        action={<Link to="/recruiter/jobs" className="text-xs text-blue-600">Manage →</Link>}>
        {jobs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No jobs posted yet.{' '}
            <Link to="/recruiter/post-job" className="text-blue-600 underline">Post one now</Link>
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {jobs.slice(0, 6).map((job) => (
              <div key={job.id}
                className="border border-gray-100 rounded-lg p-3 hover:border-gray-200 transition">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium text-gray-800 line-clamp-1">{job.title}</p>
                  <StatusBadge status={job.status} />
                </div>
                <p className="text-xs text-gray-400 mb-2">{job.location} · {job.workType}</p>
                <p className="text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{job.applicationCount}</span> applicants
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Layout>
  );
}
