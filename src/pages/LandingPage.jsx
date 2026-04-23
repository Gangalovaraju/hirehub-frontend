import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { jobsAPI } from '../api';

const CATEGORIES = [
  { icon: '💻', label: 'Engineering', count: '2.4k' },
  { icon: '📊', label: 'Data & AI', count: '1.1k' },
  { icon: '🎨', label: 'Design', count: '830' },
  { icon: '📣', label: 'Marketing', count: '640' },
  { icon: '💼', label: 'Sales', count: '910' },
  { icon: '🏦', label: 'Finance', count: '520' },
  { icon: '🩺', label: 'Healthcare', count: '380' },
  { icon: '⚖️', label: 'Legal', count: '210' },
];

const COMPANIES = ['Google', 'Infosys', 'TCS', 'Wipro', 'Razorpay', 'Swiggy', 'Zepto', 'CRED'];

const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'SDE-2 at Flipkart', text: 'Got 3 interview calls in a week. The match score feature showed me exactly which jobs suit my skillset.' },
  { name: 'Arjun Mehta', role: 'Data Engineer at Razorpay', text: 'Way cleaner than Naukri. The recruiter responded within a day — zero spam.' },
  { name: 'Sneha Reddy', role: 'Product Designer at CRED', text: 'Uploaded my resume, added my skills, and landed my dream job in 3 weeks. That simple.' },
];

export default function LandingPage() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [totalJobs, setTotalJobs] = useState('10,000+');

  useEffect(() => {
    if (user) {
      navigate(user.role === 'RECRUITER' ? '/recruiter/dashboard' :
               user.role === 'ADMIN' ? '/admin/dashboard' : '/seeker/dashboard');
      return;
    }
    jobsAPI.search({ size: 1 })
      .then(({ data }) => {
        if (data.totalElements) setTotalJobs(data.totalElements.toLocaleString('en-IN') + '+');
      })
      .catch(() => {});
  }, [user, navigate]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/login?redirect=/seeker/jobs&keyword=${keyword}&location=${location}`);
  };

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">H</div>
            <span className="font-semibold text-gray-900">HireHub</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-500">
            <a href="#jobs" className="hover:text-gray-800">Browse jobs</a>
            <a href="#companies" className="hover:text-gray-800">Companies</a>
            <a href="#how" className="hover:text-gray-800">How it works</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login" className="px-4 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Log in
            </Link>
            <Link to="/register" className="px-4 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              Sign up free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
            {totalJobs} active jobs across India
          </div>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-4">
            Find work that<br />
            <span className="text-blue-600">actually fits you</span>
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
            HireHub matches your skills to the right jobs — not just keywords.
            No spam. No fake listings. Just your next opportunity.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl p-2 shadow-sm">
            <input
              className="flex-1 px-4 py-2.5 text-sm focus:outline-none rounded-xl"
              placeholder="Job title, skills, or company..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <input
              className="w-40 px-4 py-2.5 text-sm focus:outline-none border-l border-gray-100"
              placeholder="City"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <button type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition">
              Search jobs
            </button>
          </form>

          <p className="mt-4 text-xs text-gray-400">
            Popular: <button onClick={() => setKeyword('React')} className="text-blue-500 hover:underline mx-1">React</button>
            <button onClick={() => setKeyword('Data Engineer')} className="text-blue-500 hover:underline mx-1">Data Engineer</button>
            <button onClick={() => setKeyword('Product Manager')} className="text-blue-500 hover:underline mx-1">Product Manager</button>
            <button onClick={() => setKeyword('DevOps')} className="text-blue-500 hover:underline mx-1">DevOps</button>
          </p>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-gray-100 py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-4 gap-6 text-center">
          {[['10,000+', 'Active jobs'], ['2,400+', 'Companies hiring'], ['85%', 'Response rate'], ['3 days', 'Avg. time to interview']].map(([val, label]) => (
            <div key={label}>
              <p className="text-3xl font-bold text-gray-900">{val}</p>
              <p className="text-sm text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Job categories ── */}
      <section id="jobs" className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Browse by category</h2>
          <p className="text-gray-400 text-center text-sm mb-8">Thousands of jobs across every industry</p>
          <div className="grid grid-cols-4 gap-4">
            {CATEGORIES.map(({ icon, label, count }) => (
              <Link key={label} to="/register"
                className="bg-white border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition group text-center">
                <div className="text-3xl mb-2">{icon}</div>
                <p className="font-medium text-sm text-gray-800 group-hover:text-blue-600">{label}</p>
                <p className="text-xs text-gray-400">{count} jobs</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Get hired in 3 steps</h2>
          <p className="text-gray-400 text-center text-sm mb-12">Simpler than you think</p>
          <div className="grid grid-cols-3 gap-8">
            {[
              ['01', '📝', 'Build your profile', 'Add your skills, experience, and upload your resume. Takes less than 5 minutes.'],
              ['02', '🎯', 'Get matched', 'Our skill-matching engine surfaces jobs where your profile fits — ranked by match score.'],
              ['03', '🚀', 'Apply & track', 'One-click apply with your saved resume. Track every application in real time.'],
            ].map(([num, icon, title, desc]) => (
              <div key={num} className="text-center">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">{icon}</div>
                <p className="text-xs text-blue-600 font-medium mb-1">Step {num}</p>
                <p className="font-semibold text-gray-900 mb-2">{title}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Companies ── */}
      <section id="companies" className="py-12 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-400 mb-6">Trusted by teams at</p>
          <div className="flex flex-wrap justify-center gap-4">
            {COMPANIES.map((c) => (
              <div key={c} className="px-5 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-medium text-gray-600 hover:border-gray-200 transition">
                {c}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">People love HireHub</h2>
          <div className="grid grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ name, role, text }) => (
              <div key={name} className="bg-white border border-gray-100 rounded-xl p-5">
                <p className="text-sm text-gray-600 leading-relaxed mb-4">"{text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                    {name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-800">{name}</p>
                    <p className="text-[11px] text-gray-400">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6 bg-blue-600 text-white text-center">
        <h2 className="text-3xl font-bold mb-3">Ready to find your next job?</h2>
        <p className="text-blue-100 mb-8">Join thousands of professionals already on HireHub</p>
        <div className="flex gap-3 justify-center">
          <Link to="/register" className="px-8 py-3 bg-white text-blue-600 font-medium rounded-xl hover:bg-blue-50 transition">
            Get started — it's free
          </Link>
          <Link to="/register?role=RECRUITER" className="px-8 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-400 transition border border-blue-400">
            Hire talent
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-gray-100 text-center text-xs text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-[10px] font-bold">H</div>
          <span className="font-medium text-gray-600">HireHub</span>
        </div>
        <p>© {new Date().getFullYear()} HireHub. Built for India's job seekers.</p>
      </footer>
    </div>
  );
}