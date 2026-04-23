import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { JobCard, Spinner, EmptyState } from '../../components/UI';
import { appsAPI } from '../../api';
import API from '../../api';
import toast from 'react-hot-toast';

export default function SavedJobs() {
  const [savedJobs, setSavedJobs]   = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/saved-jobs'),
      appsAPI.myApplications(true),
    ])
      .then(([savedRes, appsRes]) => {
        setSavedJobs(savedRes.data || []);
        setAppliedIds(new Set((appsRes.data || []).map((a) => a.jobId)));
      })
      .catch(() => toast.error('Failed to load saved jobs'))
      .finally(() => setLoading(false));
  }, []);

  const handleApply = (jobId) => {
    appsAPI.apply({ jobId })
      .then(() => {
        setAppliedIds((prev) => new Set([...prev, jobId]));
        toast.success('Application submitted!');
      })
      .catch((err) => toast.error(err.response?.data?.error || 'Apply failed'));
  };

  // FIX: unsave calls DELETE and removes the card from the list
  const handleUnsave = (jobId) => {
    API.delete(`/saved-jobs/${jobId}`)
      .then(() => {
        setSavedJobs((prev) => prev.filter((s) => s.job?.id !== jobId));
        toast('Removed from saved jobs');
      })
      .catch(() => toast.error('Failed to remove'));
  };

  if (loading) return <Layout pageTitle="Saved jobs"><Spinner /></Layout>;

  return (
    <Layout
      pageTitle="Saved jobs"
      pageSubtitle={`${savedJobs.length} job${savedJobs.length !== 1 ? 's' : ''} saved`}
    >
      {savedJobs.length === 0 ? (
        <EmptyState
          icon="♡"
          message="No saved jobs yet. Browse jobs and click Save to bookmark them here."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {savedJobs.map((saved) => (
            <JobCard
              key={saved.id}
              job={saved.job}
              applied={appliedIds.has(saved.job?.id)}
              // FIX: saved=true so button shows filled heart + hover turns to Unsave
              saved={true}
              onApply={handleApply}
              onSave={handleUnsave}
            />
          ))}
        </div>
      )}
    </Layout>
  );
}
