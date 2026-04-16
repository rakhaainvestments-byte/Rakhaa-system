// ===== نظام إدارة الملفات المتكامل =====

// تهيئة صفحة الملفات
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('files.html')) {
        initializeFilesPage();
    }
});

// تهيئة صفحة الملفات
function initializeFilesPage() {
    checkFileAccess();
    loadFiles();
    setupFileUpload();
    setupFileFilters();
}

// التحقق من صلاحية الوصول للملفات
function checkFileAccess() {
    const currentUser = getCurrentUser();
    const uploadBtn = document.getElementById('uploadFileBtn');
    
    if (!currentUser) {
        if (uploadBtn) uploadBtn.style.display = 'none';
        showAlert('يجب تسجيل الدخول لرفع الملفات', 'warning');
    }
}

// إعداد رفع الملفات
function setupFileUpload() {
    const uploadBtn = document.getElementById('uploadFileBtn');
    const modal = document.getElementById('uploadModal');
    const closeBtn = document.querySelector('.close');
    const uploadForm = document.getElementById('uploadForm');
    
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            if (!getCurrentUser()) {
                showAlert('يجب تسجيل الدخول لرفع الملفات', 'warning');
                window.location.href = 'login.html';
                return;
            }
            modal.style.display = 'flex';
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleFileUpload);
    }
}

// معالجة رفع الملف
function handleFileUpload(e) {
    e.preventDefault();
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showAlert('يجب تسجيل الدخول لرفع الملفات', 'error');
        return;
    }
    
    const fileName = document.getElementById('fileName').value;
    const fileDescription = document.getElementById('fileDescription').value;
    const fileInput = document.getElementById('fileInput2');
    const isPublic = document.getElementById('fileIsPublic').checked;
    
    if (!fileInput.files[0]) {
        showAlert('يرجى اختيار ملف', 'error');
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = function(event) {
        const fileData = {
            id: Date.now(),
            name: fileName,
            description: fileDescription,
            originalName: file.name,
            type: file.type,
            size: file.size,
            data: event.target.result.split(',')[1],
            uploader: currentUser.name,
            uploaderId: currentUser.id,
            uploadDate: new Date().toISOString(),
            isPublic: isPublic,
            downloads: 0,
            views: 0
        };
        
        saveFile(fileData);
        
        document.getElementById('uploadModal').style.display = 'none';
        uploadForm.reset();
        loadFiles();
        
        showAlert('تم رفع الملف بنجاح!', 'success');
    };
    
    reader.readAsDataURL(file);
}

// حفظ الملف
function saveFile(fileData) {
    const files = JSON.parse(localStorage.getItem('rakha_files') || '[]');
    files.push(fileData);
    localStorage.setItem('rakha_files', JSON.stringify(files));
}

// تحميل الملفات
function loadFiles() {
    const files = JSON.parse(localStorage.getItem('rakha_files') || '[]');
    const currentUser = getCurrentUser();
    
    // الملفات العامة
    const publicFiles = files.filter(f => f.isPublic);
    displayFiles('publicFiles', publicFiles, 'public');
    
    // الملفات الخاصة بالمستخدم
    if (currentUser) {
        const privateFiles = files.filter(f => !f.isPublic && f.uploaderId === currentUser.id);
        displayFiles('privateFiles', privateFiles, 'private');
    } else {
        document.getElementById('privateFiles').innerHTML = `
            <div class="no-files">
                <i class="fas fa-lock" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>يجب تسجيل الدخول لعرض الملفات الخاصة</p>
                <a href="login.html" class="btn-primary" style="margin-top: 1rem;">تسجيل الدخول</a>
            </div>
        `;
    }
}

// عرض الملفات
function displayFiles(containerId, files, type) {
    const container = document.getElementById(containerId);
    const currentUser = getCurrentUser();
    
    if (files.length === 0) {
        container.innerHTML = `
            <div class="no-files">
                <i class="fas fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>لا توجد ملفات ${type === 'public' ? 'عامة' : 'خاصة'}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = files.map(file => {
        const canDelete = currentUser && (currentUser.role === 'admin' || currentUser.id === file.uploaderId);
        
        return `
            <div class="file-item">
                <div class="file-item-header">
                    <div class="file-item-icon">
                        <i class="fas ${getFileIcon(file.type)}"></i>
                    </div>
                    <div class="file-item-info">
                        <h3>${file.name}</h3>
                        <div class="file-item-meta">
                            <span><i class="fas fa-user"></i> ${file.uploader}</span>
                            <span><i class="fas fa-calendar"></i> ${formatDate(file.uploadDate)}</span>
                            <span><i class="fas fa-database"></i> ${formatFileSize(file.size)}</span>
                        </div>
                    </div>
                </div>
                ${file.description ? `<p class="file-description">${file.description}</p>` : ''}
                <div class="file-item-actions">
                    <button class="btn-icon" onclick="viewFile(${file.id})">
                        <i class="fas fa-eye"></i> عرض
                    </button>
                    <button class="btn-icon" onclick="downloadFile(${file.id})">
                        <i class="fas fa-download"></i> تنزيل
                    </button>
                    ${canDelete ? `
                        <button class="btn-icon danger" onclick="deleteFile(${file.id})">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// عرض ملف
function viewFile(fileId) {
    const files = JSON.parse(localStorage.getItem('rakha_files') || '[]');
    const file = files.find(f => f.id === fileId);
    
    if (!file) {
        showAlert('الملف غير موجود', 'error');
        return;
    }
    
    // زيادة عدد المشاهدات
    file.views++;
    localStorage.setItem('rakha_files', JSON.stringify(files));
    
    // عرض الملف في نافذة جديدة
    const fileData = atob(file.data);
    const byteArray = new Uint8Array(fileData.length);
    for (let i = 0; i < fileData.length; i++) {
        byteArray[i] = fileData.charCodeAt(i);
    }
    
    const blob = new Blob([byteArray], { type: file.type });
    const url = URL.createObjectURL(blob);
    
    window.open(url, '_blank');
}

// تنزيل ملف
function downloadFile(fileId) {
    const files = JSON.parse(localStorage.getItem('rakha_files') || '[]');
    const file = files.find(f => f.id === fileId);
    
    if (!file) {
        showAlert('الملف غير موجود', 'error');
        return;
    }
    
    // زيادة عدد التنزيلات
    file.downloads++;
    localStorage.setItem('rakha_files', JSON.stringify(files));
    
    // تنزيل الملف
    const fileData = atob(file.data);
    const byteArray = new Uint8Array(fileData.length);
    for (let i = 0; i < fileData.length; i++) {
        byteArray[i] = fileData.charCodeAt(i);
    }
    
    const blob = new Blob([byteArray], { type: file.type });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = file.originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAlert('تم بدء تنزيل الملف', 'success');
}

// حذف ملف
function deleteFile(fileId) {
    if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) {
        return;
    }
    
    const currentUser = getCurrentUser();
    let files = JSON.parse(localStorage.getItem('rakha_files') || '[]');
    const file = files.find(f => f.id === fileId);
    
    if (!file) {
        showAlert('الملف غير موجود', 'error');
        return;
    }
    
    // التحقق من الصلاحيات
    if (currentUser.role !== 'admin' && currentUser.id !== file.uploaderId) {
        showAlert('ليس لديك صلاحية لحذف هذا الملف', 'error');
        return;
    }
    
    files = files.filter(f => f.id !== fileId);
    localStorage.setItem('rakha_files', JSON.stringify(files));
    
    loadFiles();
    showAlert('تم حذف الملف بنجاح', 'success');
}

// إعداد فلترة الملفات
function setupFileFilters() {
    const searchInput = document.getElementById('fileSearch');
    const typeFilter = document.getElementById('fileTypeFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterFiles);
    }
    
    if (typeFilter) {
        typeFilter.addEventListener('change', filterFiles);
    }
}

// فلترة الملفات
function filterFiles() {
    const searchTerm = document.getElementById('fileSearch')?.value.toLowerCase() || '';
    const fileType = document.getElementById('fileTypeFilter')?.value || 'all';
    
    const files = JSON.parse(localStorage.getItem('rakha_files') || '[]');
    const currentUser = getCurrentUser();
    
    let filteredFiles = files.filter(file => {
        // فلترة حسب نوع الملف
        if (fileType !== 'all') {
            if (fileType === 'image' && !file.type.startsWith('image/')) return false;
            if (fileType === 'document' && !file.type.includes('document') && !file.type.includes('pdf')) return false;
            if (fileType === 'spreadsheet' && !file.type.includes('spreadsheet') && !file.type.includes('excel')) return false;
        }
        
        // فلترة حسب البحث
        if (searchTerm) {
            return file.name.toLowerCase().includes(searchTerm) ||
                   file.description?.toLowerCase().includes(searchTerm) ||
                   file.uploader.toLowerCase().includes(searchTerm);
        }
        
        return true;
    });
    
    // عرض الملفات المفلترة
    const publicFiles = filteredFiles.filter(f => f.isPublic);
    displayFiles('publicFiles', publicFiles, 'public');
    
    if (currentUser) {
        const privateFiles = filteredFiles.filter(f => !f.isPublic && f.uploaderId === currentUser.id);
        displayFiles('privateFiles', privateFiles, 'private');
    }
}

// دوال مساعدة
function getFileIcon(fileType) {
    if (fileType.includes('pdf')) return 'fa-file-pdf';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'fa-file-excel';
    if (fileType.includes('word') || fileType.includes('document')) return 'fa-file-word';
    if (fileType.includes('image')) return 'fa-file-image';
    if (fileType.includes('text')) return 'fa-file-alt';
    if (fileType.includes('presentation')) return 'fa-file-powerpoint';
    return 'fa-file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.animation = 'slideIn 0.3s reverse';
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

// إغلاق مودال الرفع
function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
}
