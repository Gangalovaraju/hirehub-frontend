import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { Spinner } from '../../components/UI';
import { appsAPI } from '../../api';
import toast from 'react-hot-toast';

const STAGES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'ROUND2', 'OFFER', 'REJECTED'];

const STAGE_COLORS = {
  APPLIED:   'border-gray-200 bg-gray-50',
  SCREENING: 'border-blue-100 bg-blue-50',
  INTERVIEW: 'border-amber-100 bg-amber-50',
  ROUND2:    'border-purple-100 bg-purple-50',
  OFFER:     'border-green-100 bg-green-50',
  REJECTED:  'border-red-100 bg-red-50',
};

const STAGE_TEXT = {
  APPLIED:   'text-gray-600',
  SCREENING: 'text-blue-700',
  INTERVIEW: 'text-amber-700',
  ROUND2:    'text-purple-700',
  OFFER:     'text-green-700',
  REJECTED:  'text-red-600',
};

export default function Pipeline() {
  const [candidates, setCands] = useState([]);
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    appsAPI.allCandidates()
      .then(({ data }) => setCands(data))
      .catch(() => toast.error('Failed to load pipeline'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = (appId, newStatus) => {
    appsAPI.updateStatus(appId, { status: newStatus })
      .then(() => {
        setCands((prev) =>
          prev.map((c) => (c.id === appId ? { ...c, status: newStatus } : c))
        );
        toast.success(`Moved to ${newStatus}`);
      })
      .catch(() => toast.error('Update failed'));
  };

  const byStage = (stage) => candidates.filter((c) => c.status === stage);

  if (loading) return <Layout pageTitle="Hiring pipeline"><Spinner /></Layout>;

  return (
    <Layout
      pageTitle="Hiring pipeline"
      pageSubtitle={`${candidates.length} candidates · ${byStage('OFFER').length} offers`}
    >
      {/* Conversion bar */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5">
        <p className="text-xs text-gray-400 mb-3 font-medium">Stage conversion</p>
        <div className="flex items-center gap-0">
          {STAGES.filter((s) => s !== 'REJECTED').map((stage, i, arr) => {
            const count = byStage(stage).length;
            return (
              <React.Fragment key={stage}>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-full h-8 rounded-lg flex items-center justify-center
                                   text-xs font-medium ${STAGE_COLORS[stage]} border`}>
                    <span className={STAGE_TEXT[stage]}>{count}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {stage[0] + stage.slice(1).toLowerCase()}
                  </p>
                </div>
                {i < arr.length - 1 && (
                  <div className="text-gray-200 text-xs mx-1 mb-4">›</div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {STAGES.map((stage) => {
          const cards = byStage(stage);
          return (
            <div key={stage} className="flex-shrink-0 w-48">
              <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl
                               border border-b-0 ${STAGE_COLORS[stage]}`}>
                <p className={`text-xs font-medium ${STAGE_TEXT[stage]}`}>
                  {stage[0] + stage.slice(1).toLowerCase()}
                </p>
                <span className={`text-xs px-1.5 py-0.5 rounded-full bg-white
                                  border ${STAGE_TEXT[stage]}`}>
                  {cards.length}
                </span>
              </div>

              <div className={`border border-t-0 rounded-b-xl p-2 space-y-2 min-h-[300px]
                               ${STAGE_COLORS[stage]}`}>
                {cards.map((app) => (
                  <div key={app.id}
                    className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm
                               hover:border-gray-200 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center
                                      justify-center text-purple-700 text-[10px] font-medium
                                      flex-shrink-0">
                        {/* FIX: flat field */}
                        {app.applicantName?.split(' ').map((w) => w[0]).join('') || '?'}
                      </div>
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {app.applicantName}
                      </p>
                    </div>
                    {/* FIX: flat field */}
                    <p className="text-[11px] text-gray-400 truncate mb-2">
                      {app.jobTitle}
                    </p>
                    {app.matchScore && (
                      <p className="text-[10px] text-green-700 bg-green-50 rounded-full
                                    px-2 py-0.5 inline-block mb-2">
                        {app.matchScore}% match
                      </p>
                    )}
                    {stage !== 'OFFER' && stage !== 'REJECTED' && (
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => {
                            const nextIdx = STAGES.indexOf(stage) + 1;
                            if (STAGES[nextIdx] !== 'REJECTED')
                              updateStatus(app.id, STAGES[nextIdx]);
                          }}
                          className="flex-1 text-[10px] py-1 bg-blue-50 text-blue-700
                                     rounded hover:bg-blue-100">
                          Advance →
                        </button>
                        <button
                          onClick={() => updateStatus(app.id, 'REJECTED')}
                          className="px-2 text-[10px] py-1 bg-red-50 text-red-600
                                     rounded hover:bg-red-100">
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {cards.length === 0 && (
                  <p className="text-[11px] text-gray-300 text-center pt-8">Empty</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
