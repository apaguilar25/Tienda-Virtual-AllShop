import {
  getData,
  initStorage,
  KEYS,
  saveData,
} from './storage.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializar Base de Datos Local
    await initStorage();
    
    // 2. Inicializar Sistema de Temas (Claro / Oscuro)
    initTheme();

    // 3. Monitorear Conectividad Red
    initNetworkMonitor();

    // 4. Registrar Service Worker para capacidades Offline
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('Service Worker Registrado Exitosamente'))
            .catch(err => console.error('Error registrando Service Worker:', err));
    }
    
    // Ejecutar lógica específica si existe la función en la vista actual
    if (window.initModule) window.initModule();
});

function initTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) {
        toggleBtn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
        toggleBtn.addEventListener('click', () => {
            const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', nextTheme);
            localStorage.setItem('theme', nextTheme);
            toggleBtn.textContent = nextTheme === 'dark' ? '☀️' : '🌙';
        });
    }
}

function initNetworkMonitor() {
    const badge = document.getElementById('network-status');
    if (!badge) return;

    function updateStatus() {
        if (navigator.onLine) {
            badge.textContent = "● En Línea";
            badge.style.backgroundColor = "rgba(52, 199, 89, 0.2)";
            badge.style.color = "var(--ios-success)";
            sincronizarColaOffline();
        } else {
            badge.textContent = "● Modo Offline";
            badge.style.backgroundColor = "rgba(255, 59, 48, 0.2)";
            badge.style.color = "var(--ios-danger)";
        }
    }

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus(); // Estado inicial
}

function sincronizarColaOffline() {
    const queue = JSON.parse(localStorage.getItem(KEYS.OFFLINE_QUEUE)) || [];
    if (queue.length === 0) return;

    const orders = getData(KEYS.ORDERS);
    queue.forEach(order => {
        order.status = 'Pendiente'; // Ya en línea, pasa al flujo del Admin
        orders.push(order);
    });

    saveData(KEYS.ORDERS, orders);
    localStorage.removeItem(KEYS.OFFLINE_QUEUE);
    alert(`📦 ¡Conexión restablecida! Se han procesado y sincronizado (${queue.length}) órdenes pendientes.`);
    if (window.initModule) window.initModule(); // Recargar vista activa
}