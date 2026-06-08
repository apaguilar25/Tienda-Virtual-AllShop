import { Storage } from '../storage.js';

export const Auth = {
    register(name, email, password, avatar, address, role) {
        const db = Storage.get('users') || [];
        if (db.some(u => u.email === email)) return false;
        db.push({ name, email, password, avatar: avatar || 'https://via.placeholder.com/80', address, role });
        Storage.set('users', db);
        return true;
    },
    login(email, password) {
        const db = Storage.get('users') || [];
        const user = db.find(u => u.email === email && u.password === password);
        if (user) {
            sessionStorage.setItem('session_user', JSON.stringify(user));
            return user;
        }
        return null;
    },
    logout() {
        sessionStorage.removeItem('session_user');
    },
    getUser() {
        return JSON.parse(sessionStorage.getItem('session_user'));
    },
    update(name, address, avatar) {
        const current = this.getUser();
        const db = Storage.get('users') || [];
        const index = db.findIndex(u => u.email === current.email);
        if (index !== -1) {
            db[index].name = name;
            db[index].address = address;
            if (avatar) db[index].avatar = avatar;
            Storage.set('users', db);
            sessionStorage.setItem('session_user', JSON.stringify(db[index]));
            return true;
        }
        return false;
    }
};