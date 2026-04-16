function checkAuth(redirect = true) {
    const user = JSON.parse(localStorage.getItem('rakha_current_user'));
    if (!user && redirect) window.location.href = 'index.html';
    return user;
}
function logout() {
    localStorage.removeItem('rakha_current_user');
    window.location.href = 'index.html';
}
