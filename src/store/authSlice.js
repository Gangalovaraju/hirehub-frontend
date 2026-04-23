import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../api';

// ── Async thunks ──────────────────────────────────────
export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.login(credentials);
      localStorage.setItem('hh_token', data.token);
      localStorage.setItem('hh_user',  JSON.stringify(data));
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Login failed');
    }
  }
);

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.register(payload);
      localStorage.setItem('hh_token', data.token);
      localStorage.setItem('hh_user',  JSON.stringify(data));
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Registration failed');
    }
  }
);

export const updateProfileThunk = createAsyncThunk(
  'auth/updateProfile',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.updateProfile(payload);
      // Server re-issues token if email changed
      localStorage.setItem('hh_token', data.token);
      localStorage.setItem('hh_user',  JSON.stringify(data));
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Update failed');
    }
  }
);

// ── Slice ─────────────────────────────────────────────
const savedUser = (() => {
  try { return JSON.parse(localStorage.getItem('hh_user')); }
  catch { return null; }
})();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:    savedUser || null,
    token:   localStorage.getItem('hh_token') || null,
    loading: false,
    error:   null,
  },
  reducers: {
    logout(state) {
      state.user  = null;
      state.token = null;
      localStorage.removeItem('hh_token');
      localStorage.removeItem('hh_user');
    },
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    const pending   = (s)    => { s.loading = true;  s.error = null; };
    const fulfilled = (s, a) => { s.loading = false; s.user = a.payload; s.token = a.payload.token; };
    const rejected  = (s, a) => { s.loading = false; s.error = a.payload; };

    builder
      .addCase(loginThunk.pending,           pending)
      .addCase(loginThunk.fulfilled,         fulfilled)
      .addCase(loginThunk.rejected,          rejected)
      .addCase(registerThunk.pending,        pending)
      .addCase(registerThunk.fulfilled,      fulfilled)
      .addCase(registerThunk.rejected,       rejected)
      .addCase(updateProfileThunk.pending,   pending)
      .addCase(updateProfileThunk.fulfilled, fulfilled)
      .addCase(updateProfileThunk.rejected,  rejected);
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
