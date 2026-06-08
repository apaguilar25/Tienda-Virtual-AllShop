import { Storage } from '../storage.js';

export const Catalog = {
    async fetchInitialProducts() {
        if (!localStorage.getItem('products')) {
            try {
                const res = await fetch('https://fakestoreapi.com/products');
                const data = await res.json();
                // Adaptamos la data agregando array de reviews
                const normalized = data.map(p => ({ ...p, reviews: [] }));
                Storage.set('products', normalized);
            } catch (err) {
                console.log("Error de red cargando API. Modo offline activo.");
                Storage.set('products', []);
            }
        }
    },

    getAll() {
        return Storage.get('products') || [];
    },

    saveAll(products) {
        Storage.set('products', products);
    },

    // CRUD Operaciones del Administrador
    create(product) {
        const products = this.getAll();
        product.id = Date.now();
        product.reviews = [];
        products.push(product);
        this.saveAll(products);
    },

    update(id, updatedProduct) {
        const products = this.getAll();
        const idx = products.findIndex(p => p.id == id);
        if(idx !== -1) {
            products[idx] = { ...products[idx], ...updatedProduct };
            this.saveAll(products);
        }
    },

    delete(id) {
        let products = this.getAll();
        products = products.filter(p => p.id != id);
        this.saveAll(products);
    },

    addReview(productId, review) {
        const products = this.getAll();
        const idx = products.findIndex(p => p.id == productId);
        if (idx !== -1) {
            products[idx].reviews.push(review);
            this.saveAll(products);
        }
    }
};