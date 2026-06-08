import { Storage } from '../storage.js';

let cart = [];

export const Cart = {
    get() { return cart; },
    add(product) {
        const item = cart.find(i => i.id === product.id);
        if (item) item.quantity++;
        else cart.push({ ...product, quantity: 1 });
    },
    remove(id) {
        cart = cart.filter(i => i.id !== id);
    },
    changeQty(id, amount) {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.quantity += amount;
            if (item.quantity <= 0) this.remove(id);
        }
    },
    clear() { cart = []; },
    getTotals() {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return { subtotal: total, total };
    },

    processCheckout(userEmail) {
        const totals = this.getTotals();
        const order = {
            id: Date.now(),
            email: userEmail,
            items: [...cart],
            total: totals.total,
            status: 'Pendiente',
            date: new Date().toLocaleDateString()
        };

        if (navigator.onLine) {
            const orders = Storage.get('orders') || [];
            orders.push(order);
            Storage.set('orders', orders);
            this.clear();
            return { status: 'completed', msg: '¡Compra completada con éxito!' };
        } else {
            // Guardar en cola de espera offline
            const queue = Storage.get('offline_queue') || [];
            queue.push(order);
            Storage.set('offline_queue', queue);
            this.clear();
            return { status: 'queued', msg: 'Sin conexión. Pedido guardado en cola para sincronizar.' };
        }
    }
};