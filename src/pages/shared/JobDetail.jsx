import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Layout from '../../components/Layout';
import { StatusBadge, Spinner } from '../../components/UI';
import { jobsAPI, appsAPI, companyAPI } from '../../api';
import API from '../../api';
import toast from 'react-hot-toast';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const isSeeker = user?.role === 'SEEKER';

  const [job, setJob]             = useState(null);
  const [company, setCompany]     = useState(null);
  const [similar, setSimilar]     = useState([]);
  const [applied, setApplied]     = useState(false);
  const [saved, setSaved]         = useState(false);
  const [matchScore, setMatch]    = useState(null);
  const [loading, setLoading]     = useState(true);
  const [applying, setApplying]   = useState(false);
  const [coverLetter, setCover]   = useState('');
  const [showApply, setShowApply] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await jobsAPI.getById(id);
      setJob(data);

      // Load company if linked
      if (data.companyId) {
        companyAPI.getById(data.companyId)
          .then(({ data: c }) => setCompany(c))
          .catch(() => {});
      }

      // Load similar jobs by keyword
      jobsAPI.search({ keyword: data.title.split(' ')[0], size: 4 })
        .then(({ data: s }) => setSimilar((s.content || []).filter((j) => j.id !== data.id).slice(0, 3)))
        .catch(() => {});

      if (isSeeker) {
        // Check if already applied / saved
        appsAPI.myApplications(true)
          .then(({ data: apps }) => setApplied(apps.some((a) => a.jobId === data.id)))
          .catch(() => {});

        API.get('/saved-jobs', { _silent: true })
          .then(({ data: saved }) => setSaved(saved.some((s) => s.job?.id === data.id)))
          .catch(() => {});

        // Match score
        API.get(`/recommendations/match-score/${id}`, { _silent: true })
          .then(({ data: m }) => setMatch(m.score))
          .catch(() => {});
      }
    } catch {
      toast.error('Job not found');
      navigate('/seeker/jobs');
    } finally {
      setLoading(false);
    }
  }, [id, isSeeker, navigate]);

  useEffect(() => { load(); }, [load]);

  const handleApply = async () => {
    setApplying(true);
    try {
      await appsAPI.apply({ jobId: job.id, coverLetter });
      setApplied(true);
      setShowApply(false);
      toast.success('Application submitted!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Apply failed');
    } finally {
      setApplying(false);
    }
  };

  const handleSave = async () => {
    try {
      if (saved) {
        await API.delete(`/saved-jobs/${job.id}`);
        setSaved(false);
        toast('Removed from saved');
      } else {
        await API.post(`/saved-jobs/${job.id}`);
        setSaved(true);
        toast.success('Job saved!');
      }
    } catch { toast.error('Failed'); }
  };

  if (loading) return <Layout pageTitle="Job Details"><Spinner /></Layout>;
  if (!job) return null;

  const postedDaysAgo = Math.floor((Date.now() - new Date(job.postedAt)) / 86400000);

  return (
    <Layout pageTitle={job.title} pageSubtitle={`${job.companyName} · ${job.location}`}>
      <div className="grid grid-cols-3 gap-5 max-w-5xl">

        {/* ── Main column ── */}
        <div className="col-span-2 space-y-4">

          {/* Job header card */}
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 text-xl font-bold flex-shrink-0">
                  {company?.logo
                    ? <img src={company.logo} alt={job.companyName} className="w-14 h-14 rounded-xl object-contain" />
                    : job.companyName?.[0]}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{job.title}</h1>
                  <p className="text-sm text-gray-500">{job.companyName} · {job.location}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <StatusBadge status={job.workType} />
                    <StatusBadge status={job.status} />
                    {matchScore !== null && matchScore > 0 && (
                      <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                        {matchScore}% match
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-400">
                  Posted {postedDaysAgo === 0 ? 'today' : `${postedDaysAgo}d ago`}
                </p>
                <p className="text-xs text-gray-400">{job.viewCount} views · {job.applicationCount} applicants</p>
              </div>
            </div>

            {/* Meta pills */}
            <div className="flex flex-wrap gap-3 text-sm py-4 border-y border-gray-50">
              {job.salaryMin && job.salaryMax && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <span className="text-gray-400">💰</span>
                  <span>₹{job.salaryMin} – ₹{job.salaryMax} LPA</span>
                </div>
              )}
              {job.experienceRequired && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <span className="text-gray-400">🏆</span>
                  <span>{job.experienceRequired}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-gray-600">
                <span className="text-gray-400">📍</span>
                <span>{job.location}</span>
              </div>
            </div>

            {/* CTA buttons */}
            {isSeeker && (
              <div className="flex gap-3 mt-4">
                {!applied ? (
                  <button onClick={() => setShowApply(true)}
                    className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                    Apply Now
                  </button>
                ) : (
                  <div className="flex-1 py-2.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg text-center border border-green-200">
                    Applied ✓
                  </div>
                )}
                <button onClick={handleSave}
                  className={`px-5 py-2.5 text-sm rounded-lg border transition ${
                    saved ? 'bg-amber-50 text-amber-700 border-amber-200' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {saved ? '♥ Saved' : '♡ Save'}
                </button>
              </div>
            )}

            {/* Apply form */}
            {showApply && (
              <div className="mt-4 border border-blue-100 rounded-lg p-4 bg-blue-50 space-y-3">
                <p className="text-sm font-medium text-gray-700">Cover letter <span className="text-gray-400 font-normal">(optional)</span></p>
                <textarea
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                  rows={4}
                  placeholder="Introduce yourself and why you're a great fit for this role..."
                  value={coverLetter}
                  onChange={(e) => setCover(e.target.value)}
                />
                <div className="flex gap-2">
                  <button onClick={handleApply} disabled={applying}
                    className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                    {applying ? 'Submitting…' : 'Submit application'}
                  </button>
                  <button onClick={() => setShowApply(false)}
                    className="px-4 py-2 border border-gray-200 text-sm rounded-lg text-gray-600 hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Job description */}
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Job description</h2>
            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {job.description}
            </div>
          </div>

          {/* Skills required */}
          {job.skills?.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Skills required</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((s) => (
                  <span key={s} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-100">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Side column ── */}
        <div className="space-y-4">

          {/* Company card */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">About the company</h2>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-sm">
                {job.companyName?.[0]}
              </div>
              <div>
                <p className="font-medium text-sm">{job.companyName}</p>
                {company?.industry && <p className="text-xs text-gray-400">{company.industry}</p>}
              </div>
            </div>
            {company?.about && (
              <p className="text-xs text-gray-500 line-clamp-4 mb-3">{company.about}</p>
            )}
            <div className="space-y-1.5 text-xs text-gray-500">
              {company?.size && <p>👥 {company.size} employees</p>}
              {company?.headquarters && <p>📍 {company.headquarters}</p>}
              {company?.foundedYear && <p>📅 Founded {company.foundedYear}</p>}
              {company?.website && (
                <a href={company.website} target="_blank" rel="noreferrer"
                  className="block text-blue-600 hover:underline">🌐 Visit website</a>
              )}
            </div>
          </div>

          {/* Job summary */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Job overview</h2>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span className="text-gray-400">Posted by</span>
                <span>{job.postedByName}</span>
              </div>
              {job.expiresAt && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Expires</span>
                  <span>{new Date(job.expiresAt).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Work type</span>
                <span>{job.workType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Views</span>
                <span>{job.viewCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Applicants</span>
                <span>{job.applicationCount}</span>
              </div>
            </div>
          </div>

          {/* Similar jobs */}
          {similar.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Similar jobs</h2>
              <div className="space-y-3">
                {similar.map((j) => (
                  <Link key={j.id} to={`/jobs/${j.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                      {j.companyName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{j.title}</p>
                      <p className="text-[11px] text-gray-400">{j.companyName}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}