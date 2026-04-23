import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { StatusBadge, Spinner, EmptyState } from '../../components/UI';
import { recommendAPI, appsAPI } from '../../api';
import API from '../../api';
import toast from 'react-hot-toast';

export default function Recommendations() {
  const [recs, setRecs]         = useState([]);
  const [appliedIds, setApplied]= useState(new Set());
  const [savedIds, setSaved]    = useState(new Set());
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      recommendAPI.get(20),
      appsAPI.myApplications(true),
      API.get('/saved-jobs', { _silent: true }),
    ]).then(([recRes, appRes, savedRes]) => {
      setRecs(recRes.data || []);
      setApplied(new Set((appRes.data || []).map((a) => a.jobId)));
      setSaved(new Set((savedRes.data || []).map((s) => s.job?.id)));
    }).catch(() => toast.error('Failed to load recommendations'))
    .finally(() => setLoading(false));
  }, []);

  const handleApply = async (jobId) => {
    try {
      await appsAPI.apply({ jobId });
      setApplied((prev) => new Set([...prev, jobId]));
      toast.success('Application submitted!');
    } catch (err) { toast.error(err.response?.data?.error || 'Apply failed'); }
  };

  const handleSave = async (jobId) => {
    try {
      if (savedIds.has(jobId)) {
        await API.delete(`/saved-jobs/${jobId}`);
        setSaved((prev) => { const s = new Set(prev); s.delete(jobId); return s; });
        toast('Removed from saved');
      } else {
        await API.post(`/saved-jobs/${jobId}`);
        setSaved((prev) => new Set([...prev, jobId]));
        toast.success('Saved!');
      }
    } catch { toast.error('Failed'); }
  };

  if (loading) return <Layout pageTitle="Recommended for you"><Spinner /></Layout>;

  return (
    <Layout pageTitle="Recommended for you" pageSubtitle="Jobs matched to your skills">
      {recs.length === 0 ? (
        <EmptyState
          icon="🎯"
          message="Add your skills in your profile to get personalised job recommendations."
          action={
            <Link to="/profile" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Update skills
            </Link>
          }
        />
      ) : (
        <div className="space-y-3 max-w-3xl">
          <p className="text-xs text-gray-400">{recs.length} jobs matched to your profile</p>
          {recs.map(({ job, matchScore }) => (
            <RecommendedJobCard
              key={job.id}
              job={job}
              matchScore={matchScore}
              applied={appliedIds.has(job.id)}
              saved={savedIds.has(job.id)}
              onApply={handleApply}
              onSave={handleSave}
            />
          ))}
        </div>
      )}
    </Layout>
  );
}

function RecommendedJobCard({ job, matchScore, applied, saved, onApply, onSave }) {
  const matchColor = matchScore >= 80 ? 'bg-green-50 text-green-700 border-green-200'
                   : matchScore >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200'
                   : 'bg-gray-50 text-gray-500 border-gray-200';

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition">
      <div className="flex items-start gap-4">
        {/* Company logo */}
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">
          {job.companyName?.[0]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <Link to={`/jobs/${job.id}`} className="font-semibold text-sm text-gray-900 hover:text-blue-600">
              {job.title}
            </Link>
            <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${matchColor}`}>
              {matchScore}% match
            </span>
          </div>
          <p className="text-xs text-gray-500">{job.companyName} · {job.location}</p>

          {/* Match bar */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-32">
              <div className={`h-full rounded-full ${matchScore >= 80 ? 'bg-green-500' : matchScore >= 50 ? 'bg-amber-400' : 'bg-gray-400'}`}
                style={{ width: `${matchScore}%` }} />
            </div>
            <p className="text-[11px] text-gray-400">skill match</p>
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <StatusBadge status={job.workType} />
            {job.salaryMin && job.salaryMax && (
              <span className="text-xs text-gray-500">₹{job.salaryMin}–{job.salaryMax} LPA</span>
            )}
            {job.experienceRequired && (
              <span className="text-xs text-gray-400">{job.experienceRequired}</span>
            )}
          </div>

          {job.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {job.skills.slice(0, 5).map((s) => (
                <span key={s} className="text-[11px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded">{s}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50 justify-end">
        <button onClick={() => onSave(job.id)}
          className={`px-3 py-1.5 text-xs rounded-lg border transition
            ${saved ? 'bg-amber-50 text-amber-700 border-amber-200' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
          {saved ? '♥ Saved' : '♡ Save'}
        </button>
        <Link to={`/jobs/${job.id}`}
          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
          View details
        </Link>
        <button onClick={() => onApply(job.id)} disabled={applied}
          className={`px-4 py-1.5 text-xs rounded-lg font-medium transition
            ${applied ? 'bg-green-100 text-green-700 cursor-default' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
          {applied ? 'Applied ✓' : 'Apply now'}
        </button>
      </div>
    </div>
  );
}