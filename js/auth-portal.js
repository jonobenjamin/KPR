/**
 * Auth Portal - Firebase auth for KPR Monitoring
 * - Email PIN login (same as PWA)
 * - Role-based redirect: admin -> map.html + user-submissions, viewer/user -> map-users.html
 * - Protects map.html, user-submissions.html, map-users.html
 */

const API_BASE = 'https://wildlife-tracker-gxz5.vercel.app';

async function waitForFirebase() {
  return new Promise((resolve) => {
    const check = () => {
      if (window.firebasePortal?.auth && window.firebasePortal?.db) resolve();
      else setTimeout(check, 50);
    };
    check();
  });
}

async function getUserRole(uid) {
  const { db, doc, getDoc } = window.firebasePortal;
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.status === 'revoked') return null;
      return data.role || 'viewer';
    }
  } catch (e) {
    console.error('Failed to get user role:', e);
  }
  return 'viewer';
}

async function requestPin(email, name) {
  const res = await fetch(`${API_BASE}/api/auth/request-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to send PIN');
  return data;
}

async function verifyPin(email, pin) {
  const res = await fetch(`${API_BASE}/api/auth/verify-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, pin })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Invalid PIN');
  return data;
}

async function signInWithPin(email, pin) {
  const data = await verifyPin(email, pin);
  const { auth, signInWithCustomToken, db, doc, getDoc, setDoc, serverTimestamp } = window.firebasePortal;
  await signInWithCustomToken(auth, data.customToken);
  const user = auth.currentUser;
  if (user) {
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      const base = {
        uid: user.uid,
        name: data.name || '',
        email: email.toLowerCase(),
        lastLogin: serverTimestamp()
      };
      await setDoc(userRef, snap.exists() ? base : { ...base, role: 'viewer', status: 'active' }, { merge: true });
    } catch (e) {
      console.warn('Could not update user doc:', e);
    }
  }
  return data;
}

function redirectByRole(role, returnUrl) {
  if (role === 'admin') {
    if (returnUrl && returnUrl.includes('user-submissions')) {
      window.location.href = 'user-submissions.html';
    } else {
      window.location.href = 'map.html';
    }
  } else {
    window.location.href = 'map-users.html';
  }
}

async function checkAuthAndRedirect(isLoginPage = false) {
  await waitForFirebase();
  const { auth, onAuthStateChanged } = window.firebasePortal;

  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub();
      if (!user) {
        if (isLoginPage) resolve(null);
        else window.location.replace('login.html');
        return;
      }
      const role = await getUserRole(user.uid);
      if (!role) {
        await auth.signOut();
        if (isLoginPage) resolve(null);
        else window.location.replace('login.html');
        return;
      }
      if (isLoginPage) {
        redirectByRole(role, document.referrer);
      } else {
        resolve({ user, role });
      }
    });
  });
}

function canAccessPage(role, page) {
  if (page === 'map-users.html') return true;
  if (page === 'map.html' || page === 'user-submissions.html') return role === 'admin';
  return false;
}

window.AuthPortal = {
  waitForFirebase,
  getUserRole,
  requestPin,
  verifyPin,
  signInWithPin,
  redirectByRole,
  checkAuthAndRedirect,
  canAccessPage
};
