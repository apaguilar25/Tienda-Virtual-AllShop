import {
  getData,
  KEYS,
  saveData,
} from './storage.js';

window.initModule = function() {
    setupTabs();
    setupAuthLogic();
    checkCurrentSession();
};

function setupTabs() {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const formRecover = document.getElementById('form-recover');

    if(!tabLogin) return;

    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        formLogin.classList.add('active');
        formRegister.classList.remove('active');
        formRecover.classList.remove('active');
    });

    tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        formRegister.classList.add('active');
        formLogin.classList.remove('active');
        formRecover.classList.remove('active');
    });

    document.getElementById('go-recover').addEventListener('click', (e) => {
        e.preventDefault();
        formLogin.classList.remove('active');
        formRecover.classList.add('active');
    });

    document.getElementById('back-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        formRecover.classList.remove('active');
        formLogin.classList.add('active');
    });
}

function setupAuthLogic() {
    // Registro
    document.getElementById('form-register').addEventListener('submit', (e) => {
        e.preventDefault();
        const users = getData(KEYS.USERS);
        const email = document.getElementById('reg-email').value;

        if (users.find(u => u.email === email)) {
            alert('❌ El correo ya está registrado.');
            return;
        }

        const newUser = {
            name: document.getElementById('reg-name').value,
            email: email,
            pass: document.getElementById('reg-pass').value,
            role: 'client',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            address: ''
        };

        users.push(newUser);
        saveData(KEYS.USERS, users);
        alert('🎉 Cuenta creada con éxito. Ya puedes iniciar sesión.');
        document.getElementById('tab-login').click();
    });

    // Login
    document.getElementById('form-login').addEventListener('submit', (e) => {
        e.preventDefault();
        const users = getData(KEYS.USERS);
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-pass').value;

        const user = users.find(u => u.email === email && u.pass === pass);
        if (!user) {
            alert('❌ Credenciales incorrectas.');
            return;
        }

        sessionStorage.setItem(KEYS.SESSION, JSON.stringify(user));
        checkCurrentSession();
    });

    // Recuperación
    document.getElementById('form-recover').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('recover-email').value;
        const users = getData(KEYS.USERS);
        const user = users.find(u => u.email === email);

        if(user) {
            alert(`🔑 Clave Temporal del usuario: ${user.pass}`);
        } else {
            alert('❌ Correo no encontrado.');
        }
    });

    // Modificar Perfil
    document.getElementById('form-profile').addEventListener('submit', (e) => {
        e.preventDefault();
        const session = JSON.parse(sessionStorage.getItem(KEYS.SESSION));
        const users = getData(KEYS.USERS);

        const index = users.findIndex(u => u.email === session.email);
        if(index !== -1) {
            users[index].name = document.getElementById('prof-name').value;
            users[index].avatar = document.getElementById('prof-avatar-url').value;
            users[index].address = document.getElementById('prof-address').value;
            
            saveData(KEYS.USERS, users);
            sessionStorage.setItem(KEYS.SESSION, JSON.stringify(users[index]));
            alert('✅ Datos del perfil actualizados.');
            checkCurrentSession();
        }
    });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', () => {
        sessionStorage.removeItem(KEYS.SESSION);
        window.location.reload();
    });
}

function checkCurrentSession() {
    const session = JSON.parse(sessionStorage.getItem(KEYS.SESSION));
    const authBox = document.getElementById('auth-forms-box');
    const profileBox = document.getElementById('profile-box');

    if (session) {
        authBox.classList.add('hidden');
        profileBox.classList.remove('hidden');

        document.getElementById('profile-avatar').src = session.avatar;
        document.getElementById('profile-title-name').textContent = session.name;
        document.getElementById('profile-role-badge').textContent = session.role === 'admin' ? 'Administrador' : 'Cliente';

        document.getElementById('prof-name').value = session.name;
        document.getElementById('prof-avatar-url').value = session.avatar;
        document.getElementById('prof-address').value = session.address || '';

        if(session.role === 'admin') {
            document.getElementById('admin-shortcut-container').classList.remove('hidden');
        }
    } else {
        authBox.classList.remove('hidden');
        profileBox.classList.add('hidden');
        document.getElementById('admin-shortcut-container').classList.add('hidden');
    }
}