// auth.js - إدارة تسجيل الدخول والجلسة

const USERS_KEY = 'rokhaa_users';
const SESSION_KEY = 'rokhaa_session';

function getCurrentUser() {
  const session = localStorage.getItem(SESSION_KEY);
  if (!session) return null;
  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
}

function login(email, password) {
  const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  const sessionUser = { email: user.email, name: user.name, role: user.role };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
  return sessionUser;
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = 'index.html';
}

function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

function requireAdmin() {
  const user = requireAuth();
  if (!user) return null;
  if (user.role !== 'admin') {
    alert('غير مصرح لك بالدخول إلى هذه الصفحة');
    window.location.href = 'home.html';
    return null;
  }
  return user;
}

function updateSidebarUser() {
  const user = getCurrentUser();
  if (!user) return;
  const userNameSpan = document.getElementById('sidebarUserName');
  const userRoleSpan = document.getElementById('sidebarUserRole');
  if (userNameSpan) userNameSpan.textContent = user.name;
  if (userRoleSpan) userRoleSpan.textContent = user.role === 'admin' ? 'مدير' : 'موظف';
}

document.addEventListener('DOMContentLoaded', function() {
  updateSidebarUser();
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  const user = getCurrentUser();
  const adminLink = document.getElementById('adminNavLink');
  if (adminLink && user && user.role !== 'admin') {
    adminLink.style.display = 'none';
  } else if (adminLink && user && user.role === 'admin') {
    adminLink.style.display = 'flex';
  }
});

// معالجة نموذج تسجيل الدخول
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');
    try {
      login(email, password);
      window.location.href = 'home.html';
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });

  document.getElementById('googleSignIn').addEventListener('click', function() {
    const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    let googleUser = users.find(u => u.email === 'user@rokhaa.com');
    if (!googleUser) {
      googleUser = { email: 'user@rokhaa.com', password: 'google123', name: 'مستخدم Google', role: 'user' };
      users.push(googleUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
    const sessionUser = { email: googleUser.email, name: googleUser.name, role: googleUser.role };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    window.location.href = 'home.html';
  });
}
