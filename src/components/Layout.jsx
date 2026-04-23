import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import NotificationBell from './NotificationBell';

const SEEKER_NAV = [
  { to: '/seeker/dashboard',       icon: '◈',  label: 'Dashboard'       },
  { to: '/seeker/jobs',            icon: '⊞',  label: 'Browse Jobs'     },
  { to: '/seeker/recommendations', icon: '🎯', label: 'Recommended'     },
  { to: '/seeker/applications',    icon: '📋', label: 'Applications'    },
  { to: '/seeker/saved',           icon: '♡',  label: 'Saved Jobs'      },
  { to: '/messages',               icon: '💬', label: 'Messages'        },
  { to: '/profile',                icon: '👤', label: 'My Profile'      },
];

const RECRUITER_NAV = [
  { to: '/recruiter/dashboard',  icon: '◈',  label: 'Dashboard'   },
  { to: '/recruiter/jobs',       icon: '⊞',  label: 'My Jobs'     },
  { to: '/recruiter/search',     icon: '🔍', label: 'Find Talent' },
  { to: '/recruiter/candidates', icon: '👥', label: 'Candidates'  },
  { to: '/recruiter/pipeline',   icon: '📊', label: 'Pipeline'    },
  { to: '/recruiter/post-job',   icon: '➕', label: 'Post a Job'  },
  { to: '/messages',             icon: '💬', label: 'Messages'    },
  { to: '/profile',              icon: '👤', label: 'My Profile'  },
];

const ADMIN_NAV = [
  { to: '/admin/dashboard', icon: '◈',  label: 'Overview'   },
  { to: '/admin/jobs',      icon: '⊞',  label: 'All Jobs'   },
  { to: '/admin/users',     icon: '👥', label: 'Users'      },
  { to: '/profile',         icon: '👤', label: 'My Profile' },
];

function navForRole(role) {
  if (role === 'RECRUITER') return RECRUITER_NAV;
  if (role === 'ADMIN')     return ADMIN_NAV;
  return SEEKER_NAV;
}

// Role color badge
const ROLE_STYLE = {
  SEEKER:    'bg-blue-50 text-blue-600',
  RECRUITER: 'bg-purple-50 text-purple-600',
  ADMIN:     'bg-red-50 text-red-600',
};

function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-80 p-6 flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-gray-900 font-semibold">Sign out of HireHub?</p>
          <p className="text-gray-400 text-sm mt-1">You'll need to log in again to access your account.</p>
        </div>
        <div className="flex gap-3 w-full">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 text-sm font-medium text-white hover:bg-red-600">Sign out</button>
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children, pageTitle, pageSubtitle, topAction }) {
  const dispatch      = useDispatch();
  const navigate      = useNavigate();
  const { user }      = useSelector((s) => s.auth);
  const [showLogout, setShowLogout] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = navForRole(user?.role);
  const initials = user?.fullName?.split(' ').map((w) => w[0]).join('').toUpperCase() || 'U';

  const handleLogout = () => { dispatch(logout()); navigate('/login'); };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {showLogout && <LogoutModal onConfirm={handleLogout} onCancel={() => setShowLogout(false)} />}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        w-56 flex-shrink-0 flex flex-col bg-white border-r border-gray-100 h-screen
        transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-50">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm">H</div>
          <div>
            <span className="font-bold text-gray-900 text-sm">HireHub</span>
            <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-block ml-1.5 ${ROLE_STYLE[user?.role] || 'bg-gray-100 text-gray-500'}`}>
              {user?.role}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all
                 ${isActive
                   ? 'bg-blue-600 text-white font-medium shadow-sm'
                   : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`
              }>
              <span className="text-base w-5 flex-shrink-0 text-center">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-2 border-t border-gray-50">
          <div className="flex items-center gap-2.5 px-2 py-2.5 rounded-xl hover:bg-gray-50 transition group">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0 overflow-hidden ring-2 ring-white">
              {user?.profilePicture
                ? <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                : initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{user?.fullName}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
            <button onClick={() => setShowLogout(true)}
              className="text-gray-300 hover:text-red-400 transition flex-shrink-0 opacity-0 group-hover:opacity-100" title="Sign out">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button className="lg:hidden p-1.5 rounded-lg hover:bg-gray-50" onClick={() => setSidebarOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div>
              <h1 className="text-sm font-bold text-gray-900">{pageTitle}</h1>
              {pageSubtitle && <p className="text-xs text-gray-400">{pageSubtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {topAction}
            <NotificationBell />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}