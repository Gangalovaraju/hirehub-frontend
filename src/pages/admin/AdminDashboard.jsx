import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { KpiCard, BarChart, Card, Spinner } from '../../components/UI';
import { adminAPI, appsAPI } from '../../api';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats]       = useState(null);
  const [appStats, setAppStats] = useState(null);
  const [growth, setGrowth]     = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      adminAPI.stats(),
      appsAPI.adminStats(),
      // FIX: fetch real user growth data instead of hardcoded weeks
      adminAPI.userGrowth().catch(() => ({ data: [] })),
      // FIX: fetch recent registrations to replace fake flags panel
      adminAPI.allUsers().catch(() => ({ data: [] })),
    ])
      .then(([sRes, aRes, growthRes, usersRes]) => {
        setStats(sRes.data);
        setAppStats(aRes.data);

        // Build growth chart — backend returns [{ week, count }]
        // Fallback: derive from users createdAt if growth endpoint not ready
        const growthData = growthRes.data || [];
        if (growthData.length > 0) {
          setGrowth(growthData.map((g) => ({
            label: g.week || g.label,
            value: g.count || g.value || 0,
          })));
        } else {
          // Fallback: count users registered per week from allUsers
          const users = usersRes.data || [];
          const weekMap = {};
          users.forEach((u) => {
            if (!u.createdAt) return;
            const d = new Date(u.createdAt);
            const weekKey = `W${getWeekNumber(d)}`;
            weekMap[weekKey] = (weekMap[weekKey] || 0) + 1;
          });
          const weeks = Object.entries(weekMap)
            .slice(-5)
            .map(([label, value]) => ({ label, value }));
          setGrowth(weeks.length > 0 ? weeks : []);
        }

        // Recent 5 registrations for the activity panel
        const sorted = [...(usersRes.data || [])]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        setRecentUsers(sorted);
      })
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout pageTitle="Platform overview"><Spinner /></Layout>;

  // ISO week number helper
  function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  const now = new Date();
  const subtitle = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const timeAgo = (ts) => {
    if (!ts) return '—';
    const secs = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (secs < 60) return 'just now';
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  };

  const roleColor = {
    SEEKER:    'bg-blue-50 text-blue-700',
    RECRUITER: 'bg-purple-50 text-purple-700',
    ADMIN:     'bg-red-50 text-red-600',
  };

  return (
    <Layout
      pageTitle="Platform overview"
      pageSubtitle={`HireHub admin · ${subtitle}`}
      topAction={
        <button
          onClick={() => window.print()}
          className="px-4 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
          Export report
        </button>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <KpiCard label="Total users"
          value={stats?.totalUsers?.toLocaleString() || '—'}
          delta={`${stats?.totalSeekers || 0} seekers`} deltaUp />
        <KpiCard label="Active jobs"
          value={stats?.activeJobs?.toLocaleString() || '—'}
          delta="live right now" deltaUp />
        <KpiCard label="Total applications"
          value={stats?.totalApplications?.toLocaleString() || '—'}
          delta="all time" deltaUp />
        <KpiCard label="Recruiters"
          value={stats?.totalRecruiters?.toLocaleString() || '—'} />
        <KpiCard label="Offers made"
          value={appStats?.offers?.toLocaleString() || '—'}
          delta="all time" deltaUp />
        <KpiCard label="Total jobs posted"
          value={stats?.totalJobs?.toLocaleString() || '—'} />
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">

        {/* FIX: Real recent registrations — replaces fake FLAGS panel */}
        <Card
          title="Recent registrations"
          className="col-span-3"
          action={
            <a href="/admin/users" className="text-xs text-blue-600">View all users →</a>
          }>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No users yet</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 py-2.5">
                  <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center
                                  text-blue-700 text-xs font-medium flex-shrink-0">
                    {u.fullName?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{u.fullName}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0
                    ${roleColor[u.role] || 'bg-gray-100 text-gray-500'}`}>
                    {u.role}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {timeAgo(u.createdAt)}
                  </span>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0
                    ${u.active ? 'bg-green-400' : 'bg-gray-300'}`} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* FIX: Real user growth chart — from API, with fallback derivation */}
        <Card title="User growth (weekly)" className="col-span-2">
          {growth.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">
              Not enough data yet
            </p>
          ) : (
            <BarChart data={growth} color="#10B981" />
          )}
        </Card>
      </div>

      {/* Application funnel — real data from appStats */}
      <Card title="Application funnel">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Applied',   value: appStats?.totalApplications || 0, color: 'bg-blue-50 text-blue-700' },
            { label: 'Interview', value: appStats?.interviews || 0,         color: 'bg-amber-50 text-amber-700' },
            { label: 'Offer',     value: appStats?.offers || 0,             color: 'bg-green-50 text-green-700' },
            { label: 'Rejected',  value: appStats?.rejected || 0,           color: 'bg-red-50 text-red-600' },
          ].map((f) => (
            <div key={f.label} className={`rounded-xl p-4 text-center ${f.color}`}>
              <p className="text-2xl font-semibold">{f.value.toLocaleString()}</p>
              <p className="text-xs mt-1 opacity-75">{f.label}</p>
            </div>
          ))}
        </div>
      </Card>
    </Layout>
  );
}