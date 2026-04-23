import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('hh_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?._silent) {
      localStorage.removeItem('hh_token');
      localStorage.removeItem('hh_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth / Profile ────────────────────────────────────────────
export const authAPI = {
  register:       (data) => API.post('/auth/register', data),
  login:          (data) => API.post('/auth/login', data),
  getMe:          ()     => API.get('/auth/me'),
  updateProfile:  (data) => API.put('/auth/profile', data),
  changePassword: (data) => API.put('/auth/change-password', data),
};

// ── Extended Profile ──────────────────────────────────────────
export const profileAPI = {
  getMyProfile:    ()          => API.get('/profile/me'),
  getProfile:      (userId)    => API.get(`/profile/${userId}`),
  updateExtended:  (data)      => API.put('/profile', data),
  addExperience:   (data)      => API.post('/profile/experience', data),
  deleteExperience:(id)        => API.delete(`/profile/experience/${id}`),
  addEducation:    (data)      => API.post('/profile/education', data),
  deleteEducation: (id)        => API.delete(`/profile/education/${id}`),
  replaceSkills:   (skills)    => API.put('/profile/skills', skills),
  addResume:       (data)      => API.post('/profile/resume', data),
  setPrimaryResume:(id)        => API.put(`/profile/resume/${id}/primary`),
  deleteResume:    (id)        => API.delete(`/profile/resume/${id}`),
};

// ── File Upload ───────────────────────────────────────────────
export const uploadAPI = {
  uploadResume: (file, name) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('name', name || file.name);
    return API.post('/upload/resume', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadAvatar: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return API.post('/upload/avatar', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ── Jobs ──────────────────────────────────────────────────────
export const jobsAPI = {
  search:  (params) => API.get('/jobs', { params }),
  getById: (id)     => API.get(`/jobs/${id}`),
  post:    (data)   => API.post('/jobs', data),
  update:  (id, d)  => API.put(`/jobs/${id}`, d),
  delete:  (id)     => API.delete(`/jobs/${id}`),
  myJobs:  ()       => API.get('/jobs/my'),
};

// ── Applications ─────────────────────────────────────────────
export const appsAPI = {
  apply:          (data)      => API.post('/applications', data),
  myApplications: (silent)    => API.get('/applications/my', silent ? { _silent: true } : {}),
  forJob:         (jobId)     => API.get(`/applications/job/${jobId}`),
  allCandidates:  ()          => API.get('/applications/recruiter/all'),
  updateStatus:   (id, data)  => API.put(`/applications/${id}/status`, data),
  adminStats:     ()          => API.get('/applications/admin/stats'),
};

// ── Companies ─────────────────────────────────────────────────
export const companyAPI = {
  search:      (q)    => API.get('/companies', { params: { q } }),
  getById:     (id)   => API.get(`/companies/${id}`),
  create:      (data) => API.post('/companies', data),
  update:      (id,d) => API.put(`/companies/${id}`, d),
  joinCompany: (id)   => API.put(`/companies/${id}/join`),
};

// ── Notifications ─────────────────────────────────────────────
export const notifAPI = {
  list:        ()   => API.get('/notifications'),
  unreadCount: ()   => API.get('/notifications/unread-count'),
  markAllRead: ()   => API.put('/notifications/read-all'),
  markRead:    (id) => API.put(`/notifications/${id}/read`),
};

// ── Messages ──────────────────────────────────────────────────
export const messageAPI = {
  conversations: ()           => API.get('/messages/conversations'),
  thread:        (userId)     => API.get(`/messages/thread/${userId}`),
  send:          (userId, body) => API.post(`/messages/send/${userId}`, { body }),
};

// ── Recommendations ───────────────────────────────────────────
export const recommendAPI = {
  get: (limit = 10) => API.get('/recommendations', { params: { limit } }),
};

// ── Admin ─────────────────────────────────────────────────────
export const adminAPI = {
  stats:          ()   => API.get('/admin/stats'),
  allUsers:       ()   => API.get('/admin/users'),
  allJobs:        ()   => API.get('/admin/jobs'),
  deactivateUser: (id) => API.put(`/admin/users/${id}/deactivate`),
  activateUser:   (id) => API.put(`/admin/users/${id}/activate`),
  userGrowth:     ()   => API.get('/admin/growth'),
  closeJob:       (id) => API.put(`/admin/jobs/${id}/close`),
};

export default API;