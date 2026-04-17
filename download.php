<?php
require_once 'config.php';
if (!isset($_SESSION['user'])) { header('Location: index.php'); exit; }
$folder = $_GET['folder'] ?? '';
$id = $_GET['id'] ?? '';
$files = getFiles();
$file = null;
if ($folder === 'public') {
    foreach($files['public'] as $f) if($f['id']==$id) { $file = $f; break; }
} elseif ($folder === 'private') {
    $userId = $_SESSION['user']['id'];
    if(isset($files['private'][$userId])) foreach($files['private'][$userId] as $f) if($f['id']==$id) { $file = $f; break; }
}
if(!$file) die('ملف غير موجود');
header('Content-Type: '.$file['type']);
header('Content-Disposition: attachment; filename="'.$file['original_name'].'"');
echo base64_decode($file['data']);
?>
