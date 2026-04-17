<?php
require_once 'config.php';
require_once 'vendor/autoload.php'; // مكتبة Google API

// إذا كان المستخدم مسجلاً بالفعل
if (isset($_SESSION['user'])) {
    header('Location: dashboard.php');
    exit;
}

$error = '';
$success = '';

// معالجة تسجيل الدخول العادي
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login'])) {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $users = getUsers();
    foreach ($users as $user) {
        if ($user['email'] === $email && password_verify($password, $user['password'])) {
            if ($user['status'] !== 'active') {
                $error = 'الحساب غير مفعل. راجع الإدارة.';
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

// معالجة التسجيل العادي (طلب حساب)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['register'])) {
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm = $_POST['confirm'] ?? '';
    if ($password !== $confirm) {
        $error = 'كلمتا المرور غير متطابقتين';
    } elseif (strlen($password) < 6) {
        $error = 'كلمة المرور 6 أحرف على الأقل';
    } else {
        $users = getUsers();
        $exists = false;
        foreach ($users as $u) {
            if ($u['email'] === $email) { $exists = true; break; }
        }
        if ($exists) {
            $error = 'البريد الإلكتروني مسجل مسبقاً';
        } else {
            $newId = count($users) > 0 ? max(array_column($users, 'id')) + 1 : 1;
            $newUser = [
                'id' => $newId,
                'name' => $name,
                'email' => $email,
                'password' => password_hash($password, PASSWORD_DEFAULT),
                'role' => 'user',
                'status' => 'pending',
                'created_at' => date('Y-m-d H:i:s'),
                'google_id' => null
            ];
            $users[] = $newUser;
            saveUsers($users);
            $success = 'تم تقديم الطلب، بانتظار موافقة الإدارة.';
        }
    }
}

// إنشاء رابط تسجيل الدخول بـ Google
$client = new Google_Client();
$client->setClientId(GOOGLE_CLIENT_ID);
$client->setClientSecret(GOOGLE_CLIENT_SECRET);
$client->setRedirectUri(GOOGLE_REDIRECT_URI);
$client->addScope("email");
$client->addScope("profile");
$googleLoginUrl = $client->createAuthUrl();
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
        .tabs{display:flex;gap:5px;margin-bottom:25px;border-bottom:2px solid var(--gray-light);}
        .tab{flex:1;padding:12px;background:none;border:none;color:var(--gray);font-weight:600;cursor:pointer;position:relative;}
        .tab.active{color:var(--navy);}
        .tab.active::after{content:'';position:absolute;bottom:-2px;left:0;right:0;height:2px;background:var(--gold);}
        .form{display:flex;flex-direction:column;gap:18px;}
        .input-wrapper{position:relative;}
        .input-wrapper i{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--gray);}
        .input-wrapper input{width:100%;padding:12px 40px 12px 12px;border:2px solid var(--gray-light);border-radius:8px;font-family:'Cairo';}
        .btn{background:linear-gradient(135deg,var(--gold),#f4d03f);border:none;padding:12px;border-radius:8px;font-weight:700;cursor:pointer;color:#0a1929;width:100%;}
        .btn-google{background:var(--white);border:1px solid var(--gray-light);color:var(--navy);}
        .divider{display:flex;align-items:center;text-align:center;margin:20px 0;color:var(--gray);}
        .divider::before,.divider::after{content:'';flex:1;border-bottom:1px solid var(--gray-light);}
        .divider span{padding:0 10px;}
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
        <h2 style="color:var(--navy); margin-top:10px;">رخاء</h2>
        <p style="color:var(--gray);">بوابة العاملين</p>
    </div>
    <div class="tabs">
        <button class="tab active" id="loginTab">تسجيل الدخول</button>
        <button class="tab" id="registerTab">طلب حساب</button>
    </div>

    <!-- نموذج تسجيل الدخول -->
    <form method="post" id="loginForm" class="form">
        <div class="input-wrapper"><i class="fas fa-envelope"></i><input type="email" name="email" placeholder="البريد الإلكتروني" required></div>
        <div class="input-wrapper"><i class="fas fa-lock"></i><input type="password" name="password" placeholder="كلمة المرور" required></div>
        <button type="submit" name="login" class="btn"><i class="fas fa-sign-in-alt"></i> دخول</button>
    </form>

    <!-- نموذج طلب حساب -->
    <form method="post" id="registerForm" class="form" style="display:none;">
        <div class="input-wrapper"><i class="fas fa-user"></i><input type="text" name="name" placeholder="الاسم الكامل" required></div>
        <div class="input-wrapper"><i class="fas fa-envelope"></i><input type="email" name="email" placeholder="البريد الوظيفي" required></div>
        <div class="input-wrapper"><i class="fas fa-lock"></i><input type="password" name="password" placeholder="كلمة المرور" required></div>
        <div class="input-wrapper"><i class="fas fa-lock"></i><input type="password" name="confirm" placeholder="تأكيد كلمة المرور" required></div>
        <button type="submit" name="register" class="btn"><i class="fas fa-paper-plane"></i> إرسال الطلب</button>
    </form>

    <div class="divider"><span>أو</span></div>
    <a href="<?php echo htmlspecialchars($googleLoginUrl); ?>" class="btn btn-google"><i class="fab fa-google"></i> الدخول بحساب Google</a>

    <?php if ($error): ?>
        <div class="message error"><?php echo $error; ?></div>
    <?php elseif ($success): ?>
        <div class="message success"><?php echo $success; ?></div>
    <?php endif; ?>

    <div class="footer">
        <p>تجريبي: admin@rakha.sa / 123456 &nbsp;|&nbsp; user1@rakha.sa / 123456</p>
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
