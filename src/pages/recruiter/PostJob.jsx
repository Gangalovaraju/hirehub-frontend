import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { jobsAPI } from '../../api';
import toast from 'react-hot-toast';

const inputCls =
  'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function PostJob() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', companyName: '', location: '',
    workType: 'HYBRID', salaryMin: '', salaryMax: '',
    experienceRequired: '', skills: [],
  });

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      const skill = skillInput.trim();
      if (!form.skills.includes(skill)) {
        setForm({ ...form, skills: [...form.skills, skill] });
      }
      setSkillInput('');
    }
  };

  const removeSkill = (s) =>
    setForm({ ...form, skills: form.skills.filter((sk) => sk !== s) });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await jobsAPI.post(form);
      toast.success('Job posted successfully!');
      navigate('/recruiter/jobs');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout pageTitle="Post a job" pageSubtitle="Fill in the details below">
      <div className="max-w-2xl">
        <form onSubmit={submit} className="space-y-5">

          {/* Basic info */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
            <p className="text-sm font-medium text-gray-700 border-b border-gray-50 pb-3">
              Job details
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Job title *</label>
                <input className={inputCls} name="title" value={form.title}
                       onChange={handle} placeholder="e.g. Senior Java Developer" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Company name *</label>
                <input className={inputCls} name="companyName" value={form.companyName}
                       onChange={handle} placeholder="e.g. TechCorp India" required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Location *</label>
                <input className={inputCls} name="location" value={form.location}
                       onChange={handle} placeholder="e.g. Hyderabad" required />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Job description *</label>
              <textarea className={inputCls} name="description" value={form.description}
                        onChange={handle} rows={5} required
                        placeholder="Describe the role, responsibilities, and requirements..." />
            </div>
          </div>

          {/* Compensation & type */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
            <p className="text-sm font-medium text-gray-700 border-b border-gray-50 pb-3">
              Compensation & work type
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min salary (LPA)</label>
                <input className={inputCls} name="salaryMin" value={form.salaryMin}
                       onChange={handle} placeholder="e.g. 15" type="number" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max salary (LPA)</label>
                <input className={inputCls} name="salaryMax" value={form.salaryMax}
                       onChange={handle} placeholder="e.g. 25" type="number" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Experience required</label>
                <input className={inputCls} name="experienceRequired" value={form.experienceRequired}
                       onChange={handle} placeholder="e.g. 2–4 years" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-2">Work type</label>
              <div className="flex gap-2">
                {['REMOTE', 'HYBRID', 'ONSITE'].map((wt) => (
                  <button key={wt} type="button"
                    onClick={() => setForm({ ...form, workType: wt })}
                    className={`px-4 py-2 text-xs rounded-lg border transition-colors
                      ${form.workType === wt
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    {wt[0] + wt.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
            <p className="text-sm font-medium text-gray-700 border-b border-gray-50 pb-3">
              Required skills
            </p>
            <div className="flex flex-wrap gap-2 min-h-[36px]">
              {form.skills.map((s) => (
                <span key={s}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-50
                             text-blue-700 rounded-full">
                  {s}
                  <button type="button" onClick={() => removeSkill(s)}
                    className="hover:text-blue-900 ml-1">×</button>
                </span>
              ))}
            </div>
            <input className={inputCls} value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)} onKeyDown={addSkill}
              placeholder="Type a skill and press Enter (e.g. Java, Spring Boot, React)" />
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="px-8 py-2.5 bg-blue-600 text-white text-sm rounded-lg
                         hover:bg-blue-700 disabled:opacity-50 font-medium">
              {loading ? 'Posting…' : 'Post job'}
            </button>
            <button type="button" onClick={() => navigate('/recruiter/jobs')}
              className="px-6 py-2.5 border border-gray-200 text-sm rounded-lg
                         hover:bg-gray-50 text-gray-600">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
