import { initializeShell } from '../global.js';
import { Auth } from '../modules/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeShell();
    setupUI();

    // Gestión del Conmutador de Formularios (Login / Registro)
    const btnLog = document.getElementById('trigger-login');
    const btnReg = document.getElementById('trigger-reg');
    const fLog = document.getElementById('login-form');
    const fReg = document.getElementById('reg-form');

    if(btnLog && btnReg) {
        btnLog.addEventListener('click', () => {
            btnLog.classList.add('active'); btnReg.classList.remove('active');
            fLog.style.display = 'block'; fReg.style.display = 'none';
        });
        btnReg.addEventListener('click', () => {
            btnReg.classList.add('active'); btnLog.classList.remove('active');
            fReg.style.display = 'block'; fLog.style.display = 'none';
        });
    }

    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const user = Auth.login(document.getElementById('log-email').value, document.getElementById('log-pass').value);
        if (user) {
            setupUI();
            window.location.href = user.role === 'admin' ? "admin.html" : "tienda.html";
        } else alert("Credenciales incorrectas.");
    });

    document.getElementById('reg-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const ok = Auth.register(
            document.getElementById('reg-name').value,
            document.getElementById('reg-email').value,
            document.getElementById('reg-pass').value,
            document.getElementById('reg-avatar').value,
            document.getElementById('reg-address').value,
            document.getElementById('reg-role').value
        );
        if (ok) { alert("Usuario creado."); btnLog.click(); }
        else alert("El correo ya existe.");
    });

    document.getElementById('forget-pass').addEventListener('click', () => {
        const mail = prompt("Ingresa tu correo para restablecer la contraseña:");
        if(mail) alert("Instrucciones de recuperación guardadas localmente.");
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        Auth.logout();
        window.location.href = "index.html";
    });

    document.getElementById('profile-edit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        Auth.update(
            document.getElementById('edit-name').value,
            document.getElementById('edit-address').value,
            document.getElementById('edit-avatar').value
        );
        alert("Perfil actualizado.");
        setupUI();
    });

    function setupUI() {
        const u = Auth.getUser();
        const outBtn = document.getElementById('logout-btn');
        if (u) {
            document.getElementById('guest-zone').style.display = 'none';
            document.getElementById('user-zone').style.display = 'block';
            if(outBtn) outBtn.style.display = 'block';
            document.getElementById('page-title-context').textContent = "Perfil";

            document.getElementById('avatar-target').src = u.avatar;
            document.getElementById('name-target').textContent = u.name;
            document.getElementById('edit-name').value = u.name;
            document.getElementById('edit-address').value = u.address;
            document.getElementById('edit-avatar').value = u.avatar;
        } else {
            document.getElementById('guest-zone').style.display = 'block';
            document.getElementById('user-zone').style.display = 'none';
            if(outBtn) outBtn.style.display = 'none';
        }
    }
});