// ===== لوحة تحكم المدير =====

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin.html')) {
        checkAdminAccess();
        initializeAdminPanel();
    }
});

// التحقق من صلاحيات المدير
function checkAdminAccess() {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    if (currentUser.role !== 'admin') {
        showAlert('غير مصرح لك بالوصول إلى لوحة التحكم', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
}

// تهيئة لوحة التحكم
function initializeAdminPanel() {
    setupTabs();
    loadUsers();
    loadAllFiles();
    loadStatistics();
    setupAdminActions();
}

// إعداد التبويبات
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            // تحميل البيانات حسب التبويب
            if (targetTab === 'users') loadUsers();
            if (targetTab === 'files') loadAllFiles();
            if (targetTab === 'statistics') loadStatistics();
        });
    });
}

// تحميل المستخدمين
function loadUsers() {
    const users = JSON.parse(localStorage.getItem('rakha_users') || '[]');
    const container = document.getElementById('usersList');
    
    if (users.length === 0) {
        container.innerHTML = '<p class="no-data">لا يوجد مستخدمين</p>';
        return;
    }
    
    container.innerHTML = users.map(user => `
        <div class="list-item">
            <div class="item-info">
                <div>
                    <strong>${user.name}</strong>
                    <span class="user-email">${user.email}</span>
                </div>
                <span class="badge ${user.role}">${user.role === 'admin' ? 'مدير' : 'مستخدم'}</span>
            </div>
            <div class="item-actions">
                <button class="btn-sm btn-warning" onclick="editUser(${user.id})">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                ${user.role !== 'admin' ? `
                    <button class="btn-sm btn-danger" onclick="deleteUser(${user.id})">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// تحميل جميع الملفات (للمدير)
function loadAllFiles() {
    const files = JSON.parse(localStorage.getItem('rakha_files') || '[]');
    const container = document.getElementById('adminFilesList');
    
    if (files.length === 0) {
        container.innerHTML = '<p class="no-data">لا توجد ملفات</p>';
        return;
    }
    
    container.innerHTML = files.map(file => `
        <div class="list-item">
            <div class="item-info">
                <i class="fas ${getFileIcon(file.type)}"></i>
                <div>
                    <strong>${file.name}</strong>
                    <div class="file-details">
                        <span>${file.uploader}</span>
                        <span>${formatDate(file.uploadDate)}</span>
                        <span class="badge ${file.isPublic ? 'public' : 'private'}">
                            ${file.isPublic ? 'عام' : 'خاص'}
                        </span>
                    </div>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-sm btn-success" onclick="toggleFileVisibility(${file.id})">
                    <i class="fas fa-${file.isPublic ? 'lock' : 'globe'}"></i>
                    ${file.isPublic ? 'جعله خاص' : 'جعله عام'}
                </button>
                <button class="btn-sm btn-danger" onclick="adminDeleteFile(${file.id})">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </div>
    `).join('');
}

// تحميل الإحصائيات
function loadStatistics() {
    const users = JSON.parse(localStorage.getItem('rakha_users') || '[]');
    const files = JSON.parse(localStorage.getItem('rakha_files') || '[]');
    const currentUser = getCurrentUser();
    
    const stats = {
        totalUsers: users.length,
        totalFiles: files.length,
        publicFiles: files.filter(f => f.isPublic).length,
        privateFiles: files.filter(f => !f.isPublic).length,
        totalDownloads: files.reduce((sum, f) => sum + (f.downloads || 0), 0),
        totalViews: files.reduce((sum, f) => sum + (f.views || 0), 0),
        totalStorage: files.reduce((sum, f) => sum + (f.size || 0), 0),
        adminCount: users.filter(u => u.role === 'admin').length,
        recentUploads: files.filter(f => {
            const uploadDate = new Date(f.uploadDate);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return uploadDate > weekAgo;
        }).length
    };
    
    const container = document.getElementById('systemStats');
    container.innerHTML = `
        <div class="stat-card-large">
            <div class="stat-value">${stats.totalUsers}</div>
            <div class="stat-label">إجمالي المستخدمين</div>
            <div class="stat-detail">${stats.adminCount} مدير</div>
        </div>
        <div class="stat-card-large">
            <div class="stat-value">${stats.totalFiles}</div>
            <div class="stat-label">إجمالي الملفات</div>
            <div class="stat-detail">${stats.publicFiles} عام، ${stats.privateFiles} خاص</div>
        </div>
        <div class="stat-card-large">
            <div class="stat-value">${stats.totalDownloads}</div>
            <div class="stat-label">إجمالي التنزيلات</div>
            <div class="stat-detail">${stats.totalViews} مشاهدة</div>
        </div>
        <div class="stat-card-large">
            <div class="stat-value">${formatFileSize(stats.totalStorage)}</div>
            <div class="stat-label">المساحة المستخدمة</div>
            <div class="stat-detail">${stats.recentUploads} ملف هذا الأسبوع</div>
        </div>
    `;
}

// إعداد إجراءات المدير
function setupAdminActions() {
    // يمكن إضافة المزيد من الإجراءات هنا
}

// تعديل مستخدم
function editUser(userId) {
    const users = JSON.parse(localStorage.getItem('rakha_users') || '[]');
    const user = users.find(u => u.id === userId);
    
    if (!user) return;
    
    const newName = prompt('أدخل الاسم الجديد:', user.name);
    if (newName && newName !== user.name) {
        updateUserProfile(userId, { name: newName });
        loadUsers();
        showAlert('تم تحديث المستخدم بنجاح', 'success');
    }
}

// حذف مستخدم
function deleteUser(userId) {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟ سيتم حذف جميع ملفاته أيضاً.')) {
        return;
    }
    
    if (deleteAccount(userId)) {
        loadUsers();
        loadAllFiles();
        loadStatistics();
        showAlert('تم حذف المستخدم بنجاح', 'success');
    }
}

// تبديل رؤية الملف
function toggleFileVisibility(fileId) {
    const files = JSON.parse(localStorage.getItem('rakha_files') || '[]');
    const file = files.find(f => f.id === fileId);
    
    if (!file) return;
    
    file.isPublic = !file.isPublic;
    localStorage.setItem('rakha_files', JSON.stringify(files));
    
    loadAllFiles();
    loadStatistics();
    showAlert(`تم تغيير حالة الملف إلى ${file.isPublic ? 'عام' : 'خاص'}`, 'success');
}

// حذف ملف (صلاحيات المدير)
function adminDeleteFile(fileId) {
    if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) {
        return;
    }
    
    let files = JSON.parse(localStorage.getItem('rakha_files') || '[]');
    files = files.filter(f => f.id !== fileId);
    localStorage.setItem('rakha_files', JSON.stringify(files));
    
    loadAllFiles();
    loadStatistics();
    showAlert('تم حذف الملف بنجاح', 'success');
}

// تصدير المستخدمين
function exportUsers() {
    const users = JSON.parse(localStorage.getItem('rakha_users') || '[]');
    const exportData = users.map(u => ({
        الاسم: u.name,
        البريد_الإلكتروني: u.email,
        الصلاحية: u.role === 'admin' ? 'مدير' : 'مستخدم',
        تاريخ_التسجيل: formatDate(u.createdAt)
    }));
    
    exportToExcel(exportData, 'المستخدمين');
}

// تصدير الملفات
function exportFiles() {
    const files = JSON.parse(localStorage.getItem('rakha_files') || '[]');
    const exportData = files.map(f => ({
        اسم_الملف: f.name,
        الوصف: f.description || '',
        رافع_الملف: f.uploader,
        تاريخ_الرفع: formatDate(f.uploadDate),
        النوع: f.isPublic ? 'عام' : 'خاص',
        الحجم: formatFileSize(f.size),
        التنزيلات: f.downloads || 0,
        المشاهدات: f.views || 0
    }));
    
    exportToExcel(exportData, 'الملفات');
}

// تصدير إلى Excel
function exportToExcel(data, fileName) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `${fileName}_${date}.xlsx`);
    
    showAlert('تم تصدير البيانات بنجاح', 'success');
}
