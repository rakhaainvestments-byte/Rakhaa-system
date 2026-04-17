<?php
require_once 'config.php';
require_once 'vendor/autoload.php';

$client = new Google_Client();
$client->setClientId(GOOGLE_CLIENT_ID);
$client->setClientSecret(GOOGLE_CLIENT_SECRET);
$client->setRedirectUri(GOOGLE_REDIRECT_URI);
$client->addScope("email");
$client->addScope("profile");

if (!isset($_GET['code'])) {
    header('Location: index.php');
    exit;
}

$token = $client->fetchAccessTokenWithAuthCode($_GET['code']);
if (isset($token['error'])) {
    header('Location: index.php?error=google');
    exit;
}

$client->setAccessToken($token['access_token']);
$oauth2 = new Google_Service_Oauth2($client);
$googleUser = $oauth2->userinfo->get();

$email = $googleUser->email;
$name = $googleUser->name;
$googleId = $googleUser->id;
$picture = $googleUser->picture;

$users = getUsers();
$existingUser = null;
foreach ($users as $u) {
    if ($u['email'] === $email) {
        $existingUser = $u;
        break;
    }
}

if ($existingUser) {
    // المستخدم موجود، نحدث بيانات Google إذا لزم الأمر
    if (empty($existingUser['google_id'])) {
        // تحديث google_id
        foreach ($users as &$u) {
            if ($u['id'] === $existingUser['id']) {
                $u['google_id'] = $googleId;
                $u['picture'] = $picture;
                break;
            }
        }
        saveUsers($users);
    }
    if ($existingUser['status'] !== 'active') {
        header('Location: index.php?error=inactive');
        exit;
    }
    $_SESSION['user'] = [
        'id' => $existingUser['id'],
        'name' => $existingUser['name'],
        'email' => $existingUser['email'],
        'role' => $existingUser['role'],
        'picture' => $picture
    ];
} else {
    // مستخدم جديد عبر Google -> نضيفه بحالة pending (يحتاج موافقة مدير)
    $newId = count($users) > 0 ? max(array_column($users, 'id')) + 1 : 1;
    $newUser = [
        'id' => $newId,
        'name' => $name,
        'email' => $email,
        'password' => null,
        'role' => 'user',
        'status' => 'pending',
        'created_at' => date('Y-m-d H:i:s'),
        'google_id' => $googleId,
        'picture' => $picture
    ];
    $users[] = $newUser;
    saveUsers($users);
    $_SESSION['user'] = [
        'id' => $newId,
        'name' => $name,
        'email' => $email,
        'role' => 'user',
        'picture' => $picture
    ];
}

header('Location: dashboard.php');
exit;
?>
