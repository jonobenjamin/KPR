/**
 * Shared portal authentication
 * Uses localStorage: portal_token, portal_user, portal_expiry
 * Hardcoded fallback: jono / password (admin) until first admin is created
 */
const AUTH_KEYS = {
  TOKEN: 'portal_token',
  USER: 'portal_user',
  EXPIRY: 'portal_expiry'
};

const HARDCODED_ADMIN = {
  username: 'jono',
  password: 'password',
  user: { name: 'Admin', role: 'admin', email: 'jono' }
};

function getStoredUser() {
  try {
    const token = localStorage.getItem(AUTH_KEYS.TOKEN);
    const expiry = localStorage.getItem(AUTH_KEYS.EXPIRY);
    const userStr = localStorage.getItem(AUTH_KEYS.USER);
    if (!token || !expiry || !userStr) return null;
    if (Date.now() >= parseInt(expiry, 10)) {
      clearAuth();
      return null;
    }
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEYS.TOKEN);
  localStorage.removeItem(AUTH_KEYS.USER);
  localStorage.removeItem(AUTH_KEYS.EXPIRY);
}

function setAuth(user, token, expiryMs) {
  const expiry = expiryMs ? Date.now() + expiryMs : (Date.now() + 24 * 60 * 60 * 1000);
  localStorage.setItem(AUTH_KEYS.TOKEN, token || 'portal_' + Date.now());
  localStorage.setItem(AUTH_KEYS.EXPIRY, String(expiry));
  localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
}

async function login(username, password) {
  // Hardcoded fallback - always works until first admin is created
  if (username === HARDCODED_ADMIN.username && password === HARDCODED_ADMIN.password) {
    setAuth(HARDCODED_ADMIN.user);
    return { success: true, user: HARDCODED_ADMIN.user };
  }
  // Try API login for created portal users
  try {
    const res = await fetch('https://wildlife-tracker-gxz5.vercel.app/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: username, password })
    });
    const data = await res.json();
    if (data.success && data.user) {
      setAuth(data.user, data.token, (data.expiry - Date.now()) || 24 * 60 * 60 * 1000);
      return { success: true, user: data.user };
    }
  } catch (e) {}
  return { success: false, message: 'Invalid username or password' };
}

function isAdmin() {
  const u = getStoredUser();
  return u && u.role === 'admin';
}

function isAuthenticated() {
  return getStoredUser() !== null;
}
