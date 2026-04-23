import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { KpiCard, StatusBadge, BarChart, Card, Spinner } from '../../components/UI';
import { appsAPI, recommendAPI, profileAPI } from '../../api';
import toast from 'react-hot-toast';

export default function SeekerDashboard() {
  const { user } = useSelector((s) => s.auth);
  const [recs, setRecs]           = useState([]);
  const [applications, setApps]   = useState([]);
  const [skillData, setSkillData] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      // FIX: use real recommendations (skill-matched) instead of random jobs
      recommendAPI.get(4),
      appsAPI.myApplications(true),
      // FIX: load real profile skills instead of hardcoded data
      profileAPI.getMyProfile(),
    ])
      .then(([recRes, appsRes, profileRes]) => {
        setRecs(recRes.data || []);
        setApps(appsRes.data || []);

        // Build skill chart from user's actual skills + proficiency level
        const PROF_SCORE = { EXPERT: 95, ADVANCED: 80, INTERMEDIATE: 65, BEGINNER: 45 };
        const skills = (profileRes.data?.skills || [])
          .slice(0, 6)
          .map((s) => ({ label: s.skill, value: PROF_SCORE[s.proficiency] || 60 }));
        setSkillData(skills);
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout pageTitle="Dashboard"><Spinner /></Layout>;

  const statusCounts = {
    APPLIED:   applications.filter((a) => a.status === 'APPLIED').length,
    INTERVIEW: applications.filter((a) => a.status === 'INTERVIEW').length,
    OFFER:     applications.filter((a) => a.status === 'OFFER').length,
  };

  return (
    <Layout
      pageTitle="Dashboard"
      pageSubtitle={`Welcome back, ${user?.fullName?.split(' ')[0]}!`}
      topAction={
        <Link to="/profile"
          className="px-4 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Update Profile
        </Link>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <KpiCard label="Applications sent" value={applications.length} delta="this month" deltaUp />
        <KpiCard label="In review"   value={statusCounts.APPLIED}   />
        <KpiCard label="Interviews"  value={statusCounts.INTERVIEW} delta="scheduled" deltaUp />
        <KpiCard label="Offers"      value={statusCounts.OFFER}     delta="received"  deltaUp />
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        {/* FIX: Recommended jobs — now uses real skill-matched recs */}
        <Card title="Recommended for you"
          className="col-span-3"
          action={<Link to="/seeker/recommendations" className="text-xs text-blue-600">See all →</Link>}>
          <div className="divide-y divide-gray-50">
            {recs.length === 0 && (
              <p className="text-sm text-gray-400 py-4">
                Add skills to your profile to see recommendations.
              </p>
            )}
            {recs.map(({ job, matchScore }) => (
              <div key={job.id} className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center
                                text-blue-700 text-xs font-medium flex-shrink-0">
                  {job.companyName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{job.title}</p>
                  <p className="text-xs text-gray-400">{job.companyName} · {job.location}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {matchScore && (
                    <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                      {matchScore}%
                    </span>
                  )}
                  <StatusBadge status={job.workType} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Application tracker */}
        <Card title="Application tracker"
          className="col-span-2"
          action={<Link to="/seeker/applications" className="text-xs text-blue-600">View all →</Link>}>
          <div className="space-y-2">
            {applications.slice(0, 5).map((app) => (
              <div key={app.id} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center
                                text-purple-700 text-[10px] font-medium flex-shrink-0">
                  {app.jobCompanyName?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{app.jobCompanyName}</p>
                  <p className="text-[10px] text-gray-400 truncate">{app.jobTitle}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>
            ))}
            {applications.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">No applications yet</p>
            )}
          </div>
        </Card>
      </div>

      {/* FIX: Real skill chart from user profile — fallback message if no skills added */}
      <Card title="Your skill profile">
        {skillData.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-400">No skills added yet.</p>
            <Link to="/profile" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
              Add skills to your profile →
            </Link>
          </div>
        ) : (
          <BarChart data={skillData} color="#3B82F6" />
        )}
      </Card>
    </Layout>
  );
}