import { Storage } from '../storage.js';

export const Auth = {
    register(name, email, password, avatar, address, role) {
        const users = Storage.get('users') || [];
        if (users.find(u => u.email === email)) return { success: false, msg: "El correo ya existe" };
        
        const newUser = { name, email, password, avatar: avatar || 'https://via.placeholder.com/100', address, role };
        users.push(newUser);
        Storage.set('users', users);
        return { success: true };
    },

    login(email, password) {
        const users = Storage.get('users') || [];
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            sessionStorage.setItem('active_session', JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, msg: "Credenciales incorrectas" };
    },

    logout() {
        sessionStorage.removeItem('active_session');
    },

    getCurrentUser() {
        return JSON.parse(sessionStorage.getItem('active_session'));
    },

    updateProfile(updatedData) {
        const current = this.getCurrentUser();
        const users = Storage.get('users');
        const index = users.findIndex(u => u.email === current.email);
        
        if (index !== -1) {
            users[index] = { ...users[index], ...updatedData };
            Storage.set('users', users);
            sessionStorage.setItem('active_session', JSON.stringify(users[index]));
            return true;
        }
        return false;
    }
};