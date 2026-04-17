<?php
// config.php
session_start();

// إعدادات Google OAuth
define('GOOGLE_CLIENT_ID', '238339995391-627kluslmk42koqfe2rm08jgofesteuc.apps.googleusercontent.com');
define('GOOGLE_CLIENT_SECRET', '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');
define('GOOGLE_REDIRECT_URI', 'https://rakhaasystem.qzz.io/google-callback.php'); // عدلها حسب نطاقك

// مسارات ملفات JSON
define('USERS_FILE', __DIR__ . '/users.json');
define('FILES_FILE', __DIR__ . '/files.json');

// تهيئة ملفات JSON إذا لم تكن موجودة
if (!file_exists(USERS_FILE)) {
    file_put_contents(USERS_FILE, json_encode([]));
}
if (!file_exists(FILES_FILE)) {
    file_put_contents(FILES_FILE, json_encode(['public' => [], 'private' => []]));
}

// دوال مساعدة
function getUsers() {
    return json_decode(file_get_contents(USERS_FILE), true) ?: [];
}
function saveUsers($users) {
    file_put_contents(USERS_FILE, json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}
function getFiles() {
    return json_decode(file_get_contents(FILES_FILE), true) ?: ['public' => [], 'private' => []];
}
function saveFiles($files) {
    file_put_contents(FILES_FILE, json_encode($files, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}
?>
