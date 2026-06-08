import { Storage } from '../storage.js';

export const AdminLogic = {
    compileRevenue() {
        const orders = Storage.get('orders') || [];
        return orders.reduce((sum, o) => sum + o.total, 0);
    },
    getTopThree() {
        const orders = Storage.get('orders') || [];
        const counters = {};
        orders.forEach(o => o.items.forEach(i => {
            counters[i.title] = (counters[i.title] || 0) + i.quantity;
        }));
        return Object.entries(counters).sort((a, b) => b[1] - a[1]).slice(0, 3);
    }
};