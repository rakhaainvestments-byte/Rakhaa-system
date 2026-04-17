<?php
require_once 'config.php';
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    header('Location: dashboard.php');
    exit;
}

$users = getUsers();
$files = getFiles();
$publicFiles = $files['public'] ?? [];
$privateAll = $files['private'] ?? [];

// معالجة طلبات POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['approve'])) {
        $id = (int)$_POST['user_id'];
        foreach ($users as &$u) { if ($u['id'] === $id) { $u['status'] = 'active'; break; } }
        saveUsers($users);
    } elseif (isset($_POST['delete_user'])) {
        $id = (int)$_POST['user_id'];
        $users = array_filter($users, fn($u) => $u['id'] !== $id);
        saveUsers(array_values($users));
        // حذف ملفاته الخاصة
        if (isset($privateAll[$id])) unset($privateAll[$id]);
        $files['private'] = $privateAll;
        saveFiles($files);
    } elseif (isset($_POST['delete_file'])) {
        $folder = $_POST['folder'];
        $fileId = $_POST['file_id'];
        if ($folder === 'public') {
            $files['public'] = array_filter($publicFiles, fn($f) => $f['id'] != $fileId);
        } else {
            $owner = $_POST['owner_id'];
            if (isset($privateAll[$owner])) {
                $privateAll[$owner] = array_filter($privateAll[$owner], fn($f) => $f['id'] != $fileId);
                $files['private'] = $privateAll;
            }
        }
        saveFiles($files);
    }
    header('Location: admin.php');
    exit;
}

$pending = array_filter($users, fn($u) => ($u['status']??'') === 'pending');
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>إدارة المدير - رخاء</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        :root{--navy:#0a1929;--gold:#d4af37;--white:#fff;}
        body{font-family:'Cairo',sans-serif;background:#f8f9fa;}
        .navbar{background:var(--navy);border-bottom:2px solid var(--gold);padding:12px 24px;color:white;display:flex;justify-content:space-between;}
        .container{max-width:1280px;margin:30px auto;padding:20px;}
        table{width:100%;background:white;border-collapse:collapse;border-radius:12px;overflow:hidden;}
        th{background:var(--navy);color:white;padding:10px;}
        td{padding:10px;border-bottom:1px solid #ddd;}
        .btn{padding:5px 10px;background:var(--gold);border:none;border-radius:5px;cursor:pointer;}
        .tabs{display:flex;gap:10px;margin-bottom:20px;}
        .tab-btn{padding:10px 20px;background:white;border:2px solid #ddd;border-radius:8px;cursor:pointer;}
        .tab-btn.active{background:var(--navy);color:var(--gold);border-color:var(--navy);}
        .panel{display:none;}
        .panel.active{display:block;}
    </style>
</head>
<body>
<nav class="navbar">
    <div><i class="fas fa-gem" style="color:var(--gold);"></i> رخاء - لوحة المدير</div>
    <div><a href="dashboard.php" style="color:white;">الرئيسية</a> <a href="logout.php" style="color:var(--gold);margin-right:20px;">خروج</a></div>
</nav>
<div class="container">
    <div class="tabs">
        <button class="tab-btn active" data-tab="users">المستخدمين</button>
        <button class="tab-btn" data-tab="files">الملفات</button>
        <button class="tab-btn" data-tab="pending">طلبات الانضمام (<?php echo count($pending); ?>)</button>
    </div>

    <!-- المستخدمين -->
    <div id="usersPanel" class="panel active">
        <table>
            <tr><th>الاسم</th><th>البريد</th><th>الدور</th><th>الحالة</th><th>إجراءات</th></tr>
            <?php foreach($users as $u): if($u['role']==='admin') continue; ?>
            <tr><td><?php echo $u['name']; ?></td><td><?php echo $u['email']; ?></td><td><?php echo $u['role']; ?></td>
            <td><?php echo $u['status']; ?></td>
            <td>
                <?php if($u['status']==='pending'): ?><form method="post" style="display:inline;"><input type="hidden" name="user_id" value="<?php echo $u['id']; ?>"><button type="submit" name="approve" class="btn">تفعيل</button></form><?php endif; ?>
                <form method="post" style="display:inline;" onsubmit="return confirm('حذف؟');"><input type="hidden" name="user_id" value="<?php echo $u['id']; ?>"><button type="submit" name="delete_user" class="btn" style="background:#dc3545;color:white;">حذف</button></form>
            </td></tr>
            <?php endforeach; ?>
        </table>
    </div>

    <!-- الملفات -->
    <div id="filesPanel" class="panel">
        <table>
            <tr><th>الملف</th><th>الرافع</th><th>النوع</th><th>حذف</th></tr>
            <?php 
            $allFiles = array_merge(
                array_map(fn($f)=>array_merge($f,['folder'=>'public']), $publicFiles)
            );
            foreach($privateAll as $uid=>$arr) foreach($arr as $f) $allFiles[] = array_merge($f,['folder'=>'private','owner'=>$uid]);
            foreach($allFiles as $f): ?>
            <tr><td><?php echo $f['name']; ?></td><td><?php echo $f['uploader']; ?></td><td><?php echo $f['folder']; ?></td>
            <td><form method="post"><input type="hidden" name="folder" value="<?php echo $f['folder']; ?>"><input type="hidden" name="file_id" value="<?php echo $f['id']; ?>"><?php if($f['folder']=='private') echo '<input type="hidden" name="owner_id" value="'.$f['owner'].'">'; ?><button type="submit" name="delete_file" class="btn" style="background:#dc3545;color:white;">حذف</button></form></td></tr>
            <?php endforeach; ?>
        </table>
    </div>

    <!-- طلبات الانضمام -->
    <div id="pendingPanel" class="panel">
        <table>
            <tr><th>الاسم</th><th>البريد</th><th>تاريخ</th><th>إجراءات</th></tr>
            <?php foreach($pending as $u): ?>
            <tr><td><?php echo $u['name']; ?></td><td><?php echo $u['email']; ?></td><td><?php echo $u['created_at']; ?></td>
            <td><form method="post" style="display:inline;"><input type="hidden" name="user_id" value="<?php echo $u['id']; ?>"><button type="submit" name="approve" class="btn">تفعيل</button></form>
            <form method="post" style="display:inline;"><input type="hidden" name="user_id" value="<?php echo $u['id']; ?>"><button type="submit" name="delete_user" class="btn" style="background:#dc3545;color:white;">رفض</button></form></td></tr>
            <?php endforeach; ?>
        </table>
    </div>
</div>
<script>
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = {users:document.getElementById('usersPanel'), files:document.getElementById('filesPanel'), pending:document.getElementById('pendingPanel')};
    tabs.forEach(t=>{ t.addEventListener('click',()=>{ tabs.forEach(b=>b.classList.remove('active')); t.classList.add('active'); Object.values(panels).forEach(p=>p.classList.remove('active')); panels[t.dataset.tab].classList.add('active'); }); });
</script>
</body>
</html>
