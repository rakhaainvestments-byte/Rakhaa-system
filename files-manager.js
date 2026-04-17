// files-manager.js - إدارة الملفات (عام/خاص)

const FILES_KEY = 'rokhaa_files';

function getAllFiles() {
  return JSON.parse(localStorage.getItem(FILES_KEY)) || [];
}

function saveAllFiles(files) {
  localStorage.setItem(FILES_KEY, JSON.stringify(files));
}

function addFile(fileObj) {
  const files = getAllFiles();
  files.push(fileObj);
  saveAllFiles(files);
}

function deleteFile(fileId) {
  let files = getAllFiles();
  files = files.filter(f => f.id !== fileId);
  saveAllFiles(files);
}

function getUserFiles(userEmail) {
  return getAllFiles().filter(f => f.owner === userEmail);
}

function getPublicFiles() {
  return getAllFiles().filter(f => f.isPublic === true);
}

function downloadFile(file) {
  const link = document.createElement('a');
  link.href = `data:${file.type};base64,${file.data}`;
  link.download = file.name;
  link.click();
}
