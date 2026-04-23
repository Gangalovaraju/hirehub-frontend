import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Layout from '../../components/Layout';
import { Spinner } from '../../components/UI';
import { profileAPI, uploadAPI, authAPI } from '../../api';
import { updateProfileThunk, clearError } from '../../store/authSlice';
import toast from 'react-hot-toast';

const cls = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';
const PROFICIENCY = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
const TABS = ['Overview', 'Experience', 'Education', 'Skills', 'Resumes', 'Security'];

export default function Profile() {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((s) => s.auth);
  const [tab, setTab] = useState('Overview');
  const [fullProfile, setFullProfile] = useState(null);
  const [fetching, setFetching] = useState(true);
  const fileRef = useRef();

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  useEffect(() => {
    profileAPI.getMyProfile()
      .then(({ data }) => setFullProfile(data))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setFetching(false));
  }, []);

  if (fetching) return <Layout pageTitle="My Profile"><Spinner /></Layout>;

  const refresh = () => {
    profileAPI.getMyProfile().then(({ data }) => setFullProfile(data));
  };

  const initials = user?.fullName?.split(' ').map((w) => w[0]).join('').toUpperCase() || 'U';
  const strength = fullProfile?.profile?.profileStrength || 0;

  return (
    <Layout pageTitle="My Profile" pageSubtitle="Manage your professional presence">
      <div className="max-w-3xl space-y-4">

        {/* Hero card */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-bold overflow-hidden">
                {user?.profilePicture
                  ? <img src={user.profilePicture} alt="avatar" className="w-full h-full object-cover" />
                  : initials}
              </div>
              <button
                onClick={() => fileRef.current.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs hover:bg-blue-700">
                +
              </button>
              <input type="file" ref={fileRef} className="hidden" accept="image/*"
                onChange={async (e) => {
                  const f = e.target.files[0]; if (!f) return;
                  try {
                    await uploadAPI.uploadAvatar(f);
                    toast.success('Photo updated!'); refresh();
                  } catch { toast.error('Upload failed'); }
                }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-semibold">{user?.fullName}</p>
              <p className="text-sm text-gray-500">{fullProfile?.profile?.headline || 'Add your headline'}</p>
              <p className="text-xs text-gray-400 mt-1">📍 {user?.location || '—'} · 📞 {user?.phone || '—'}</p>
              {fullProfile?.profile?.openToWork && (
                <span className="mt-2 inline-block text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full">
                  Open to work
                </span>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-400 mb-1">Profile strength</p>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${strength}%` }} />
                </div>
                <span className="text-xs font-medium text-blue-600">{strength}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-shrink-0 px-3 py-1.5 text-sm rounded-md transition-colors font-medium
                ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'Overview' && <OverviewTab data={fullProfile} user={user} onSave={(d) => dispatch(updateProfileThunk(d)).then(refresh)} loading={loading} />}
        {tab === 'Experience' && <ExperienceTab data={fullProfile?.experiences} onRefresh={refresh} />}
        {tab === 'Education' && <EducationTab data={fullProfile?.educations} onRefresh={refresh} />}
        {tab === 'Skills' && <SkillsTab data={fullProfile?.skills} onRefresh={refresh} />}
        {tab === 'Resumes' && <ResumesTab data={fullProfile?.resumes} user={user} onRefresh={refresh} />}
        {tab === 'Security' && <SecurityTab />}
      </div>
    </Layout>
  );
}

// ── Overview Tab ─────────────────────────────────────────────
function OverviewTab({ data, user, onSave, loading }) {
  const [form, setForm] = useState({
    fullName: user?.fullName || '', email: user?.email || '',
    phone: user?.phone || '', location: user?.location || '',
    headline: data?.profile?.headline || '', bio: data?.profile?.bio || '',
    totalExperience: data?.profile?.totalExperience || '',
    noticePeriod: data?.profile?.noticePeriod || '',
    currentCtc: data?.profile?.currentCtc || '',
    expectedCtc: data?.profile?.expectedCtc || '',
    currentCompany: data?.profile?.currentCompany || '',
    currentTitle: data?.profile?.currentTitle || '',
    githubUrl: data?.profile?.githubUrl || '',
    linkedinUrl: data?.profile?.linkedinUrl || '',
    portfolioUrl: data?.profile?.portfolioUrl || '',
    openToWork: data?.profile?.openToWork ?? true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Split: basic fields go to /auth/profile, extended to /profile
    const basicFields = { fullName: form.fullName, email: form.email, phone: form.phone, location: form.location };
    const extFields = {
      headline: form.headline, bio: form.bio,
      totalExperience: form.totalExperience ? parseFloat(form.totalExperience) : undefined,
      noticePeriod: form.noticePeriod ? parseInt(form.noticePeriod) : undefined,
      currentCtc: form.currentCtc ? parseInt(form.currentCtc) : undefined,
      expectedCtc: form.expectedCtc ? parseInt(form.expectedCtc) : undefined,
      currentCompany: form.currentCompany, currentTitle: form.currentTitle,
      githubUrl: form.githubUrl, linkedinUrl: form.linkedinUrl, portfolioUrl: form.portfolioUrl,
      openToWork: form.openToWork,
    };
    await Promise.all([onSave(basicFields), profileAPI.updateExtended(extFields)]);
    toast.success('Profile saved!');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium text-gray-700">Personal information</p>
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" checked={form.openToWork}
            onChange={(e) => setForm({ ...form, openToWork: e.target.checked })} />
          Open to work
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[['fullName','Full name *'],['email','Email *'],['phone','Phone'],['location','Location'],
          ['headline','Headline'],['currentTitle','Current title'],['currentCompany','Current company']].map(([k, label]) => (
          <div key={k} className={k === 'headline' ? 'col-span-2' : ''}>
            <label className="block text-xs text-gray-500 mb-1">{label}</label>
            <input className={cls} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              placeholder={label} required={label.endsWith('*')} />
          </div>
        ))}
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Bio / Summary</label>
          <textarea className={cls} rows={3} value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="A brief professional summary..." />
        </div>
        {[['totalExperience','Total experience (years)'],['noticePeriod','Notice period (days)'],
          ['currentCtc','Current CTC (INR)'],['expectedCtc','Expected CTC (INR)']].map(([k, label]) => (
          <div key={k}>
            <label className="block text-xs text-gray-500 mb-1">{label}</label>
            <input className={cls} type="number" value={form[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder={label} />
          </div>
        ))}
        {[['githubUrl','GitHub URL'],['linkedinUrl','LinkedIn URL'],['portfolioUrl','Portfolio URL']].map(([k, label]) => (
          <div key={k}>
            <label className="block text-xs text-gray-500 mb-1">{label}</label>
            <input className={cls} type="url" value={form[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder="https://..." />
          </div>
        ))}
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
          {loading ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

// ── Experience Tab ───────────────────────────────────────────
function ExperienceTab({ data, onRefresh }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ company:'', title:'', location:'', startDate:'', endDate:'', isCurrent:false, description:'' });

  const save = async () => {
    if (!form.company || !form.title || !form.startDate) { toast.error('Company, title, and start date required'); return; }
    try {
      await profileAPI.addExperience({ ...form, endDate: form.isCurrent ? null : form.endDate });
      toast.success('Experience added'); setAdding(false);
      setForm({ company:'', title:'', location:'', startDate:'', endDate:'', isCurrent:false, description:'' });
      onRefresh();
    } catch { toast.error('Failed to save'); }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Work experience</p>
        <button onClick={() => setAdding(!adding)}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium">
          {adding ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {adding && (
        <div className="border border-blue-100 rounded-lg p-4 bg-blue-50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[['company','Company *'],['title','Job title *'],['location','Location']].map(([k,l]) => (
              <div key={k} className={k==='title' ? '' : ''}>
                <label className="block text-xs text-gray-500 mb-1">{l}</label>
                <input className={cls} value={form[k]} onChange={(e) => setForm({...form,[k]:e.target.value})} />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Start date *</label>
              <input type="date" className={cls} value={form.startDate} onChange={(e) => setForm({...form,startDate:e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">End date</label>
              <input type="date" className={cls} value={form.endDate} disabled={form.isCurrent}
                onChange={(e) => setForm({...form,endDate:e.target.value})} />
            </div>
            <div className="col-span-2 flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={form.isCurrent} id="isCurrent"
                onChange={(e) => setForm({...form,isCurrent:e.target.checked,endDate:''})} />
              <label htmlFor="isCurrent">Currently working here</label>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Description</label>
              <textarea className={cls} rows={2} value={form.description}
                onChange={(e) => setForm({...form,description:e.target.value})}
                placeholder="Key responsibilities and achievements..." />
            </div>
          </div>
          <button onClick={save} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            Save experience
          </button>
        </div>
      )}

      <div className="space-y-3">
        {(data || []).length === 0 && !adding && (
          <p className="text-sm text-gray-400 text-center py-4">No experience added yet.</p>
        )}
        {(data || []).map((exp) => (
          <div key={exp.id} className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg">
            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 font-bold text-sm flex-shrink-0">
              {exp.company?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{exp.title}</p>
              <p className="text-xs text-gray-500">{exp.company} · {exp.location}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}
              </p>
              {exp.description && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{exp.description}</p>}
            </div>
            <button onClick={async () => { await profileAPI.deleteExperience(exp.id); onRefresh(); }}
              className="text-gray-300 hover:text-red-400 text-lg flex-shrink-0 leading-none">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Education Tab ────────────────────────────────────────────
function EducationTab({ data, onRefresh }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ institution:'', degree:'', field:'', startYear:'', endYear:'', grade:'', description:'' });

  const save = async () => {
    if (!form.institution || !form.degree) { toast.error('Institution and degree required'); return; }
    try {
      await profileAPI.addEducation({ ...form, startYear: form.startYear || null, endYear: form.endYear || null });
      toast.success('Education added'); setAdding(false);
      setForm({ institution:'', degree:'', field:'', startYear:'', endYear:'', grade:'', description:'' });
      onRefresh();
    } catch { toast.error('Failed to save'); }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Education</p>
        <button onClick={() => setAdding(!adding)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
          {adding ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {adding && (
        <div className="border border-blue-100 rounded-lg p-4 bg-blue-50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[['institution','Institution *'],['degree','Degree *'],['field','Field of study'],['grade','Grade / CGPA']].map(([k,l]) => (
              <div key={k}>
                <label className="block text-xs text-gray-500 mb-1">{l}</label>
                <input className={cls} value={form[k]} onChange={(e) => setForm({...form,[k]:e.target.value})} />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Start year</label>
              <input type="number" className={cls} placeholder="2020" value={form.startYear}
                onChange={(e) => setForm({...form,startYear:e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">End year</label>
              <input type="number" className={cls} placeholder="2024" value={form.endYear}
                onChange={(e) => setForm({...form,endYear:e.target.value})} />
            </div>
          </div>
          <button onClick={save} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            Save education
          </button>
        </div>
      )}

      <div className="space-y-3">
        {(data || []).length === 0 && !adding && (
          <p className="text-sm text-gray-400 text-center py-4">No education added yet.</p>
        )}
        {(data || []).map((edu) => (
          <div key={edu.id} className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg">
            <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center text-purple-500 font-bold text-sm flex-shrink-0">🎓</div>
            <div className="flex-1">
              <p className="font-medium text-sm">{edu.degree} {edu.field ? `in ${edu.field}` : ''}</p>
              <p className="text-xs text-gray-500">{edu.institution}</p>
              <p className="text-xs text-gray-400">{edu.startYear} — {edu.endYear || 'Present'} {edu.grade ? `· ${edu.grade}` : ''}</p>
            </div>
            <button onClick={async () => { await profileAPI.deleteEducation(edu.id); onRefresh(); }}
              className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Skills Tab ───────────────────────────────────────────────
function SkillsTab({ data, onRefresh }) {
  const [skills, setSkills] = useState(data || []);
  const [newSkill, setNewSkill] = useState('');
  const [proficiency, setProficiency] = useState('INTERMEDIATE');

  useEffect(() => { setSkills(data || []); }, [data]);

  const addSkill = () => {
    if (!newSkill.trim()) return;
    if (skills.some((s) => s.skill.toLowerCase() === newSkill.toLowerCase())) {
      toast.error('Skill already added'); return;
    }
    setSkills([...skills, { skill: newSkill.trim(), proficiency }]);
    setNewSkill('');
  };

  const save = async () => {
    try {
      await profileAPI.replaceSkills(skills.map((s) => ({ skill: s.skill, proficiency: s.proficiency })));
      toast.success('Skills saved!'); onRefresh();
    } catch { toast.error('Failed to save skills'); }
  };

  const PROF_COLOR = { BEGINNER: 'bg-gray-100 text-gray-600', INTERMEDIATE: 'bg-blue-50 text-blue-700',
    ADVANCED: 'bg-green-50 text-green-700', EXPERT: 'bg-purple-50 text-purple-700' };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
      <p className="text-sm font-medium text-gray-700">Skills</p>
      <div className="flex gap-2">
        <input className={`${cls} flex-1`} value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
          placeholder="Type a skill and press Enter" />
        <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          value={proficiency} onChange={(e) => setProficiency(e.target.value)}>
          {PROFICIENCY.map((p) => <option key={p}>{p}</option>)}
        </select>
        <button onClick={addSkill} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          Add
        </button>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[60px]">
        {skills.length === 0 && <p className="text-sm text-gray-400">No skills added yet.</p>}
        {skills.map((s, i) => (
          <div key={i} className={`flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs font-medium ${PROF_COLOR[s.proficiency] || PROF_COLOR.INTERMEDIATE}`}>
            <span>{s.skill}</span>
            <span className="opacity-50 text-[10px]">{s.proficiency[0]}</span>
            <button onClick={() => setSkills(skills.filter((_, j) => j !== i))}
              className="hover:opacity-70 text-base leading-none ml-0.5">×</button>
          </div>
        ))}
      </div>

      <button onClick={save} className="px-6 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium">
        Save skills
      </button>
    </div>
  );
}

// ── Resumes Tab ──────────────────────────────────────────────
function ResumesTab({ data, user, onRefresh }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleUpload = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    if (!f.name.endsWith('.pdf')) { toast.error('Only PDF files allowed'); return; }
    setUploading(true);
    try {
      await uploadAPI.uploadResume(f, f.name.replace('.pdf', ''));
      toast.success('Resume uploaded!'); onRefresh();
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Resumes</p>
        <button onClick={() => fileRef.current.click()} disabled={uploading}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50">
          {uploading ? 'Uploading…' : '+ Upload PDF'}
        </button>
        <input type="file" ref={fileRef} className="hidden" accept=".pdf" onChange={handleUpload} />
      </div>

      <div className="space-y-2">
        {(data || []).length === 0 && (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
            <p className="text-4xl mb-2">📄</p>
            <p className="text-sm text-gray-500">No resumes uploaded yet</p>
            <p className="text-xs text-gray-400 mt-1">Upload a PDF resume to apply to jobs faster</p>
          </div>
        )}
        {(data || []).map((r) => (
          <div key={r.id} className={`flex items-center gap-3 p-3 rounded-lg border ${r.isPrimary ? 'border-blue-200 bg-blue-50' : 'border-gray-100'}`}>
            <div className="text-2xl">📄</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{r.name}</p>
              <p className="text-xs text-gray-400">
                {r.fileSize ? `${(r.fileSize / 1024).toFixed(0)} KB · ` : ''}
                {new Date(r.uploadedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {r.isPrimary
                ? <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Primary</span>
                : <button onClick={async () => { await profileAPI.setPrimaryResume(r.id); onRefresh(); }}
                    className="text-xs text-blue-600 hover:underline">Set primary</button>}
              <a href={r.url} target="_blank" rel="noreferrer"
                className="text-xs text-gray-500 hover:text-gray-700">View</a>
              <button onClick={async () => { await profileAPI.deleteResume(r.id); onRefresh(); }}
                className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Security Tab ─────────────────────────────────────────────
function SecurityTab() {
  const [form, setForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password changed!');
      setForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <p className="text-sm font-medium text-gray-700 mb-4">Change password</p>
      <form onSubmit={submit} className="space-y-3 max-w-sm">
        {[['currentPassword','Current password'],['newPassword','New password'],['confirmPassword','Confirm new password']].map(([k,l]) => (
          <div key={k}>
            <label className="block text-xs text-gray-500 mb-1">{l}</label>
            <input type="password" className={cls} value={form[k]}
              onChange={(e) => setForm({...form,[k]:e.target.value})} required minLength={k !== 'currentPassword' ? 6 : 1} />
          </div>
        ))}
        <button type="submit" disabled={loading}
          className="mt-2 px-6 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
          {loading ? 'Updating…' : 'Change password'}
        </button>
      </form>
    </div>
  );
}