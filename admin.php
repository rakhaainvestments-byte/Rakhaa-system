<?php
session_start();
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    header('Location: index.php');
    exit;
}

$usersFile = 'users.json';
$filesFile = 'files.json';
$users = json_decode(file_get_contents($usersFile), true);
$filesData = json_decode(file_get_contents($filesFile), true);
$publicFiles = $filesData['public'] ?? [];
$privateFilesAll = $filesData['private'] ?? [];

// معالجة الطلبات
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['approve_user'])) {
        $userId = (int)$_POST['user_id'];
        foreach ($users as &$u) {
            if ($u['id'] === $userId) { $u['status'] = 'active'; break; }
        }
        file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
    elseif (isset($_POST['delete_user'])) {
        $userId = (int)$_POST['user_id'];
        $users = array_filter($users, fn($u) => $u['id'] !== $userId);
        file_put_contents($usersFile, json_encode(array_values($users), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        // حذف ملفاته الخاصة
        if (isset($filesData['private'][$userId])) {
            unset($filesData['private'][$userId]);
            file_put_contents($filesFile, json_encode($filesData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }
    }
    elseif (isset($_POST['delete_file'])) {
        $folder = $_POST['folder'];
        $fileId = $_POST['file_id'];
        if ($folder === 'public') {
            $filesData['public'] = array_filter($filesData['public'], fn($f) => $f['id'] != $fileId);
        } else {
            $ownerId = $_POST['owner_id'];
            if (isset($filesData['private'][$ownerId])) {
                $filesData['private'][$ownerId] = array_filter($filesData['private'][$ownerId], fn($f) => $f['id'] != $fileId);
            }
        }
        file_put_contents($filesFile, json_encode($filesData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
    header('Location: admin.php');
    exit;
}

// إعادة تحميل بعد التحديث
$users = json_decode(file_get_contents($usersFile), true);
$filesData = json_decode(file_get_contents($filesFile), true);
$publicFiles = $filesData['public'] ?? [];
$privateFilesAll = $filesData['private'] ?? [];

// تجهيز قائمة الملفات للعرض
$allFiles = [];
foreach ($publicFiles as $f) { $allFiles[] = array_merge($f, ['folder' => 'public']); }
foreach ($privateFilesAll as $uid => $arr) {
    foreach ($arr as $f) { $allFiles[] = array_merge($f, ['folder' => 'private', 'owner_id' => $uid]); }
}
usort($allFiles, fn($a,$b) => strtotime($b['upload_date'] ?? 'now') - strtotime($a['upload_date'] ?? 'now'));

$pendingUsers = array_filter($users, fn($u) => ($u['status'] ?? '') === 'pending');
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>لوحة تحكم المدير - رخاء</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        :root{--navy:#0a1929;--gold:#d4af37;--white:#fff;--gray-light:#e9ecef;--danger:#dc3545;--success:#28a745;}
        body{font-family:'Cairo',sans-serif;background:#f8f9fa;}
        .navbar{background:var(--navy);border-bottom:2px solid var(--gold);padding:12px 24px;display:flex;justify-content:space-between;align-items:center;color:white;}
        .logo i{color:var(--gold);font-size:28px;margin-left:8px;}
        .nav-links a{color:var(--gray-light);margin:0 10px;text-decoration:none;}
        .container{max-width:1280px;margin:30px auto;padding:0 20px;}
        h1{margin-bottom:25px;color:var(--navy);}
        .tabs{display:flex;gap:10px;margin-bottom:20px;}
        .tab-btn{padding:10px 20px;background:white;border:2px solid var(--gray-light);border-radius:8px;cursor:pointer;font-weight:600;}
        .tab-btn.active{background:var(--navy);border-color:var(--navy);color:var(--gold);}
        .panel{background:white;border-radius:16px;padding:20px;box-shadow:0 4px 12px rgba(0,0,0,0.05);}
        table{width:100%;border-collapse:collapse;}
        th{background:var(--navy);color:white;padding:12px;text-align:right;}
        td{padding:12px;border-bottom:1px solid var(--gray-light);}
        .badge{padding:4px 10px;border-radius:20px;font-size:12px;}
        .badge.active{background:var(--success);color:white;}
        .badge.pending{background:#ffc107;color:#0a1929;}
        .btn-icon{background:none;border:none;cursor:pointer;margin:0 5px;font-size:16px;}
        .btn-icon.approve{color:var(--success);}
        .btn-icon.delete{color:var(--danger);}
    </style>
</head>
<body>
<nav class="navbar">
    <div class="logo"><i class="fas fa-gem"></i> <span style="font-size:24px;">رخاء</span> <span style="font-size:14px;">للعاملين</span></div>
    <div class="nav-links">
        <a href="dashboard.php"><i class="fas fa-home"></i> الرئيسية</a>
        <a href="admin.php" style="color:var(--gold);"><i class="fas fa-cog"></i> لوحة التحكم</a>
    </div>
    <div><span><?php echo $_SESSION['user']['name']; ?> (مدير)</span> <a href="logout.php" style="color:var(--gold);margin-right:15px;"><i class="fas fa-sign-out-alt"></i></a></div>
</nav>

<div class="container">
    <h1><i class="fas fa-cog" style="color:var(--gold);"></i> لوحة تحكم المدير</h1>

    <div class="tabs">
        <button class="tab-btn active" data-tab="users">المستخدمين</button>
        <button class="tab-btn" data-tab="files">الملفات</button>
        <button class="tab-btn" data-tab="pending">طلبات الانضمام (<?php echo count($pendingUsers); ?>)</button>
    </div>

    <!-- المستخدمين -->
    <div id="usersPanel" class="panel">
        <table>
            <thead><tr><th>الاسم</th><th>البريد</th><th>الدور</th><th>الحالة</th><th>إجراءات</th></tr></thead>
            <tbody>
                <?php foreach ($users as $u): if ($u['role'] === 'admin') continue; ?>
                <tr>
                    <td><?php echo htmlspecialchars($u['name']); ?></td>
                    <td><?php echo htmlspecialchars($u['email']); ?></td>
                    <td><?php echo $u['role']; ?></td>
                    <td><span class="badge <?php echo $u['status']; ?>"><?php echo $u['status']==='active'?'نشط':($u['status']==='pending'?'معلق':'محظور'); ?></span></td>
                    <td>
                        <?php if ($u['status'] === 'pending'): ?>
                        <form method="post" style="display:inline;"><input type="hidden" name="user_id" value="<?php echo $u['id']; ?>"><button type="submit" name="approve_user" class="btn-icon approve"><i class="fas fa-check"></i></button></form>
                        <?php endif; ?>
                        <form method="post" style="display:inline;" onsubmit="return confirm('حذف المستخدم؟');"><input type="hidden" name="user_id" value="<?php echo $u['id']; ?>"><button type="submit" name="delete_user" class="btn-icon delete"><i class="fas fa-trash"></i></button></form>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <!-- الملفات -->
    <div id="filesPanel" class="panel" style="display:none;">
        <table>
            <thead><tr><th>الملف</th><th>الرافع</th><th>النوع</th><th>تاريخ</th><th>حذف</th></tr></thead>
            <tbody>
                <?php foreach ($allFiles as $f): ?>
                <tr>
                    <td><?php echo htmlspecialchars($f['name']); ?></td>
                    <td><?php echo htmlspecialchars($f['uploader']); ?></td>
                    <td><?php echo $f['folder']==='public'?'عام':'خاص'; ?></td>
                    <td><?php echo date('Y/m/d', strtotime($f['upload_date'])); ?></td>
                    <td>
                        <form method="post" onsubmit="return confirm('حذف الملف؟');">
                            <input type="hidden" name="folder" value="<?php echo $f['folder']; ?>">
                            <input type="hidden" name="file_id" value="<?php echo $f['id']; ?>">
                            <?php if ($f['folder']==='private'): ?><input type="hidden" name="owner_id" value="<?php echo $f['owner_id']; ?>"><?php endif; ?>
                            <button type="submit" name="delete_file" class="btn-icon delete"><i class="fas fa-trash"></i></button>
                        </form>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <!-- الطلبات المعلقة -->
    <div id="pendingPanel" class="panel" style="display:none;">
        <table>
            <thead><tr><th>الاسم</th><th>البريد</th><th>تاريخ الطلب</th><th>إجراءات</th></tr></thead>
            <tbody>
                <?php foreach ($pendingUsers as $u): ?>
                <tr>
                    <td><?php echo htmlspecialchars($u['name']); ?></td>
                    <td><?php echo htmlspecialchars($u['email']); ?></td>
                    <td><?php echo date('Y/m/d', strtotime($u['created_at'])); ?></td>
                    <td>
                        <form method="post" style="display:inline;"><input type="hidden" name="user_id" value="<?php echo $u['id']; ?>"><button type="submit" name="approve_user" class="btn-icon approve"><i class="fas fa-check"></i></button></form>
                        <form method="post" style="display:inline;" onsubmit="return confirm('رفض الطلب وحذفه؟');"><input type="hidden" name="user_id" value="<?php echo $u['id']; ?>"><button type="submit" name="delete_user" class="btn-icon delete"><i class="fas fa-times"></i></button></form>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

<script>
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = { users: document.getElementById('usersPanel'), files: document.getElementById('filesPanel'), pending: document.getElementById('pendingPanel') };
    tabs.forEach(tab => {
        tab.addEventListener('click', function(){
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            Object.values(panels).forEach(p => p.style.display = 'none');
            panels[this.dataset.tab].style.display = 'block';
        });
    });
</script>
</body>
</html>
