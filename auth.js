// ===== نظام المصادقة المتكامل =====

// المتغيرات العامة
let currentUser = null;

// تهيئة نظام المصادقة
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    checkAuthState();
});

// تهيئة المصادقة
function initializeAuth() {
    // تحميل بيانات المستخدمين
    if (!localStorage.getItem('rakha_users')) {
        const defaultUsers = [
            {
                id: 1,
                name: 'مدير النظام',
                email: 'admin@rakha.sa',
                password: 'Admin@2024',
                role: 'admin',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                name: 'مستخدم تجريبي',
                email: 'user@rakha.sa',
                password: 'User@2024',
                role: 'user',
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('rakha_users', JSON.stringify(defaultUsers));
    }
    
    // إعداد Google Sign-In
    if (document.getElementById('googleSignIn')) {
        initializeGoogleSignIn();
    }
    
    // إعداد نماذج تسجيل الدخول والتسجيل
    setupAuthForms();
}

// إعداد Google Sign-In
function initializeGoogleSignIn() {
    google.accounts.id.initialize({
        client_id: '238339995391-gr51rtprnd27vgts2r9gsbsinbc6434c.apps.googleusercontent.com', // يجب استبداله بمعرف عميل حقيقي
        callback: handleGoogleSignIn,
        auto_select: false,
        cancel_on_tap_outside: true
    });
    
    google.accounts.id.renderButton(
        document.getElementById('googleSignIn'),
        { 
            theme: 'outline', 
            size: 'large',
            text: 'signin_with',
            shape: 'pill',
            width: 280
        }
    );
    
    google.accounts.id.prompt();
}

// معالجة تسجيل الدخول بـ Google
function handleGoogleSignIn(response) {
    const credential = response.credential;
    const decodedToken = JSON.parse(atob(credential.split('.')[1]));
    
    const googleUser = {
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        googleId: decodedToken.sub
    };
    
    // التحقق من وجود المستخدم أو إنشاء حساب جديد
    let users = JSON.parse(localStorage.getItem('rakha_users') || '[]');
    let user = users.find(u => u.email === googleUser.email);
    
    if (!user) {
        user = {
            id: users.length + 1,
            name: googleUser.name,
            email: googleUser.email,
            picture: googleUser.picture,
            googleId: googleUser.googleId,
            role: 'user',
            createdAt: new Date().toISOString()
        };
        users.push(user);
        localStorage.setItem('rakha_users', JSON.stringify(users));
    }
    
    // تسجيل الدخول
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    
    localStorage.setItem('rakha_current_user', JSON.stringify(userWithoutPassword));
    showAuthMessage('تم تسجيل الدخول بنجاح!', 'success');
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// إعداد نماذج المصادقة
function setupAuthForms() {
    // نموذج تسجيل الدخول
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }
    
    // نموذج التسجيل
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleRegister();
        });
    }
}

// معالجة تسجيل الدخول
function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const users = JSON.parse(localStorage.getItem('rakha_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        
        localStorage.setItem('rakha_current_user', JSON.stringify(userWithoutPassword));
        showAuthMessage('تم تسجيل الدخول بنجاح!', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } else {
        showAuthMessage('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
    }
}

// معالجة التسجيل
function handleRegister() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirm').value;
    
    // التحقق من صحة البيانات
    if (password !== confirmPassword) {
        showAuthMessage('كلمات المرور غير متطابقة', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAuthMessage('يجب أن تكون كلمة المرور 6 أحرف على الأقل', 'error');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('rakha_users') || '[]');
    
    // التحقق من وجود البريد الإلكتروني
    if (users.find(u => u.email === email)) {
        showAuthMessage('البريد الإلكتروني مسجل مسبقاً', 'error');
        return;
    }
    
    // إنشاء مستخدم جديد
    const newUser = {
        id: users.length + 1,
        name: name,
        email: email,
        password: password,
        role: 'user',
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('rakha_users', JSON.stringify(users));
    
    showAuthMessage('تم إنشاء الحساب بنجاح!', 'success');
    
    setTimeout(() => {
        switchTab('login');
    }, 1500);
}

// تبديل التبويبات
function switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
    
    document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
}

// عرض رسالة المصادقة
function showAuthMessage(message, type) {
    const messageDiv = document.getElementById('authMessage');
    messageDiv.textContent = message;
    messageDiv.className = `auth-message ${type}`;
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// التحقق من حالة المصادقة
function checkAuthState() {
    const userJson = localStorage.getItem('rakha_current_user');
    if (userJson) {
        currentUser = JSON.parse(userJson);
    }
    
    // تحديث واجهة المستخدم
    updateAuthUI();
}

// تحديث واجهة المستخدم بناءً على حالة المصادقة
function updateAuthUI() {
    const userInfo = document.getElementById('userInfo');
    const loginBtn = document.getElementById('loginBtn');
    const userProfile = document.getElementById('userProfile');
    const adminLink = document.getElementById('adminLink');
    
    if (currentUser) {
        if (userInfo) {
            userInfo.innerHTML = `
                <span class="user-name">${currentUser.name}</span>
                <span class="user-role">${currentUser.role === 'admin' ? 'مدير النظام' : 'مستخدم'}</span>
            `;
        }
        
        if (loginBtn) loginBtn.style.display = 'none';
        if (userProfile) userProfile.style.display = 'block';
        if (adminLink && currentUser.role === 'admin') adminLink.style.display = 'block';
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (userProfile) userProfile.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
    }
}

// تسجيل الخروج
function logout() {
    localStorage.removeItem('rakha_current_user');
    currentUser = null;
    window.location.href = 'index.html';
}

// التحقق من صلاحيات المدير
function isAdmin() {
    return currentUser && currentUser.role === 'admin';
}

// التحقق من صلاحيات المستخدم
function isAuthenticated() {
    return currentUser !== null;
}

// الحصول على المستخدم الحالي
function getCurrentUser() {
    return currentUser;
}

// تحديث بيانات المستخدم
function updateUserProfile(userId, updates) {
    const users = JSON.parse(localStorage.getItem('rakha_users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updates };
        localStorage.setItem('rakha_users', JSON.stringify(users));
        
        // تحديث المستخدم الحالي إذا كان هو نفسه
        if (currentUser && currentUser.id === userId) {
            const updatedUser = { ...users[userIndex] };
            delete updatedUser.password;
            localStorage.setItem('rakha_current_user', JSON.stringify(updatedUser));
            currentUser = updatedUser;
            updateAuthUI();
        }
        
        return true;
    }
    
    return false;
}

// تغيير كلمة المرور
function changePassword(oldPassword, newPassword) {
    if (!currentUser) return false;
    
    const users = JSON.parse(localStorage.getItem('rakha_users') || '[]');
    const user = users.find(u => u.id === currentUser.id);
    
    if (user && user.password === oldPassword) {
        user.password = newPassword;
        localStorage.setItem('rakha_users', JSON.stringify(users));
        return true;
    }
    
    return false;
}

// حذف حساب المستخدم
function deleteAccount(userId) {
    if (!isAdmin() && currentUser.id !== userId) {
        return false;
    }
    
    let users = JSON.parse(localStorage.getItem('rakha_users') || '[]');
    users = users.filter(u => u.id !== userId);
    localStorage.setItem('rakha_users', JSON.stringify(users));
    
    // حذف ملفات المستخدم
    let files = JSON.parse(localStorage.getItem('rakha_files') || '[]');
    files = files.filter(f => f.uploaderId !== userId);
    localStorage.setItem('rakha_files', JSON.stringify(files));
    
    if (currentUser && currentUser.id === userId) {
        logout();
    }
    
    return true;
}
