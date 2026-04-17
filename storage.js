// storage.js - التعامل مع localStorage و sessionStorage
const Storage = {
    set: function(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    get: function(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    },

    remove: function(key) {
        localStorage.removeItem(key);
    },

    setSession: function(key, value) {
        sessionStorage.setItem(key, JSON.stringify(value));
    },

    getSession: function(key) {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    },

    removeSession: function(key) {
        sessionStorage.removeItem(key);
    }
};
