import { Storage } from '../storage.js';

export const Admin = {
    // Obtener métricas clave compiladas
    getDashboardMetrics() {
        const orders = Storage.get('orders') || [];
        const users = Storage.get('users') || [];
        
        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        const activeUsers = users.length; // En un entorno cliente simulamos activos vs registrados

        return {
            revenue: totalRevenue,
            totalUsers: users.length,
            activeUsers: activeUsers
        };
    },

    // Obtener los 3 productos más vendidos
    getTopSellingProducts() {
        const orders = Storage.get('orders') || [];
        const productCounts = {};

        orders.forEach(order => {
            order.items.forEach(item => {
                productCounts[item.title] = (productCounts[item.title] || 0) + item.quantity;
            });
        });

        // Ordenar de mayor a menor y tomar los 3 primeros
        return Object.entries(productCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
    },

    // Modificar el estado de envío de una orden (Pendiente, Enviado, Entregado)
    updateOrderStatus(orderId, newStatus) {
        const orders = Storage.get('orders') || [];
        const index = orders.findIndex(o => o.id == orderId);
        
        if (index !== -1) {
            orders[index].status = newStatus;
            Storage.set('orders', orders);
            return true;
        }
        return false;
    }
};