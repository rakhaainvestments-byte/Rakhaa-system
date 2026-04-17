// auth.js - إدارة تسجيل الدخول والجلسات
const Auth = {
    login: function(email, password) {
        const users = Storage.get('users') || [];
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            const sessionUser = { ...user };
            delete sessionUser.password;
            Storage.setSession('currentUser', sessionUser);
            return sessionUser;
        }
        return null;
    },

    googleSignIn: function(googleProfile) {
        const users = Storage.get('users') || [];
        let user = users.find(u => u.email === googleProfile.email);
        if (!user) {
            user = {
                id: Date.now().toString(),
                email: googleProfile.email,
                name: googleProfile.name,
                role: 'user',
                createdAt: new Date().toISOString()
            };
            users.push(user);
            Storage.set('users', users);
        }
        const sessionUser = { ...user };
        Storage.setSession('currentUser', sessionUser);
        return sessionUser;
    },

    logout: function() {
        Storage.removeSession('currentUser');
    },

    getCurrentUser: function() {
        return Storage.getSession('currentUser');
    },

    isLoggedIn: function() {
        return !!this.getCurrentUser();
    },

    isAdmin: function() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    }
};
