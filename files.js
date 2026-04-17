// files.js - منطق صفحة الملفات
const FileManager = {
    currentUser: null,

    init: function(user) {
        this.currentUser = user;
        this.attachEvents();
        this.loadFiles();
    },

    attachEvents: function() {
        document.getElementById('uploadFileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.uploadFile();
        });

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab + 'Tab').classList.add('active');
            });
        });
    },

    uploadFile: function() {
        const fileInput = document.getElementById('fileUpload');
        const fileNameInput = document.getElementById('fileName');
        const fileType = document.querySelector('input[name="fileType"]:checked').value;

        const file = fileInput.files[0];
        if (!file) {
            alert('يرجى اختيار ملف');
            return;
        }

        let fileName = fileNameInput.value.trim();
        if (!fileName) {
            fileName = file.name.replace(/\.[^/.]+$/, '');
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Data = e.target.result.split(',')[1];
            const fileRecord = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                name: fileName + '.xlsx',
                originalName: file.name,
                ownerId: this.currentUser.id,
                ownerEmail: this.currentUser.email,
                type: fileType,
                uploadedAt: new Date().toISOString(),
                data: base64Data,
                size: file.size
            };

            if (fileType === 'public') {
                const publicFiles = Storage.get('publicFiles') || [];
                publicFiles.push(fileRecord);
                Storage.set('publicFiles', publicFiles);
            } else {
                const privateFiles = Storage.get(`privateFiles_${this.currentUser.id}`) || [];
                privateFiles.push(fileRecord);
                Storage.set(`privateFiles_${this.currentUser.id}`, privateFiles);
            }

            alert('تم رفع الملف بنجاح');
            fileInput.value = '';
            fileNameInput.value = '';
            this.loadFiles();
        };
        reader.readAsDataURL(file);
    },

    loadFiles: function() {
        this.loadPublicFiles();
        this.loadPrivateFiles();
    },

    loadPublicFiles: function() {
        const publicFiles = Storage.get('publicFiles') || [];
        const container = document.getElementById('publicFilesList');
        this.renderFileCards(container, publicFiles, true);
    },

    loadPrivateFiles: function() {
        const privateFiles = Storage.get(`privateFiles_${this.currentUser.id}`) || [];
        const container = document.getElementById('privateFilesList');
        this.renderFileCards(container, privateFiles, false);
    },

    renderFileCards: function(container, files, isPublic) {
        if (files.length === 0) {
            container.innerHTML = `<p class="no-files">لا توجد ملفات</p>`;
            return;
        }

        let html = '';
        files.forEach(file => {
            const date = new Date(file.uploadedAt).toLocaleDateString('ar-EG');
            const canDelete = (this.currentUser.role === 'admin') || (file.ownerId === this.currentUser.id);
            html += `
                <div class="file-card">
                    <div class="file-card-header">
                        <span class="file-icon">📄</span>
                        <div class="file-info">
                            <h4>${file.name}</h4>
                            <div class="file-meta">
                                <div>المالك: ${file.ownerEmail}</div>
                                <div>تاريخ الرفع: ${date}</div>
                            </div>
                        </div>
                    </div>
                    <div class="file-actions">
                        <button class="btn btn-sm btn-primary" onclick="FileManager.downloadFile('${file.id}', ${isPublic})">تنزيل</button>
                        ${canDelete ? `<button class="btn btn-sm btn-danger" onclick="FileManager.deleteFile('${file.id}', ${isPublic})">حذف</button>` : ''}
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    },

    downloadFile: function(fileId, isPublic) {
        let files;
        if (isPublic) {
            files = Storage.get('publicFiles') || [];
        } else {
            files = Storage.get(`privateFiles_${this.currentUser.id}`) || [];
        }
        const file = files.find(f => f.id === fileId);
        if (!file) {
            alert('الملف غير موجود');
            return;
        }

        // تحويل base64 إلى blob وتنزيله
        const byteCharacters = atob(file.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
    },

    deleteFile: function(fileId, isPublic) {
        if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) return;

        if (isPublic) {
            let files = Storage.get('publicFiles') || [];
            files = files.filter(f => f.id !== fileId);
            Storage.set('publicFiles', files);
        } else {
            let files = Storage.get(`privateFiles_${this.currentUser.id}`) || [];
            files = files.filter(f => f.id !== fileId);
            Storage.set(`privateFiles_${this.currentUser.id}`, files);
        }
        this.loadFiles();
    }
};
