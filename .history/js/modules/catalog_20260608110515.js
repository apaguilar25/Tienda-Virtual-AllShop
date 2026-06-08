import { Storage } from '../storage.js';

export const Catalog = {
    async loadFromAPI() {
        const current = Storage.get('products');
        if (!current || current.length === 0) {
            try {
                const response = await fetch('https://fakestoreapi.com/products');
                const remoteData = await response.json();
                const initialized = remoteData.map(p => ({ ...p, reviews: [] }));
                Storage.set('products', initialized);
            } catch (e) {
                console.warn("API inaccesible. Modo sin conexión.");
            }
        }
    },
    getAll() { return Storage.get('products') || []; },
    save(arr) { Storage.set('products', arr); },
    addReview(id, rating, comment) {
        const list = this.getAll();
        const i = list.findIndex(p => p.id == id);
        if (i !== -1) {
            if (!list[i].reviews) list[i].reviews = [];
            list[i].reviews.push({ rating: Number(rating), comment });
            this.save(list);
        }
    }
};