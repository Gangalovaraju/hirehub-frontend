import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Spinner, EmptyState } from '../../components/UI';
import API from '../../api';
import toast from 'react-hot-toast';

const PROFICIENCY_COLOR = {
  BEGINNER: 'bg-gray-100 text-gray-500',
  INTERMEDIATE: 'bg-blue-50 text-blue-600',
  ADVANCED: 'bg-green-50 text-green-700',
  EXPERT: 'bg-purple-50 text-purple-700',
};

export default function CandidateSearch() {
  const navigate = useNavigate();
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [filters, setFilters]   = useState({ skill: '', location: '', minExp: '', maxExp: '' });
  const [selected, setSelected] = useState(null);  // profile being viewed in modal

  const search = useCallback(async () => {
    if (!filters.skill.trim() && !filters.location.trim()) {
      toast.error('Enter at least a skill or location'); return;
    }
    setLoading(true);
    setSearched(true);
    try {
      // Search users by skill/location — recruiter endpoint
      const { data } = await API.get('/recruiter/candidates/search', {
        params: {
          skill:    filters.skill    || undefined,
          location: filters.location || undefined,
          minExp:   filters.minExp   || undefined,
          maxExp:   filters.maxExp   || undefined,
        },
      });
      setResults(data);
    } catch { toast.error('Search failed'); }
    finally { setLoading(false); }
  }, [filters]);

  const viewProfile = async (userId) => {
    try {
      const { data } = await API.get(`/profile/${userId}`);
      setSelected(data);
    } catch { toast.error('Could not load profile'); }
  };

  const messageCandidate = (userId, name) => {
    navigate(`/messages/${userId}`);
  };

  return (
    <Layout pageTitle="Candidate search" pageSubtitle="Find talent by skills and location">

      {/* Search filters */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5">
        <div className="flex gap-3 flex-wrap">
          <input
            className="flex-1 min-w-36 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Skill (e.g. React, Python, AWS)"
            value={filters.skill}
            onChange={(e) => setFilters({ ...filters, skill: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && search()}
          />
          <input
            className="w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Location"
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          />
          <input
            type="number"
            className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Min exp (yr)"
            value={filters.minExp}
            onChange={(e) => setFilters({ ...filters, minExp: e.target.value })}
          />
          <input
            type="number"
            className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Max exp (yr)"
            value={filters.maxExp}
            onChange={(e) => setFilters({ ...filters, maxExp: e.target.value })}
          />
          <button onClick={search} disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </div>

      {/* Results */}
      {loading && <Spinner />}
      {!loading && searched && results.length === 0 && (
        <EmptyState icon="🔍" message="No candidates found. Try broader search terms." />
      )}
      {!loading && !searched && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🧑‍💻</p>
          <p className="text-sm text-gray-400">Search by skill, location, or experience to find candidates</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">{results.length} candidates found</p>
          {results.map((candidate) => (
            <CandidateCard
              key={candidate.userId}
              candidate={candidate}
              onView={() => viewProfile(candidate.userId)}
              onMessage={() => messageCandidate(candidate.userId, candidate.fullName)}
            />
          ))}
        </div>
      )}

      {/* Profile modal */}
      {selected && (
        <ProfileModal
          data={selected}
          onClose={() => setSelected(null)}
          onMessage={() => { messageCandidate(selected.userId, selected.fullName); setSelected(null); }}
        />
      )}
    </Layout>
  );
}

function CandidateCard({ candidate, onView, onMessage }) {
  const profile  = candidate.profile || {};
  const skills   = (candidate.skills || []).slice(0, 5);
  const initials = candidate.fullName?.split(' ').map((w) => w[0]).join('') || '?';

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold flex-shrink-0 overflow-hidden">
          {candidate.profilePicture
            ? <img src={candidate.profilePicture} alt="" className="w-full h-full object-cover" />
            : initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm text-gray-900">{candidate.fullName}</p>
              <p className="text-xs text-gray-500">{profile.headline || profile.currentTitle || 'No headline'}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                {candidate.location && <span>📍 {candidate.location}</span>}
                {profile.totalExperience && <span>🏆 {profile.totalExperience} yrs exp</span>}
                {profile.noticePeriod !== null && <span>⏱ {profile.noticePeriod}d notice</span>}
                {profile.openToWork && (
                  <span className="text-green-600 font-medium">• Open to work</span>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={onView}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                View profile
              </button>
              <button onClick={onMessage}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Message
              </button>
            </div>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {skills.map((s) => (
                <span key={s.id || s.skill}
                  className={`text-xs px-2 py-0.5 rounded-full ${PROFICIENCY_COLOR[s.proficiency] || 'bg-gray-100 text-gray-500'}`}>
                  {s.skill}
                </span>
              ))}
              {candidate.skills?.length > 5 && (
                <span className="text-xs text-gray-400">+{candidate.skills.length - 5} more</span>
              )}
            </div>
          )}
          {profile.expectedCtc && (
            <p className="text-xs text-gray-400 mt-1.5">Expected: ₹{(profile.expectedCtc / 100000).toFixed(1)}L CTC</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileModal({ data, onClose, onMessage }) {
  const profile    = data.profile || {};
  const initials   = data.fullName?.split(' ').map((w) => w[0]).join('') || '?';
  const primaryRes = data.resumes?.find((r) => r.isPrimary) || data.resumes?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <p className="font-semibold text-gray-900">Candidate profile</p>
          <div className="flex gap-2">
            {primaryRes && (
              <a href={primaryRes.url} target="_blank" rel="noreferrer"
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                Download resume
              </a>
            )}
            <button onClick={onMessage}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Send message
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-2">×</button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Identity */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xl font-bold overflow-hidden">
              {data.profilePicture
                ? <img src={data.profilePicture} alt="" className="w-full h-full object-cover" />
                : initials}
            </div>
            <div>
              <p className="text-xl font-semibold">{data.fullName}</p>
              <p className="text-sm text-gray-500">{profile.headline}</p>
              <div className="flex gap-3 text-xs text-gray-400 mt-1">
                {data.location && <span>📍 {data.location}</span>}
                {data.email && <span>✉️ {data.email}</span>}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              ['Experience', profile.totalExperience ? `${profile.totalExperience} yrs` : '—'],
              ['Notice period', profile.noticePeriod ? `${profile.noticePeriod} days` : '—'],
              ['Current CTC', profile.currentCtc ? `₹${(profile.currentCtc/100000).toFixed(1)}L` : '—'],
              ['Expected CTC', profile.expectedCtc ? `₹${(profile.expectedCtc/100000).toFixed(1)}L` : '—'],
            ].map(([label, val]) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{val}</p>
              </div>
            ))}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Summary</p>
              <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Skills */}
          {data.skills?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((s) => (
                  <span key={s.id || s.skill}
                    className={`text-xs px-2.5 py-1 rounded-full ${PROFICIENCY_COLOR[s.proficiency] || 'bg-gray-100 text-gray-500'}`}>
                    {s.skill}
                    <span className="opacity-50 ml-1 text-[10px]">{s.proficiency?.[0]}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {data.experiences?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Work experience</p>
              <div className="space-y-2">
                {data.experiences.map((exp) => (
                  <div key={exp.id} className="flex gap-3 p-3 border border-gray-100 rounded-lg">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                      {exp.company?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{exp.title}</p>
                      <p className="text-xs text-gray-500">{exp.company} · {exp.location}</p>
                      <p className="text-xs text-gray-400">{exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {data.educations?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Education</p>
              {data.educations.map((edu) => (
                <div key={edu.id} className="flex gap-3 p-3 border border-gray-100 rounded-lg">
                  <span className="text-xl">🎓</span>
                  <div>
                    <p className="text-sm font-medium">{edu.degree} {edu.field ? `in ${edu.field}` : ''}</p>
                    <p className="text-xs text-gray-500">{edu.institution}</p>
                    <p className="text-xs text-gray-400">{edu.startYear} — {edu.endYear || 'Present'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Links */}
          {(profile.githubUrl || profile.linkedinUrl || profile.portfolioUrl) && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Links</p>
              <div className="flex gap-3">
                {profile.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">GitHub</a>}
                {profile.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">LinkedIn</a>}
                {profile.portfolioUrl && <a href={profile.portfolioUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Portfolio</a>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}