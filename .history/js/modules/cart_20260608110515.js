import { Storage } from '../storage.js';

let memBag = [];

export const Cart = {
    content() { return memBag; },
    add(product) {
        const match = memBag.find(item => item.id === product.id);
        if (match) match.quantity++;
        else memBag.push({ ...product, quantity: 1 });
    },
    updateQty(id, amount) {
        const match = memBag.find(item => item.id === id);
        if (match) {
            match.quantity += amount;
            if (match.quantity <= 0) memBag = memBag.filter(item => item.id !== id);
        }
    },
    getBill() {
        const total = memBag.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return { sub: total, tot: total };
    },
    clear() { memBag = []; },
    checkout(email) {
        const bill = this.getBill();
        const order = { id: Date.now(), user: email, items: [...memBag], total: bill.tot, status: 'Pendiente', date: new Date().toLocaleDateString() };
        
        if (navigator.onLine) {
            const db = Storage.get('orders') || [];
            db.push(order);
            Storage.set('orders', db);
            this.clear();
            return "synchronized";
        } else {
            const queue = Storage.get('offline_orders') || [];
            queue.push(order);
            Storage.set('offline_orders', queue);
            this.clear();
            return "queued";
        }
    }
};