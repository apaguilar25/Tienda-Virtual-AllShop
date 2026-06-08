import { Auth } from './modules/auth.js';
import { Storage } from './storage.js';

export function initializeShell() {
    Storage.initStructure();
    
    // Gestión del Modo de Iluminación
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
        if (localStorage.getItem('ui-theme') === 'dark') document.body.classList.add('dark-theme');
        toggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            localStorage.setItem('ui-theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
        });
    }

    // Visibilidad de Pestañas según Rol Administrativo
    const user = Auth.getUser();
    if (user) {
        const profileTab = document.getElementById('tab-user-node');
        if (profileTab) profileTab.href = "cuenta.html";
        if (user.role === 'admin') {
            const adminTab = document.getElementById('tab-admin-node');
            if (adminTab) adminTab.style.display = 'flex';
        }
    }

    // Monitoreo de Red
    const badge = document.getElementById('network-badge');
    if (badge) {
        const check = () => {
            badge.textContent = navigator.onLine ? "● Red Conectada" : "● Modo Autónomo Local";
            badge.style.color = navigator.onLine ? "var(--success)" : "var(--text-muted)";
        };
        window.addEventListener('online', check);
        window.addEventListener('offline', check);
        check();
    }

    // Sincronización Automática en Segundo Plano
    window.addEventListener('online', () => {
        const queue = Storage.get('offline_orders') || [];
        if (queue.length > 0) {
            const currentOrders = Storage.get('orders') || [];
            Storage.set('orders', [...currentOrders, ...queue]);
            Storage.set('offline_orders', []);
            alert("Información de transacciones locales sincronizada correctamente.");
            window.location.reload();
        }
    });
}