import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import { JobCard, Spinner, EmptyState } from '../../components/UI';
import { jobsAPI, appsAPI, profileAPI } from '../../api';
import API from '../../api';
import toast from 'react-hot-toast';

const WORK_TYPES = ['All', 'REMOTE', 'HYBRID', 'ONSITE'];

export default function BrowseJobs() {
  // FIX: read keyword/location passed from the landing page search bar
  const [searchParams] = useSearchParams();

  const [jobs, setJobs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [savedIds, setSavedIds]     = useState(new Set());
  // Pre-fill from URL params (e.g. landing page search → login → here)
  const [keyword, setKeyword]   = useState(searchParams.get('keyword') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [workType, setWorkType] = useState('All');
  const [page, setPage]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  // FIX: apply modal state
  const [applyTarget, setApplyTarget] = useState(null); // { jobId, resumes }
  const [coverLetter, setCoverLetter] = useState('');
  const [selectedResumeUrl, setSelectedResumeUrl] = useState('');

  const fetchJobs = useCallback(() => {
    setLoading(true);
    const params = {
      page,
      size: 8,
      keyword:  keyword  || undefined,
      location: location || undefined,
      workType: workType !== 'All' ? workType : undefined,
    };
    jobsAPI.search(params)
      .then(({ data }) => {
        setJobs(data.content || []);
        setTotalPages(data.totalPages || 1);
      })
      .catch(() => toast.error('Failed to load jobs'))
      .finally(() => setLoading(false));
  }, [keyword, location, workType, page]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // Load applied IDs silently
  useEffect(() => {
    appsAPI.myApplications(true)
      .then(({ data }) => setAppliedIds(new Set(data.map((a) => a.jobId))))
      .catch(() => {});
  }, []);

  // FIX: Load saved job IDs so Save button shows correct state on page load
  useEffect(() => {
    API.get('/saved-jobs', { _silent: true })
      .then(({ data }) => setSavedIds(new Set(data.map((s) => s.job?.id))))
      .catch(() => {});
  }, []);

  // FIX: Open apply modal — load user resumes first, then show selection
  const handleApply = (jobId) => {
    profileAPI.getMyProfile()
      .then(({ data }) => {
        const resumes = data?.resumes || [];
        const primary = resumes.find((r) => r.isPrimary) || resumes[0];
        setSelectedResumeUrl(primary?.url || '');
        setCoverLetter('');
        setApplyTarget({ jobId, resumes });
      })
      .catch(() => {
        // If profile load fails, still allow apply without resume
        setSelectedResumeUrl('');
        setCoverLetter('');
        setApplyTarget({ jobId, resumes: [] });
      });
  };

  const confirmApply = () => {
    if (!applyTarget) return;
    appsAPI.apply({ jobId: applyTarget.jobId, resumeUrl: selectedResumeUrl, coverLetter })
      .then(() => {
        setAppliedIds((prev) => new Set([...prev, applyTarget.jobId]));
        toast.success('Application submitted!');
        setApplyTarget(null);
      })
      .catch((err) => toast.error(err.response?.data?.error || 'Apply failed'));
  };

  // FIX: actually call the save/unsave API instead of just showing a toast
  const handleSave = (jobId) => {
    const alreadySaved = savedIds.has(jobId);

    if (alreadySaved) {
      API.delete(`/saved-jobs/${jobId}`)
        .then(() => {
          setSavedIds((prev) => { const s = new Set(prev); s.delete(jobId); return s; });
          toast('Removed from saved jobs');
        })
        .catch(() => toast.error('Failed to unsave'));
    } else {
      API.post(`/saved-jobs/${jobId}`)
        .then(() => {
          setSavedIds((prev) => new Set([...prev, jobId]));
          toast.success('Job saved!');
        })
        .catch((err) => toast.error(err.response?.data?.error || 'Failed to save'));
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchJobs();
  };

  return (
    <Layout pageTitle="Browse jobs" pageSubtitle="Find your next opportunity">

      {/* FIX: Apply modal with resume + cover letter */}
      {applyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"
               onClick={() => setApplyTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Confirm Application</h2>

            {/* Resume select */}
            {applyTarget.resumes.length > 0 ? (
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">Select resume</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedResumeUrl}
                  onChange={(e) => setSelectedResumeUrl(e.target.value)}>
                  {applyTarget.resumes.map((r) => (
                    <option key={r.id} value={r.url}>
                      {r.name}{r.isPrimary ? ' (Primary)' : ''}
                    </option>
                  ))}
                  <option value="">Don't attach resume</option>
                </select>
              </div>
            ) : (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-4">
                No resume uploaded yet.{' '}
                <a href="/profile" className="underline">Upload one from your profile</a>.
              </p>
            )}

            {/* Cover letter */}
            <div className="mb-5">
              <label className="block text-xs text-gray-500 mb-1">Cover letter (optional)</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Tell the recruiter why you're a great fit..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={confirmApply}
                className="flex-1 py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 font-medium">
                Submit Application
              </button>
              <button onClick={() => setApplyTarget(null)}
                className="flex-1 py-2.5 border border-gray-200 text-sm rounded-xl hover:bg-gray-50 text-gray-600">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Search bar */}
      <form onSubmit={handleSearch}
        className="bg-white border border-gray-100 rounded-xl p-4 mb-5 flex gap-3">
        <input
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Job title, skills, company..."
          value={keyword} onChange={(e) => setKeyword(e.target.value)}
        />
        <input
          className="w-36 px-3 py-2 border border-gray-200 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Location"
          value={location} onChange={(e) => setLocation(e.target.value)}
        />
        <button type="submit"
          className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          Search
        </button>
      </form>

      {/* Work type filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {WORK_TYPES.map((wt) => (
          <button key={wt} onClick={() => { setWorkType(wt); setPage(0); }}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors
              ${workType === wt
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
            {wt === 'All' ? 'All types' : wt[0] + wt.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Jobs grid */}
      {loading ? <Spinner /> : jobs.length === 0 ? (
        <EmptyState icon="⊞" message="No jobs found. Try a different search." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                applied={appliedIds.has(job.id)}
                // FIX: pass saved state and real handler
                saved={savedIds.has(job.id)}
                onApply={handleApply}
                onSave={handleSave}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}
              className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg
                         hover:bg-gray-50 disabled:opacity-40">
              ← Prev
            </button>
            <span className="text-sm text-gray-400">
              Page {page + 1} of {totalPages}
            </span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}
              className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg
                         hover:bg-gray-50 disabled:opacity-40">
              Next →
            </button>
          </div>
        </>
      )}
    </Layout>
  );
}