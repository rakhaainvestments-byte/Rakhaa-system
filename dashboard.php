<?php
require_once 'config.php';
if (!isset($_SESSION['user'])) {
    header('Location: index.php');
    exit;
}
$user = $_SESSION['user'];
$files = getFiles();
$publicFiles = $files['public'] ?? [];
$privateFiles = isset($files['private'][$user['id']]) ? $files['private'][$user['id']] : [];

// إحصائيات
$users = getUsers();
$activeUsers = count(array_filter($users, fn($u) => ($u['status'] ?? '') === 'active'));

// معالجة رفع ملف (من خلال POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['upload'])) {
    $target = $_POST['target'] ?? 'public';
    $name = trim($_POST['name'] ?? '');
    $desc = trim($_POST['desc'] ?? '');
    if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
        $tmp = $_FILES['file']['tmp_name'];
        $data = base64_encode(file_get_contents($tmp));
        $newFile = [
            'id' => time() . rand(100,999),
            'name' => $name,
            'description' => $desc,
            'original_name' => $_FILES['file']['name'],
            'type' => $_FILES['file']['type'],
            'size' => $_FILES['file']['size'],
            'data' => $data,
            'uploader' => $user['name'],
            'uploader_id' => $user['id'],
            'upload_date' => date('Y-m-d H:i:s')
        ];
        if ($target === 'public') {
            $files['public'][] = $newFile;
        } else {
            if (!isset($files['private'][$user['id']])) $files['private'][$user['id']] = [];
            $files['private'][$user['id']][] = $newFile;
        }
        saveFiles($files);
        header('Location: dashboard.php?uploaded=1');
        exit;
    }
}

// معالجة حذف ملف
if (isset($_GET['delete'])) {
    $folder = $_GET['folder'] ?? '';
    $fileId = $_GET['id'] ?? '';
    if ($folder === 'public') {
        $files['public'] = array_filter($files['public'], fn($f) => $f['id'] != $fileId);
    } elseif ($folder === 'private') {
        if (isset($files['private'][$user['id']])) {
            $files['private'][$user['id']] = array_filter($files['private'][$user['id']], fn($f) => $f['id'] != $fileId);
        }
    }
    saveFiles($files);
    header('Location: dashboard.php');
    exit;
}

// دمج الملفات للعرض
$recentFiles = array_merge(
    array_map(fn($f) => array_merge($f, ['folder' => 'public']), $publicFiles),
    array_map(fn($f) => array_merge($f, ['folder' => 'private']), $privateFiles)
);
usort($recentFiles, fn($a,$b) => strtotime($b['upload_date']) - strtotime($a['upload_date']));
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>لوحة التحكم - رخاء</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        :root{--navy:#0a1929;--gold:#d4af37;--white:#fff;--gray-light:#e9ecef;--success:#28a745;--warning:#ffc107;}
        body{font-family:'Cairo',sans-serif;background:#f8f9fa;}
        .navbar{background:var(--navy);border-bottom:2px solid var(--gold);padding:12px 24px;display:flex;justify-content:space-between;color:white;}
        .logo i{color:var(--gold);margin-left:8px;}
        .nav-links a{color:var(--gray-light);margin:0 10px;text-decoration:none;}
        .container{max-width:1280px;margin:30px auto;padding:0 20px;}
        .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:20px 0;}
        .stat-box{background:white;padding:20px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.05);text-align:center;}
        .btn{background:linear-gradient(135deg,var(--gold),#f4d03f);border:none;padding:8px 16px;border-radius:8px;cursor:pointer;}
        .files-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;}
        .file-card{background:white;padding:18px;border-radius:12px;border-right:4px solid;}
        .file-card.public{border-color:var(--success);}
        .file-card.private{border-color:var(--warning);}
        .badge{padding:4px 10px;border-radius:20px;font-size:12px;}
        .badge.public{background:var(--success);color:white;}
        .badge.private{background:var(--warning);color:#0a1929;}
        .modal{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);align-items:center;justify-content:center;}
        .modal-content{background:white;padding:20px;border-radius:12px;max-width:500px;width:90%;}
    </style>
</head>
<body>
<nav class="navbar">
    <div class="logo"><i class="fas fa-gem"></i> <span style="font-size:1.5rem;">رخاء</span></div>
    <div>
        <a href="dashboard.php" style="color:var(--gold);">الرئيسية</a>
        <?php if($user['role']==='admin'): ?><a href="admin.php" style="color:white; margin:0 15px;">لوحة التحكم</a><?php endif; ?>
    </div>
    <div>
        <span><?php echo $user['name']; ?> (<?php echo $user['role']==='admin'?'مدير':'موظف'; ?>)</span>
        <?php if(!empty($user['picture'])): ?><img src="<?php echo $user['picture']; ?>" style="width:35px;height:35px;border-radius:50%;margin:0 10px;"><?php endif; ?>
        <a href="logout.php" style="color:var(--gold);">خروج</a>
    </div>
</nav>

<div class="container">
    <div style="background:linear-gradient(135deg,var(--navy),#1a2a4a); color:white; padding:25px; border-radius:16px; margin-bottom:20px;">
        <h1>مرحباً، <?php echo $user['name']; ?></h1>
        <p>نظام إدارة الملفات - مكتب رخاء</p>
    </div>
    <div class="stats">
        <div class="stat-box"><i class="fas fa-globe"></i><h3><?php echo count($publicFiles); ?></h3><p>ملفات عامة</p></div>
        <div class="stat-box"><i class="fas fa-lock"></i><h3><?php echo count($privateFiles); ?></h3><p>ملفاتي الخاصة</p></div>
        <div class="stat-box"><i class="fas fa-users"></i><h3><?php echo $activeUsers; ?></h3><p>موظف نشط</p></div>
    </div>

    <button class="btn" onclick="openUploadModal()"><i class="fas fa-upload"></i> رفع ملف</button>

    <h2 style="margin:20px 0;">آخر الملفات</h2>
    <div class="files-grid">
        <?php foreach(array_slice($recentFiles,0,8) as $f): ?>
        <div class="file-card <?php echo $f['folder']; ?>">
            <div><i class="fas fa-file"></i> <span class="badge <?php echo $f['folder']; ?>"><?php echo $f['folder']=='public'?'عام':'خاص'; ?></span></div>
            <h4><?php echo htmlspecialchars($f['name']); ?></h4>
            <p><?php echo htmlspecialchars($f['description']??''); ?></p>
            <div style="font-size:12px;"><?php echo $f['uploader']; ?> - <?php echo date('Y/m/d',strtotime($f['upload_date'])); ?></div>
            <a href="download.php?folder=<?php echo $f['folder']; ?>&id=<?php echo $f['id']; ?>" class="btn" style="margin-top:8px;">تنزيل</a>
            <?php if($f['uploader_id']==$user['id'] || $user['role']=='admin'): ?>
            <a href="?delete&folder=<?php echo $f['folder']; ?>&id=<?php echo $f['id']; ?>" class="btn" style="background:#dc3545; color:white;" onclick="return confirm('حذف؟')">حذف</a>
            <?php endif; ?>
        </div>
        <?php endforeach; ?>
    </div>
</div>

<!-- مودال الرفع -->
<div id="uploadModal" class="modal">
    <div class="modal-content">
        <span onclick="closeUploadModal()" style="float:left;cursor:pointer;">&times;</span>
        <h2>رفع ملف</h2>
        <form method="post" enctype="multipart/form-data">
            <input type="text" name="name" placeholder="اسم الملف" required style="width:100%;padding:8px;margin:10px 0;">
            <textarea name="desc" placeholder="وصف" style="width:100%;padding:8px;"></textarea>
            <input type="file" name="file" required style="margin:10px 0;">
            <select name="target" style="padding:8px;width:100%;">
                <option value="public">عام (public.json)</option>
                <option value="private">خاص (private.json)</option>
            </select>
            <button type="submit" name="upload" class="btn" style="margin-top:15px;">رفع</button>
        </form>
    </div>
</div>
<script>
function openUploadModal(){ document.getElementById('uploadModal').style.display='flex'; }
function closeUploadModal(){ document.getElementById('uploadModal').style.display='none'; }
window.onclick = (e)=>{ if(e.target.classList.contains('modal')) e.target.style.display='none'; }
</script>
</body>
</html>
