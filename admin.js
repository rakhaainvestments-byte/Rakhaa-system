// admin.js - لوحة تحكم المشرف
const AdminPanel = {
    init: function() {
        this.loadUsers();
        this.loadAllFiles();
    },

    loadUsers: function() {
        const users = Storage.get('users') || [];
        const tbody = document.getElementById('usersTableBody');
        let html = '';
        users.forEach(user => {
            const date = user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-EG') : '-';
            html += `
                <tr>
                    <td>${user.email}</td>
                    <td>${user.name || '-'}</td>
                    <td>${user.role === 'admin' ? 'مشرف' : 'مستخدم'}</td>
                    <td>${date}</td>
                    <td>
                        ${user.role !== 'admin' ? `<button class="btn btn-sm btn-success" onclick="AdminPanel.makeAdmin('${user.id}')">ترقية لمشرف</button>` : ''}
                        <button class="btn btn-sm btn-danger" onclick="AdminPanel.deleteUser('${user.id}')">حذف</button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    },

    loadAllFiles: function() {
        const publicFiles = Storage.get('publicFiles') || [];
        const users = Storage.get('users') || [];
        let allFiles = [...publicFiles];
        
        users.forEach(user => {
            const privateFiles = Storage.get(`privateFiles_${user.id}`) || [];
            allFiles = allFiles.concat(privateFiles);
        });

        allFiles.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        const tbody = document.getElementById('allFilesTableBody');
        let html = '';
        allFiles.forEach(file => {
            const date = new Date(file.uploadedAt).toLocaleDateString('ar-EG');
            html += `
                <tr>
                    <td>${file.name}</td>
                    <td>${file.ownerEmail}</td>
                    <td>${file.type === 'public' ? 'عام' : 'خاص'}</td>
                    <td>${date}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="AdminPanel.deleteFile('${file.id}', '${file.type}', '${file.ownerId}')">حذف</button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html || '<tr><td colspan="5">لا توجد ملفات</td></tr>';
    },

    makeAdmin: function(userId) {
        const users = Storage.get('users') || [];
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex].role = 'admin';
            Storage.set('users', users);
            this.loadUsers();
            alert('تمت ترقية المستخدم إلى مشرف');
        }
    },

    deleteUser: function(userId) {
        if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
        const users = Storage.get('users') || [];
        const filtered = users.filter(u => u.id !== userId);
        Storage.set('users', filtered);
        // حذف ملفاته الخاصة أيضاً
        Storage.remove(`privateFiles_${userId}`);
        this.loadUsers();
        this.loadAllFiles();
    },

    deleteFile: function(fileId, type, ownerId) {
        if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) return;
        if (type === 'public') {
            let files = Storage.get('publicFiles') || [];
            files = files.filter(f => f.id !== fileId);
            Storage.set('publicFiles', files);
        } else {
            let files = Storage.get(`privateFiles_${ownerId}`) || [];
            files = files.filter(f => f.id !== fileId);
            Storage.set(`privateFiles_${ownerId}`, files);
        }
        this.loadAllFiles();
    }
};
