import { Storage } from '../storage.js';

export function initSyncManager() {
    window.addEventListener('online', () => {
        const queue = Storage.get('offline_queue') || [];
        if (queue.length > 0) {
            const orders = Storage.get('orders') || [];
            const syncedOrders = queue.map(order => ({
                ...order,
                status: 'Sincronizado'
            }));
            
            Storage.set('orders', [...orders, ...syncedOrders]);
            Storage.set('offline_queue', []);
            alert('📱 Conexión restablecida. Los pedidos offline se han sincronizado.');
            
            // Recargar interfaz si es necesario
            window.location.reload();
        }
    });
}