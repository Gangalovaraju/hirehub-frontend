import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// FIX: Correct import path — file is at pages/recruiter/RecruiterJobs.jsx,
//      so components are at ../../components, not ../components
import Layout from '../../components/Layout';
import { StatusBadge, Spinner, EmptyState } from '../../components/UI';
import { jobsAPI } from '../../api';
import toast from 'react-hot-toast';

export default function RecruiterJobs() {
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    jobsAPI.myJobs()
      .then(({ data }) => setJobs(data))
      .catch(() => toast.error('Failed to load jobs'))
      .finally(() => setLoading(false));
  }, []);

  const closeJob = (id) => {
    jobsAPI.update(id, { status: 'CLOSED' })
      .then(() => {
        setJobs((prev) => prev.map((j) => j.id === id ? { ...j, status: 'CLOSED' } : j));
        toast.success('Job closed');
      })
      .catch(() => toast.error('Failed to close job'));
  };

  const deleteJob = (id) => {
    if (!window.confirm('Delete this job? This cannot be undone.')) return;
    jobsAPI.delete(id)
      .then(() => {
        setJobs((prev) => prev.filter((j) => j.id !== id));
        toast.success('Job deleted');
      })
      .catch(() => toast.error('Failed to delete job'));
  };

  if (loading) return <Layout pageTitle="My jobs"><Spinner /></Layout>;

  return (
    <Layout
      pageTitle="My jobs"
      pageSubtitle={`${jobs.length} total · ${jobs.filter(j => j.status === 'ACTIVE').length} active`}
      topAction={
        <Link to="/recruiter/post-job"
          className="px-4 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Post a Job
        </Link>
      }
    >
      {jobs.length === 0 ? (
        <EmptyState
          icon="⊞"
          message="No jobs posted yet."
          action={
            <Link to="/recruiter/post-job"
              className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              Post your first job
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id}
              className="bg-white border border-gray-100 rounded-xl p-5
                         hover:border-gray-200 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center
                                  text-blue-700 font-semibold text-sm flex-shrink-0">
                    {job.companyName?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">{job.title}</p>
                      <StatusBadge status={job.status} />
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      {job.companyName} · {job.location} · {job.workType}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {job.skills?.slice(0, 5).map((s) => (
                        <span key={s} className="text-xs bg-gray-50 text-gray-500
                                                  px-2 py-0.5 rounded-md">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 flex-shrink-0 ml-4">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">{job.applicationCount}</p>
                    <p className="text-xs text-gray-400">applicants</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">{job.viewCount}</p>
                    <p className="text-xs text-gray-400">views</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {job.status === 'ACTIVE' && (
                      <button onClick={() => closeJob(job.id)}
                        className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg
                                   hover:bg-gray-50 text-gray-600">
                        Close
                      </button>
                    )}
                    <Link to={`/recruiter/candidates?job=${job.id}`}
                      className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg
                                 hover:bg-blue-100 text-center">
                      View candidates
                    </Link>
                    <button onClick={() => deleteJob(job.id)}
                      className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg
                                 hover:bg-red-100">
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-4">
                <p className="text-xs text-gray-400">
                  Posted: {job.postedAt ? new Date(job.postedAt).toLocaleDateString('en-IN') : '—'}
                </p>
                {job.salaryMin && (
                  <p className="text-xs text-gray-400">
                    Salary: ₹{job.salaryMin}–{job.salaryMax} LPA
                  </p>
                )}
                {job.experienceRequired && (
                  <p className="text-xs text-gray-400">Exp: {job.experienceRequired}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
