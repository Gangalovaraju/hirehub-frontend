import React from 'react';

// ── KPI Card ──────────────────────────────────────────
export function KpiCard({ label, value, delta, deltaUp, icon, color = 'blue' }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   val: 'text-blue-700' },
    green:  { bg: 'bg-green-50',  text: 'text-green-600',  val: 'text-green-700' },
    amber:  { bg: 'bg-amber-50',  text: 'text-amber-600',  val: 'text-amber-700' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', val: 'text-purple-700' },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-gray-400">{label}</p>
        {icon && <span className={`text-base ${c.text}`}>{icon}</span>}
      </div>
      <p className={`text-2xl font-bold ${c.val}`}>{value}</p>
      {delta && (
        <p className={`text-xs mt-1 ${deltaUp ? 'text-green-600' : 'text-red-500'}`}>
          {deltaUp ? '↑' : '↓'} {delta}
        </p>
      )}
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────
const STATUS_STYLES = {
  APPLIED:   'bg-gray-100 text-gray-600',
  SCREENING: 'bg-blue-50 text-blue-700',
  INTERVIEW: 'bg-amber-50 text-amber-700',
  ROUND2:    'bg-purple-50 text-purple-700',
  OFFER:     'bg-green-50 text-green-700',
  REJECTED:  'bg-red-50 text-red-600',
  ACTIVE:    'bg-green-50 text-green-700',
  CLOSED:    'bg-gray-100 text-gray-500',
  DRAFT:     'bg-yellow-50 text-yellow-700',
  REMOTE:    'bg-teal-50 text-teal-700',
  HYBRID:    'bg-amber-50 text-amber-700',
  ONSITE:    'bg-blue-50 text-blue-700',
  SEEKER:    'bg-blue-50 text-blue-700',
  RECRUITER: 'bg-purple-50 text-purple-700',
  ADMIN:     'bg-red-50 text-red-600',
};

export function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium ${cls}`}>
      {status}
    </span>
  );
}

// ── Job Card (improved) ───────────────────────────────
const COMPANY_COLORS = [
  'bg-blue-50 text-blue-700', 'bg-green-50 text-green-700',
  'bg-purple-50 text-purple-700', 'bg-orange-50 text-orange-700',
  'bg-teal-50 text-teal-700', 'bg-pink-50 text-pink-700',
];
function companyColor(name) {
  return COMPANY_COLORS[(name?.charCodeAt(0) || 0) % COMPANY_COLORS.length];
}

export function JobCard({ job, onApply, onSave, applied, saved, saveLabel }) {
  const cc = companyColor(job.companyName);
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:border-blue-100 hover:shadow-sm transition-all flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${cc}`}>
          {job.companyName?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{job.companyName}</p>
        </div>
        <StatusBadge status={job.workType} />
      </div>

      {/* Location + date */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <span>📍</span>
        <span className="truncate">{job.location || 'Location not specified'}</span>
        {job.postedAt && (
          <span className="ml-auto flex-shrink-0">
            {new Date(job.postedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>

      {/* Skills */}
      {job.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {job.skills.slice(0, 3).map((s) => (
            <span key={s} className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">{s}</span>
          ))}
          {job.skills.length > 3 && (
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">+{job.skills.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        <div>
          {(job.salaryMin || job.salaryMax) ? (
            <p className="text-sm font-semibold text-gray-900">₹{job.salaryMin}–{job.salaryMax} LPA</p>
          ) : (
            <p className="text-xs text-gray-400 italic">Salary not disclosed</p>
          )}
          {job.experienceRequired && <p className="text-xs text-gray-400">🧑‍💻 {job.experienceRequired}</p>}
        </div>
        <div className="flex gap-2">
          {onSave && (
            <button onClick={() => onSave(job.id)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors flex items-center gap-1
                ${saved
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
              {saved ? '♥' : '♡'} {saveLabel || (saved ? 'Saved' : 'Save')}
            </button>
          )}
          {onApply && (
            <button onClick={() => onApply(job.id)} disabled={applied}
              className={`px-4 py-1.5 text-xs rounded-lg font-semibold transition-colors
                ${applied ? 'bg-green-100 text-green-700 cursor-default' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
              {applied ? '✓ Applied' : 'Apply Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Horizontal Bar Chart ──────────────────────────────
export function BarChart({ data, color = '#3B82F6' }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <p className="text-xs text-gray-400 w-28 text-right flex-shrink-0">{d.label}</p>
          <div className="flex-1 h-2.5 bg-gray-50 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
                 style={{ width: `${Math.round((d.value / max) * 100)}%`, background: color }} />
          </div>
          <p className="text-xs text-gray-500 w-8 flex-shrink-0 font-medium">{d.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────
export function EmptyState({ icon = '◈', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4 opacity-20">{icon}</div>
      <p className="text-sm text-gray-400 mb-4">{message}</p>
      {action}
    </div>
  );
}

// ── Loading Spinner ───────────────────────────────────
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
}

// ── Section Card ──────────────────────────────────────
export function Card({ title, action, children, className = '' }) {
  return (
    <div className={`bg-white border border-gray-100 rounded-xl p-4 ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-800">{title}</p>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Page Header ───────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── Stats Row (inline 3-4 numbers) ───────────────────
export function StatsRow({ stats }) {
  // stats = [{ label, value, color? }]
  return (
    <div className="flex gap-4 bg-white border border-gray-100 rounded-xl p-4 mb-5">
      {stats.map(({ label, value, color = 'text-gray-900' }, i) => (
        <React.Fragment key={label}>
          {i > 0 && <div className="w-px bg-gray-100" />}
          <div className="flex-1 text-center">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}