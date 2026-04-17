<?php
session_start();
if (!isset($_SESSION['user'])) {
    header('Location: index.php');
    exit;
}
$user = $_SESSION['user'];

// تحميل الملفات
$filesData = json_decode(file_get_contents('files.json'), true);
$publicFiles = $filesData['public'] ?? [];
$privateFiles = isset($filesData['private'][$user['id']]) ? $filesData['private'][$user['id']] : [];

// دمج للعرض في الصفحة الرئيسية
$recentFiles = array_merge(
    array_map(function($f) { return array_merge($f, ['folder' => 'public']); }, $publicFiles),
    array_map(function($f) { return array_merge($f, ['folder' => 'private']); }, $privateFiles)
);
usort($recentFiles, function($a, $b) { return strtotime($b['upload_date'] ?? 'now') - strtotime($a['upload_date'] ?? 'now'); });
$recentFiles = array_slice($recentFiles, 0, 4);

// إحصائيات
$users = json_decode(file_get_contents('users.json'), true);
$activeUsers = count(array_filter($users, fn($u) => ($u['status'] ?? '') === 'active'));
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>لوحة التحكم - رخاء</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        :root{--navy:#0a1929;--gold:#d4af37;--white:#fff;--gray-light:#e9ecef;--success:#28a745;--warning:#ffc107;}
        body{font-family:'Cairo',sans-serif;background:#f8f9fa;}
        .navbar{background:var(--navy);border-bottom:2px solid var(--gold);padding:12px 24px;display:flex;justify-content:space-between;align-items:center;color:white;}
        .logo i{color:var(--gold);font-size:28px;margin-left:8px;}
        .nav-links a{color:var(--gray-light);margin:0 10px;text-decoration:none;font-weight:600;}
        .nav-links a:hover{color:var(--gold);}
        .user-menu{display:flex;align-items:center;gap:15px;}
        .container{max-width:1280px;margin:30px auto;padding:0 20px;}
        .welcome{background:linear-gradient(135deg,var(--navy),#1a2a4a);color:white;padding:25px;border-radius:16px;margin-bottom:30px;border:1px solid var(--gold);}
        .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:20px;margin-bottom:30px;}
        .stat-box{background:white;padding:20px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.05);text-align:center;}
        .stat-box i{font-size:32px;color:var(--gold);margin-bottom:10px;}
        .section-header{display:flex;justify-content:space-between;margin-bottom:20px;}
        .files-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;}
        .file-card{background:white;padding:18px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.05);border-right:4px solid;}
        .file-card.public{border-color:var(--success);}
        .file-card.private{border-color:var(--warning);}
        .badge{padding:4px 10px;border-radius:20px;font-size:12px;}
        .badge.public{background:var(--success);color:white;}
        .badge.private{background:var(--warning);color:#0a1929;}
        .btn{background:linear-gradient(135deg,var(--gold),#f4d03f);border:none;padding:8px 16px;border-radius:8px;font-weight:600;cursor:pointer;color:#0a1929;text-decoration:none;}
    </style>
</head>
<body>
<nav class="navbar">
    <div class="logo"><i class="fas fa-gem"></i> <span style="font-size:24px;font-weight:700;">رخاء</span> <span style="font-size:14px;opacity:0.8;">للعاملين</span></div>
    <div class="nav-links">
        <a href="dashboard.php"><i class="fas fa-home"></i> الرئيسية</a>
        <?php if ($user['role'] === 'admin'): ?>
            <a href="admin.php"><i class="fas fa-cog"></i> لوحة التحكم</a>
        <?php endif; ?>
    </div>
    <div class="user-menu">
        <span><?php echo htmlspecialchars($user['name']); ?> (<?php echo $user['role']==='admin'?'مدير':'موظف'; ?>)</span>
        <a href="logout.php" style="color:var(--gold);"><i class="fas fa-sign-out-alt"></i> خروج</a>
    </div>
</nav>

<div class="container">
    <div class="welcome">
        <h1>مرحباً، <?php echo htmlspecialchars($user['name']); ?></h1>
        <p>نظام إدارة ملفات مكتب رخاء للتنمية المستدامة</p>
    </div>

    <div class="stats">
        <div class="stat-box"><i class="fas fa-globe"></i><h3><?php echo count($publicFiles); ?></h3><p>ملفات عامة</p></div>
        <div class="stat-box"><i class="fas fa-lock"></i><h3><?php echo count($privateFiles); ?></h3><p>ملفاتي الخاصة</p></div>
        <div class="stat-box"><i class="fas fa-users"></i><h3><?php echo $activeUsers; ?></h3><p>موظف نشط</p></div>
    </div>

    <div class="section-header">
        <h2>آخر الملفات</h2>
        <a href="#" class="btn" onclick="alert('وظيفة عرض الكل قيد التطوير')">عرض الكل</a>
    </div>

    <div class="files-grid">
        <?php if (empty($recentFiles)): ?>
            <div style="grid-column:1/-1;text-align:center;padding:40px;color:gray;"><i class="fas fa-folder-open" style="font-size:48px;"></i><p>لا توجد ملفات</p></div>
        <?php else: ?>
            <?php foreach ($recentFiles as $file): ?>
                <div class="file-card <?php echo $file['folder']; ?>">
                    <div style="display:flex;justify-content:space-between;">
                        <i class="fas fa-file"></i>
                        <span class="badge <?php echo $file['folder']; ?>"><?php echo $file['folder']==='public'?'عام':'خاص'; ?></span>
                    </div>
                    <h4><?php echo htmlspecialchars($file['name']); ?></h4>
                    <p style="color:gray;font-size:14px;"><?php echo htmlspecialchars($file['description'] ?? ''); ?></p>
                    <div style="display:flex;gap:15px;font-size:12px;color:gray;margin-top:10px;">
                        <span><i class="fas fa-user"></i> <?php echo htmlspecialchars($file['uploader']); ?></span>
                        <span><i class="fas fa-calendar"></i> <?php echo date('Y/m/d', strtotime($file['upload_date'])); ?></span>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>
</div>
</body>
</html>
