<?php
session_start();

// تهيئة ملفات JSON إذا لم تكن موجودة
if (!file_exists('users.json')) {
    $default_users = [
        ['id' => 1, 'name' => 'مدير النظام', 'email' => 'admin@rakha.sa', 'password' => password_hash('123456', PASSWORD_DEFAULT), 'role' => 'admin', 'status' => 'active', 'created_at' => date('Y-m-d H:i:s')],
        ['id' => 2, 'name' => 'موظف أول', 'email' => 'user1@rakha.sa', 'password' => password_hash('123456', PASSWORD_DEFAULT), 'role' => 'user', 'status' => 'active', 'created_at' => date('Y-m-d H:i:s')]
    ];
    file_put_contents('users.json', json_encode($default_users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}
if (!file_exists('files.json')) {
    file_put_contents('files.json', json_encode(['public' => [], 'private' => []]));
}

// إذا كان المستخدم مسجلاً بالفعل، توجيه للوحة التحكم
if (isset($_SESSION['user'])) {
    header('Location: dashboard.php');
    exit;
}

$error = '';
$success = '';

// معالجة تسجيل الدخول
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    
    $users = json_decode(file_get_contents('users.json'), true);
    foreach ($users as $user) {
        if ($user['email'] === $email && password_verify($password, $user['password'])) {
            if ($user['status'] !== 'active') {
                $error = 'الحساب غير مفعل، راجع الإدارة';
                break;
            }
            $_SESSION['user'] = [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role']
            ];
            header('Location: dashboard.php');
            exit;
        }
    }
    if (!$error) $error = 'بيانات الدخول غير صحيحة';
}

// معالجة طلب حساب جديد
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['register'])) {
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm = $_POST['confirm'] ?? '';
    
    if ($password !== $confirm) {
        $error = 'كلمتا المرور غير متطابقتين';
    } elseif (strlen($password) < 6) {
        $error = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    } else {
        $users = json_decode(file_get_contents('users.json'), true);
        foreach ($users as $u) {
            if ($u['email'] === $email) {
                $error = 'البريد الإلكتروني مسجل مسبقاً';
                break;
            }
        }
        if (!$error) {
            $newId = count($users) > 0 ? max(array_column($users, 'id')) + 1 : 1;
            $newUser = [
                'id' => $newId,
                'name' => $name,
                'email' => $email,
                'password' => password_hash($password, PASSWORD_DEFAULT),
                'role' => 'user',
                'status' => 'pending',
                'created_at' => date('Y-m-d H:i:s')
            ];
            $users[] = $newUser;
            file_put_contents('users.json', json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            $success = 'تم تقديم الطلب، بانتظار موافقة الإدارة';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>رخاء - دخول العاملين</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        :root{--navy:#0a1929;--gold:#d4af37;--white:#fff;--gray-light:#e9ecef;--gray:#6c757d;--success:#28a745;--danger:#dc3545;}
        body{font-family:'Cairo',sans-serif;background:linear-gradient(135deg,#051020,#0a1929);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;}
        .auth-card{background:var(--white);border-radius:16px;padding:30px;max-width:450px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,0.2);border:1px solid rgba(212,175,55,0.3);}
        .logo{text-align:center;margin-bottom:25px;}
        .logo i{font-size:40px;color:var(--gold);background:var(--navy);width:70px;height:70px;line-height:70px;border-radius:50%;border:2px solid var(--gold);}
        .logo h1{font-size:28px;color:var(--navy);margin-top:10px;}
        .tabs{display:flex;gap:5px;margin-bottom:25px;border-bottom:2px solid var(--gray-light);}
        .tab{flex:1;padding:12px;background:none;border:none;color:var(--gray);font-weight:600;cursor:pointer;position:relative;}
        .tab.active{color:var(--navy);}
        .tab.active::after{content:'';position:absolute;bottom:-2px;left:0;right:0;height:2px;background:var(--gold);}
        .form{display:flex;flex-direction:column;gap:18px;}
        .form-group{display:flex;flex-direction:column;gap:5px;}
        .input-wrapper{position:relative;}
        .input-wrapper i{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--gray);}
        .input-wrapper input{width:100%;padding:12px 40px 12px 12px;border:2px solid var(--gray-light);border-radius:8px;font-family:'Cairo';}
        .btn{background:linear-gradient(135deg,var(--gold),#f4d03f);border:none;padding:12px;border-radius:8px;font-weight:700;cursor:pointer;color:#0a1929;width:100%;}
        .message{padding:10px;border-radius:8px;margin-top:15px;text-align:center;}
        .error{background:var(--danger);color:white;}
        .success{background:var(--success);color:white;}
        .footer{margin-top:20px;text-align:center;font-size:14px;color:var(--gray);}
        .demo{background:var(--gray-light);padding:10px;border-radius:8px;margin-top:10px;}
    </style>
</head>
<body>
<div class="auth-card">
    <div class="logo">
        <i class="fas fa-gem"></i>
        <h1>رخاء</h1>
        <p style="color:var(--gray);">بوابة العاملين</p>
    </div>
    <div class="tabs">
        <button class="tab active" id="loginTab">تسجيل الدخول</button>
        <button class="tab" id="registerTab">طلب حساب</button>
    </div>

    <!-- نموذج تسجيل الدخول -->
    <form method="post" id="loginForm" class="form">
        <div class="form-group">
            <label>البريد الإلكتروني</label>
            <div class="input-wrapper"><i class="fas fa-envelope"></i><input type="email" name="email" placeholder="admin@rakha.sa" required></div>
        </div>
        <div class="form-group">
            <label>كلمة المرور</label>
            <div class="input-wrapper"><i class="fas fa-lock"></i><input type="password" name="password" placeholder="123456" required></div>
        </div>
        <button type="submit" name="login" class="btn"><i class="fas fa-sign-in-alt"></i> دخول</button>
        <p style="text-align:center;color:var(--gray);">خاص بموظفي مكتب رخاء فقط</p>
    </form>

    <!-- نموذج طلب حساب -->
    <form method="post" id="registerForm" class="form" style="display:none;">
        <div class="form-group">
            <label>الاسم الكامل</label>
            <div class="input-wrapper"><i class="fas fa-user"></i><input type="text" name="name" required></div>
        </div>
        <div class="form-group">
            <label>البريد الوظيفي</label>
            <div class="input-wrapper"><i class="fas fa-envelope"></i><input type="email" name="email" required></div>
        </div>
        <div class="form-group">
            <label>كلمة المرور</label>
            <div class="input-wrapper"><i class="fas fa-lock"></i><input type="password" name="password" required minlength="6"></div>
        </div>
        <div class="form-group">
            <label>تأكيد كلمة المرور</label>
            <div class="input-wrapper"><i class="fas fa-lock"></i><input type="password" name="confirm" required></div>
        </div>
        <button type="submit" name="register" class="btn"><i class="fas fa-paper-plane"></i> إرسال الطلب</button>
        <p style="text-align:center;color:var(--gray);">سيتم مراجعة الطلب من الإدارة</p>
    </form>

    <?php if ($error): ?>
        <div class="message error"><?php echo $error; ?></div>
    <?php elseif ($success): ?>
        <div class="message success"><?php echo $success; ?></div>
    <?php endif; ?>

    <div class="footer">
        <p>حسابات تجريبية:</p>
        <div class="demo">
            <span><i class="fas fa-user-tie"></i> admin@rakha.sa / 123456</span><br>
            <span><i class="fas fa-user"></i> user1@rakha.sa / 123456</span>
        </div>
    </div>
</div>
<script>
    document.getElementById('loginTab').addEventListener('click', function(){
        this.classList.add('active');
        document.getElementById('registerTab').classList.remove('active');
        document.getElementById('loginForm').style.display = 'flex';
        document.getElementById('registerForm').style.display = 'none';
    });
    document.getElementById('registerTab').addEventListener('click', function(){
        this.classList.add('active');
        document.getElementById('loginTab').classList.remove('active');
        document.getElementById('registerForm').style.display = 'flex';
        document.getElementById('loginForm').style.display = 'none';
    });
</script>
</body>
</html>
